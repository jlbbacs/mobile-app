import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { IMAGE_CONSTRAINTS } from '../constants/config';

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileSizeBytes: number;
}

export class ImageValidationError extends Error {}

async function toPickedImage(uri: string, mimeType: string): Promise<PickedImage> {
  const info = await FileSystem.getInfoAsync(uri);
  const fileSizeBytes = info.exists ? info.size : 0;
  return { uri, mimeType, fileSizeBytes };
}

function assertValidType(mimeType: string) {
  if (!IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ImageValidationError('Only JPG, PNG, or WEBP images are allowed.');
  }
}

export const imageService = {
  async requestCameraPermission(): Promise<boolean> {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    return cam.status === 'granted';
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
    return toPickedImage(asset.uri, mimeType);
  },

  async compress(image: PickedImage): Promise<PickedImage> {
    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: IMAGE_CONSTRAINTS.MAX_DIMENSION } }],
      { compress: IMAGE_CONSTRAINTS.COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    return toPickedImage(manipulated.uri, 'image/jpeg');
  },

  assertWithinSizeLimit(image: PickedImage) {
    if (image.fileSizeBytes > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
      throw new ImageValidationError('Image exceeds the 10MB size limit.');
    }
  },

  async toBase64(uri: string): Promise<string> {
    return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  },

  buildFileName(lastName: string, firstName: string, date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const timeStr = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    const clean = (s: string) => s.trim().replace(/\s+/g, '');
    return `${clean(lastName)}_${clean(firstName)}_${dateStr}_${timeStr}.jpg`;
  },
};
