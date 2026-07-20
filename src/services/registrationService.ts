import { API_TOKEN } from '../constants/env';
import type { RegistrationPayload, SubmitResult } from '../types/registration';

export class NoApiEndpointError extends Error {
  constructor() {
    super(
      'No valid API endpoint configured. Open Settings and paste the full Web App URL (https://script.google.com/macros/s/.../exec).'
    );
  }
}

/** The request never reached the server at all (offline, DNS failure, CORS block, etc). Safe to queue and retry silently. */
export class NetworkUnreachableError extends Error {
  constructor(public readonly cause?: unknown) {
    super('No internet connection or the server is unreachable.');
  }
}

/** The server was reached but rejected or failed the request. Retrying with the same data won't help without a real fix. */
export class ApiRequestError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Accepts the full Web App URL, or forgiving variants users actually paste:
 * a bare deployment ID ("AKfycb...") or a full URL missing the /exec suffix.
 * Returns a usable absolute URL, or null if the value can't be salvaged.
 */
export function normalizeAppsScriptEndpoint(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^AKfycb[\w-]+$/.test(value)) {
    return `https://script.google.com/macros/s/${value}/exec`;
  }
  if (!/^https?:\/\//i.test(value)) return null;
  if (/script\.google\.com\/macros\/s\/[\w-]+$/.test(value)) {
    return `${value}/exec`;
  }
  return value;
}

/**
 * Submits a registration to the configured Google Apps Script Web App endpoint.
 * The endpoint is expected to accept a single JSON POST body and respond with
 * { success: boolean, imageUrl?: string, message?: string }.
 */
export async function submitRegistration(
  rawApiEndpoint: string,
  payload: RegistrationPayload
): Promise<SubmitResult> {
  const apiEndpoint = normalizeAppsScriptEndpoint(rawApiEndpoint);
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
    throw new NetworkUnreachableError(err);
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
