import NetInfo from '@react-native-community/netinfo';
import { storageService } from './storageService';
import { submitRegistration } from './registrationService';
import { NETWORK_RETRY } from '../constants/config';
import type { QueuedSubmission } from '../types/registration';

type Listener = () => void;

class SyncService {
  private isSyncing = false;
  private listeners = new Set<Listener>();
  private unsubscribeNetInfo?: () => void;

  start(getApiEndpoint: () => Promise<string>) {
    if (this.unsubscribeNetInfo) return;
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void this.flushQueue(getApiEndpoint);
      }
    });
  }

  stop() {
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = undefined;
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async flushQueue(getApiEndpoint: () => Promise<string>): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const apiEndpoint = await getApiEndpoint();
      if (!apiEndpoint) return;

      const queue = await storageService.getQueue();
      for (const item of queue) {
        if (item.status === 'success') continue;
        if (item.attempts >= NETWORK_RETRY.MAX_ATTEMPTS) continue;
        await this.trySubmit(apiEndpoint, item);
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  private async trySubmit(apiEndpoint: string, item: QueuedSubmission): Promise<void> {
    await storageService.updateQueueItem(item.id, { status: 'uploading' });
    this.notify();
    try {
      await submitRegistration(apiEndpoint, item.payload);
      await storageService.updateQueueItem(item.id, { status: 'success' });
      await storageService.incrementSubmissionCount();
      await storageService.removeFromQueue(item.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      await storageService.updateQueueItem(item.id, {
        status: 'failed',
        attempts: item.attempts + 1,
        lastError: message,
      });
    }
  }
}

export const syncService = new SyncService();
