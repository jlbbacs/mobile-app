export const STORAGE_KEYS = {
  SETTINGS: 'app.settings.v1',
  SUBMISSION_QUEUE: 'app.submissionQueue.v1',
  FORM_DRAFT: 'app.formDraft.v1',
  ADMIN_STATS: 'app.adminStats.v1',
  THEME_OVERRIDE: 'app.themeOverride.v1',
  SCAN_HISTORY: 'app.scanHistory.v1',
};

/** Accepts REG-YYYYMMDD-NNNNNN ids and UUIDs — the only payloads a valid QR may carry. */
export const REGISTRATION_ID_PATTERN =
  /^(REG-\d{8}-\d{6}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const SCAN_HISTORY_LIMIT = 50;

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  COMPRESS_QUALITY: 0.7,
  MAX_DIMENSION: 1600,
};

export const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;

export const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Divorced'] as const;

export const DEFAULT_ADMIN_PASSWORD = 'admin123';

export const NETWORK_RETRY = {
  MAX_ATTEMPTS: 5,
  BASE_DELAY_MS: 3000,
};
