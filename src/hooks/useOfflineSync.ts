/**
 * Custom hook for handling offline synchronization
 */

import { useState, useEffect, useCallback } from "react";
import { syncManager, SyncStatus } from "@/utils/syncManager";

interface UseOfflineSyncOptions {
  universityId?: number;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

interface UseOfflineSyncReturn {
  isOffline: boolean;
  lastSync: number;
  isStale: boolean;
  isSyncing: boolean;
  sync: () => Promise<void>;
  error: string | null;
}

export function useOfflineSync({
  universityId,
  autoSync = true,
  syncInterval = 30000, // 30 seconds
}: UseOfflineSyncOptions = {}): UseOfflineSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    syncManager.getStatus()
  );
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!universityId || !syncStatus.isOnline || syncStatus.isSyncing) return;

    setError(null);

    try {
      const success = await syncManager.syncUniversityData(universityId);
      if (!success) {
        setError("Sinxronizasiya uğursuz oldu");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sinxronizasiya xətası";
      setError(errorMessage);
      console.error("Sync failed:", err);
    }
  }, [universityId, syncStatus.isOnline, syncStatus.isSyncing]);

  useEffect(() => {
    // Listen for sync status changes
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    syncManager.addListener(handleStatusChange);

    // Auto-sync when online and data is stale
    if (autoSync && syncStatus.isOnline && universityId && syncStatus.isStale) {
      sync();
    }

    // Auto-sync interval when online
    let intervalId: NodeJS.Timeout | null = null;
    if (autoSync && syncStatus.isOnline && universityId) {
      intervalId = setInterval(() => {
        if (syncStatus.isStale) {
          sync();
        }
      }, syncInterval);
    }

    return () => {
      syncManager.removeListener(handleStatusChange);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    autoSync,
    universityId,
    syncStatus.isOnline,
    syncStatus.isStale,
    sync,
    syncInterval,
  ]);

  return {
    isOffline: !syncStatus.isOnline,
    lastSync: syncStatus.lastSync,
    isStale: syncStatus.isStale,
    isSyncing: syncStatus.isSyncing,
    sync,
    error,
  };
}
