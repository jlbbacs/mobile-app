import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { DEFAULT_API_ENDPOINT, DEFAULT_GOOGLE_SHEET_URL, DEFAULT_DRIVE_FOLDER_ID } from '../constants/env';
import type { AppSettings, AdminStats } from '../types/settings';
import type { QueuedSubmission } from '../types/registration';

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiEndpoint: DEFAULT_API_ENDPOINT,
  googleSheetUrl: DEFAULT_GOOGLE_SHEET_URL,
  googleDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
  themeOverride: 'system',
};

export const storageService = {
  async getSettings(): Promise<AppSettings> {
    const stored = await readJson<AppSettings>(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await writeJson(STORAGE_KEYS.SETTINGS, settings);
  },

  async getQueue(): Promise<QueuedSubmission[]> {
    const stored = await readJson<QueuedSubmission[]>(STORAGE_KEYS.SUBMISSION_QUEUE);
    return stored ?? [];
  },

  async saveQueue(queue: QueuedSubmission[]): Promise<void> {
    await writeJson(STORAGE_KEYS.SUBMISSION_QUEUE, queue);
  },

  async enqueue(submission: QueuedSubmission): Promise<void> {
    const queue = await this.getQueue();
    queue.push(submission);
    await this.saveQueue(queue);
  },

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getQueue();
    await this.saveQueue(queue.filter((item) => item.id !== id));
  },

  async updateQueueItem(id: string, patch: Partial<QueuedSubmission>): Promise<void> {
    const queue = await this.getQueue();
    const next = queue.map((item) => (item.id === id ? { ...item, ...patch } : item));
    await this.saveQueue(next);
  },

  async getFormDraft<T>(): Promise<T | null> {
    return readJson<T>(STORAGE_KEYS.FORM_DRAFT);
  },

  async saveFormDraft<T>(draft: T): Promise<void> {
    await writeJson(STORAGE_KEYS.FORM_DRAFT, draft);
  },

  async clearFormDraft(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.FORM_DRAFT);
  },

  async getAdminStats(): Promise<AdminStats> {
    const stored = await readJson<AdminStats>(STORAGE_KEYS.ADMIN_STATS);
    return stored ?? { submissionCount: 0, pendingUploads: 0 };
  },

  async saveAdminStats(stats: AdminStats): Promise<void> {
    await writeJson(STORAGE_KEYS.ADMIN_STATS, stats);
  },

  async incrementSubmissionCount(): Promise<void> {
    const stats = await this.getAdminStats();
    await this.saveAdminStats({
      ...stats,
      submissionCount: stats.submissionCount + 1,
      lastUploadAt: new Date().toISOString(),
    });
  },
};
