export interface AppSettings {
  apiEndpoint: string;
  googleSheetUrl: string;
  googleDriveFolderId: string;
  themeOverride: 'system' | 'light' | 'dark';
  adminPassword: string;
}

export interface AdminStats {
  submissionCount: number;
  lastUploadAt?: string;
  pendingUploads: number;
}
