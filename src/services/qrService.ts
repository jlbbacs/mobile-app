import { Linking, Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { RegistrationRecord } from '../types/registration';

/**
 * Public QR image for a registration id. The QR encodes ONLY the id — never
 * personal data. Used for on-screen display and print templates; the
 * backend stores a permanent copy in the "QR Codes" Drive folder.
 */
export function qrImageUrl(registrationId: string, size = 500): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(registrationId)}`;
}

export interface DownloadResult {
  success: boolean;
  message: string;
}

export const qrService = {
  /** Actually saves the QR PNG to the device (Photos on native, a real file download on web). */
  async download(registrationId: string, qrCodeUrl?: string): Promise<DownloadResult> {
    const url = qrCodeUrl || qrImageUrl(registrationId);
    const fileName = `${registrationId}.png`;

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
        return { success: true, message: 'QR code downloaded.' };
      } catch (err) {
        await Linking.openURL(url);
        return { success: false, message: 'Could not download directly, so it was opened in a new tab instead.' };
      }
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      return { success: false, message: 'Photo library permission was denied, so the QR code could not be saved.' };
    }
    try {
      const destination = new File(Paths.cache, fileName);
      const file = await File.downloadFileAsync(url, destination, { idempotent: true });
      await MediaLibrary.saveToLibraryAsync(file.uri);
      return { success: true, message: 'QR code saved to your photos.' };
    } catch (err) {
      return { success: false, message: 'Could not save the QR code. Please try again.' };
    }
  },

  async share(registrationId: string, qrCodeUrl?: string): Promise<void> {
    await Share.share({
      message: `Registration ID: ${registrationId}\nQR Code: ${qrCodeUrl || qrImageUrl(registrationId)}`,
    });
  },

  /** Opens the system print dialog with just the QR code (print-to-PDF covers "save as PDF"). */
  async print(registrationId: string): Promise<void> {
    const html = `
      <html>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;">
          <img src="${qrImageUrl(registrationId)}" style="width:280px;height:280px;" />
          <p style="font-size:18px;letter-spacing:1px;">${registrationId}</p>
        </body>
      </html>`;
    await Print.printAsync({ html });
  },

  /**
   * Prints a CR80-sized (85.6mm x 54mm) ID card with photo, name,
   * registration id, and QR code. Printing to PDF gives the exportable
   * PDF ID card.
   */
  async printIdCard(record: RegistrationRecord, orientation: 'landscape' | 'portrait' = 'landscape'): Promise<void> {
    const fullName = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ');
    const isLandscape = orientation === 'landscape';
    const cardWidth = isLandscape ? '85.6mm' : '54mm';
    const cardHeight = isLandscape ? '54mm' : '85.6mm';
    const html = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 10mm; font-family: sans-serif; }
            .card {
              width: ${cardWidth}; height: ${cardHeight};
              border: 1px solid #ccc; border-radius: 3mm;
              padding: 4mm; box-sizing: border-box;
              display: flex; ${isLandscape ? '' : 'flex-direction: column;'}
              align-items: center; gap: 4mm;
              background: #fff;
            }
            .photo { width: 22mm; height: 22mm; border-radius: 2mm; object-fit: cover; }
            .info { flex: 1; text-align: ${isLandscape ? 'left' : 'center'}; }
            .name { font-size: 11pt; font-weight: bold; margin: 0 0 1mm; }
            .id { font-size: 8pt; color: #444; margin: 0; letter-spacing: 0.5px; }
            .qr { width: 18mm; height: 18mm; }
          </style>
        </head>
        <body>
          <div class="card">
            ${record.imageUrl ? `<img class="photo" src="${record.imageUrl}" />` : ''}
            <div class="info">
              <p class="name">${fullName}</p>
              <p class="id">${record.registrationId}</p>
              <p class="id">${record.status || 'Active'}</p>
            </div>
            <img class="qr" src="${qrImageUrl(record.registrationId, 300)}" />
          </div>
        </body>
      </html>`;
    await Print.printAsync({ html });
  },
};
