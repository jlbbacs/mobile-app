import { ApiRequestError, NetworkUnreachableError, NoApiEndpointError } from '../services/registrationService';
import { ImageValidationError } from '../services/imageService';

export function toFriendlyMessage(error: unknown): string {
  if (error instanceof NoApiEndpointError) {
    return error.message;
  }
  if (error instanceof ImageValidationError) {
    return error.message;
  }
  if (error instanceof NetworkUnreachableError) {
    return 'No internet connection. Your registration has been saved and will upload automatically.';
  }
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
