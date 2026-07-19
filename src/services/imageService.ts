import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { IMAGE_CONSTRAINTS } from '../constants/config';

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileSizeBytes: number;
  base64?: string;
}

export class ImageValidationError extends Error {}

function toPickedImage(uri: string, mimeType: string, fileSizeBytes = 0): PickedImage {
  return { uri, mimeType, fileSizeBytes };
}

function assertValidType(mimeType: string) {
  if (!IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ImageValidationError('Only JPG, PNG, or WEBP images are allowed.');
  }
}

function base64ToByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export const imageService = {
  async requestCameraPermission(): Promise<boolean> {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    return cam.status === 'granted';
  },

  async requestLibraryPermission(): Promise<boolean> {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return lib.status === 'granted';
  },

  async capturePhoto(): Promise<PickedImage | null> {
    const granted = await this.requestCameraPermission();
    if (!granted) {
      throw new ImageValidationError('Camera permission was denied.');
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    assertValidType(mimeType);
    return toPickedImage(asset.uri, mimeType, asset.fileSize);
  },

  async pickFromGallery(): Promise<PickedImage | null> {
    const granted = await this.requestLibraryPermission();
    if (!granted) {
      throw new ImageValidationError('Photo library permission was denied.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    assertValidType(mimeType);
    return toPickedImage(asset.uri, mimeType, asset.fileSize);
  },

  /** Compresses the image and returns it with its base64 data already attached. */
  async compress(image: PickedImage): Promise<PickedImage> {
    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: IMAGE_CONSTRAINTS.MAX_DIMENSION } }],
      { compress: IMAGE_CONSTRAINTS.COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    const base64 = manipulated.base64 ?? '';
    return { uri: manipulated.uri, mimeType: 'image/jpeg', fileSizeBytes: base64ToByteLength(base64), base64 };
  },

  assertWithinSizeLimit(image: PickedImage) {
    if (image.fileSizeBytes > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
      throw new ImageValidationError('Image exceeds the 10MB size limit.');
    }
  },

  buildFileName(lastName: string, firstName: string, date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const timeStr = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    const clean = (s: string) => s.trim().replace(/\s+/g, '');
    return `${clean(lastName)}_${clean(firstName)}_${dateStr}_${timeStr}.jpg`;
  },
};
