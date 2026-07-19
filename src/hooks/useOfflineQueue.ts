import { useCallback, useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { useSettings } from '../context/SettingsContext';
import type { QueuedSubmission } from '../types/registration';

export function useOfflineQueue() {
  const { settings } = useSettings();
  const [queue, setQueue] = useState<QueuedSubmission[]>([]);

  const refresh = useCallback(async () => {
    const items = await storageService.getQueue();
    setQueue(items);
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = syncService.onChange(() => {
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  useEffect(() => {
    syncService.start(async () => settings.apiEndpoint);
    return () => syncService.stop();
  }, [settings.apiEndpoint]);

  const retryNow = useCallback(async () => {
    await syncService.flushQueue(async () => settings.apiEndpoint);
  }, [settings.apiEndpoint]);

  return { queue, refresh, retryNow };
}
