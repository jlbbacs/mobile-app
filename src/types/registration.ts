export type Sex = 'Male' | 'Female' | 'Other';

export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Divorced';

export interface RegistrationFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  age: string;
  sex?: Sex;
  civilStatus?: CivilStatus;
  nationality?: string;
  phoneNumber: string;
  email?: string;
  completeAddress: string;
}

export interface DeviceMeta {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface RegistrationPayload extends RegistrationFormValues, DeviceMeta {
  imageBase64: string;
  imageFileName: string;
  imageMimeType: string;
}

export type SubmissionStatus = 'pending' | 'uploading' | 'success' | 'failed';

export interface QueuedSubmission {
  id: string;
  createdAt: string;
  payload: RegistrationPayload;
  status: SubmissionStatus;
  attempts: number;
  lastError?: string;
}

export interface SubmitResult {
  success: boolean;
  registrationId?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
  message?: string;
}

/** A full row from the Google Sheet, as returned by lookup/search/list. */
export interface RegistrationRecord {
  timestamp: string;
  registrationId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  sex: string;
  civilStatus: string;
  nationality: string;
  phoneNumber: string;
  email: string;
  completeAddress: string;
  imageUrl: string;
  qrCodeUrl: string;
  status: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface DashboardStats {
  total: number;
  today: number;
  male: number;
  female: number;
  other: number;
  averageAge: number;
  recent: Array<{ registrationId: string; name: string; timestamp: string }>;
}

export interface ScanHistoryEntry {
  registrationId: string;
  scannedAt: string;
}
