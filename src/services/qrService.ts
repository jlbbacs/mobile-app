import { Linking, Share } from 'react-native';
import * as Print from 'expo-print';
import type { RegistrationRecord } from '../types/registration';

/**
 * Public QR image for a registration id. The QR encodes ONLY the id — never
 * personal data. Used for on-screen display and print templates; the
 * backend stores a permanent copy in the "QR Codes" Drive folder.
 */
export function qrImageUrl(registrationId: string, size = 500): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(registrationId)}`;
}

export const qrService = {
  /** Opens the QR PNG (Drive copy when available) so the user can save it. */
  async download(registrationId: string, qrCodeUrl?: string): Promise<void> {
    await Linking.openURL(qrCodeUrl || qrImageUrl(registrationId));
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
