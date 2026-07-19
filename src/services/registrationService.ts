import { API_TOKEN } from '../constants/env';
import type { RegistrationPayload, SubmitResult } from '../types/registration';

export class NoApiEndpointError extends Error {
  constructor() {
    super('No API endpoint configured. Set it in Settings first.');
  }
}

export class ApiRequestError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Submits a registration to the configured Google Apps Script Web App endpoint.
 * The endpoint is expected to accept a single JSON POST body and respond with
 * { success: boolean, imageUrl?: string, message?: string }.
 */
export async function submitRegistration(
  apiEndpoint: string,
  payload: RegistrationPayload
): Promise<SubmitResult> {
  if (!apiEndpoint) {
    throw new NoApiEndpointError();
  }

  const body = API_TOKEN ? { ...payload, apiKey: API_TOKEN } : payload;

  let response: Response;
  try {
    // Apps Script Web Apps don't handle CORS preflight requests, which the
    // browser triggers for a "Content-Type: application/json" POST. Sending
    // "text/plain" instead avoids the preflight (Code.gs still JSON.parses
    // the raw body regardless of the declared content type).
    response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiRequestError('No internet connection or the server is unreachable.', err);
  }

  if (!response.ok) {
    throw new ApiRequestError(`Server error (HTTP ${response.status}).`);
  }

  let json: SubmitResult;
  try {
    json = await response.json();
  } catch (err) {
    throw new ApiRequestError('Received an unexpected response from the server.', err);
  }

  if (!json.success) {
    throw new ApiRequestError(json.message ?? 'Google Sheet or Drive rejected the submission.');
  }

  return json;
}
