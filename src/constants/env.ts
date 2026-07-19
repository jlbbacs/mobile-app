/**
 * EXPO_PUBLIC_-prefixed variables are inlined at build time by Expo and are
 * safe to reference on the client — do not put real secrets here. The Google
 * Apps Script Web App URL is not a secret by itself (see SECURITY.md), but
 * treat your deployed URL as sensitive if you enable the optional API_TOKEN
 * check in apps-script/Code.gs.
 */
export const DEFAULT_API_ENDPOINT = process.env.EXPO_PUBLIC_API_ENDPOINT ?? '';
export const DEFAULT_GOOGLE_SHEET_URL = process.env.EXPO_PUBLIC_GOOGLE_SHEET_URL ?? '';
export const DEFAULT_DRIVE_FOLDER_ID = process.env.EXPO_PUBLIC_DRIVE_FOLDER_ID ?? '';

/**
 * Matched against the optional API_TOKEN script property in apps-script/Code.gs.
 * Only provides light obfuscation, not real authentication — see docs/DEPLOYMENT.md.
 */
export const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? '';
