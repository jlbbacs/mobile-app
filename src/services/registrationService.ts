import { API_TOKEN } from '../constants/env';
import type {
  DashboardStats,
  RegistrationPayload,
  RegistrationRecord,
  SubmitResult,
} from '../types/registration';

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

interface ApiResponse extends SubmitResult {
  record?: RegistrationRecord;
  records?: RegistrationRecord[];
  stats?: DashboardStats;
}

/**
 * Posts one action to the Apps Script Web App and returns the parsed JSON.
 * All API traffic funnels through here so endpoint normalization, the CORS
 * workaround, and error classification stay in one place.
 */
async function postAction(rawApiEndpoint: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const apiEndpoint = normalizeAppsScriptEndpoint(rawApiEndpoint);
  if (!apiEndpoint) {
    throw new NoApiEndpointError();
  }

  const fullBody = API_TOKEN ? { ...body, apiKey: API_TOKEN } : body;

  let response: Response;
  try {
    // Apps Script Web Apps don't handle CORS preflight requests, which the
    // browser triggers for a "Content-Type: application/json" POST. Sending
    // "text/plain" instead avoids the preflight (Code.gs still JSON.parses
    // the raw body regardless of the declared content type).
    response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(fullBody),
    });
  } catch (err) {
    throw new NetworkUnreachableError(err);
  }

  if (!response.ok) {
    throw new ApiRequestError(`Server error (HTTP ${response.status}).`);
  }

  let json: ApiResponse;
  try {
    json = await response.json();
  } catch (err) {
    throw new ApiRequestError('Received an unexpected response from the server.', err);
  }

  if (!json.success) {
    throw new ApiRequestError(json.message ?? 'The server rejected the request.');
  }

  return json;
}

export async function submitRegistration(
  apiEndpoint: string,
  payload: RegistrationPayload
): Promise<SubmitResult> {
  return postAction(apiEndpoint, { action: 'register', ...payload });
}

export async function lookupRegistration(
  apiEndpoint: string,
  registrationId: string
): Promise<RegistrationRecord> {
  const json = await postAction(apiEndpoint, { action: 'lookup', registrationId });
  if (!json.record) throw new ApiRequestError('Record Not Found');
  return json.record;
}

export async function searchRegistrations(
  apiEndpoint: string,
  query: string
): Promise<RegistrationRecord[]> {
  const json = await postAction(apiEndpoint, { action: 'search', query });
  return json.records ?? [];
}

export async function updateRegistration(
  apiEndpoint: string,
  registrationId: string,
  fields: Partial<RegistrationRecord> & { imageBase64?: string; imageFileName?: string; imageMimeType?: string }
): Promise<RegistrationRecord> {
  const json = await postAction(apiEndpoint, { action: 'update', registrationId, ...fields });
  if (!json.record) throw new ApiRequestError('Record Not Found');
  return json.record;
}

export async function fetchDashboardStats(apiEndpoint: string): Promise<DashboardStats> {
  const json = await postAction(apiEndpoint, { action: 'stats' });
  if (!json.stats) throw new ApiRequestError('Received an unexpected response from the server.');
  return json.stats;
}

export async function listRegistrations(apiEndpoint: string): Promise<RegistrationRecord[]> {
  const json = await postAction(apiEndpoint, { action: 'list' });
  return json.records ?? [];
}
