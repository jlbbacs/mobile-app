import { ApiRequestError, NoApiEndpointError } from '../services/registrationService';
import { ImageValidationError } from '../services/imageService';

export function toFriendlyMessage(error: unknown): string {
  if (error instanceof NoApiEndpointError) {
    return 'The app is not configured yet. Go to Settings and set your Google Sheet API endpoint.';
  }
  if (error instanceof ImageValidationError) {
    return error.message;
  }
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (/network/i.test(error.message)) {
      return 'No internet connection. Your registration has been saved and will upload automatically.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
