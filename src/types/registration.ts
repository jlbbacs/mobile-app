export type Sex = 'Male' | 'Female' | 'Other';

export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Divorced';

export interface RegistrationFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  age: string;
  birthdate?: string;
  sex?: Sex;
  civilStatus?: CivilStatus;
  nationality?: string;
  phoneNumber: string;
  email?: string;
  completeAddress: string;
  remarks?: string;
}

export interface DeviceMeta {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface LocationMeta {
  latitude?: number;
  longitude?: number;
}

export interface RegistrationPayload extends RegistrationFormValues, DeviceMeta, LocationMeta {
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
  imageUrl?: string;
  message?: string;
}
