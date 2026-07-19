export interface AppSettings {
  apiEndpoint: string;
  googleSheetUrl: string;
  googleDriveFolderId: string;
  themeOverride: 'system' | 'light' | 'dark';
}

export interface AdminStats {
  submissionCount: number;
  lastUploadAt?: string;
  pendingUploads: number;
}
