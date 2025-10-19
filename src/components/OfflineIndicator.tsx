/**
 * Offline Indicator Component
 * Shows when the app is offline and provides sync status
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  isOffline,
  getLastSyncTime,
  isOfflineDataStale,
} from "@/utils/offlineManager";
import { syncDataWhenOnline } from "@/utils/dataManager";

interface OfflineIndicatorProps {
  universityId?: number;
  className?: string;
}

export default function OfflineIndicator({
  universityId,
  className = "",
}: OfflineIndicatorProps) {
  const [isAppOffline, setIsAppOffline] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [isStale, setIsStale] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateStatus = () => {
    setIsAppOffline(isOffline());
    setLastSync(getLastSyncTime());
    setIsStale(isOfflineDataStale());
  };

  const handleSync = useCallback(async () => {
    if (!universityId || isAppOffline) return;

    setIsSyncing(true);
    try {
      await syncDataWhenOnline(universityId);
      updateStatus();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [universityId, isAppOffline]);

  useEffect(() => {
    // Initial check
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsAppOffline(false);
      if (universityId) {
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsAppOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [universityId, handleSync]);

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Heç vaxt";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "İndi";
    if (diffMins < 60) return `${diffMins} dəqiqə əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    return `${diffDays} gün əvvəl`;
  };

  if (!isAppOffline && !isStale && lastSync > 0) {
    return null; // Don't show anything if everything is up to date
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div
        className={`
        px-4 py-2 rounded-lg shadow-lg text-sm font-medium
        ${
          isAppOffline
            ? "bg-orange-500 text-white"
            : isStale
            ? "bg-yellow-500 text-white"
            : "bg-green-500 text-white"
        }
      `}
      >
        <div className="flex items-center gap-2">
          {isAppOffline ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Offline rejim</span>
            </>
          ) : isStale ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Məlumatlar köhnədir</span>
              {universityId && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 disabled:opacity-50"
                >
                  {isSyncing ? "Sinxronizasiya..." : "Yenilə"}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Sinxronizasiya edildi</span>
            </>
          )}
        </div>

        {lastSync > 0 && (
          <div className="text-xs mt-1 opacity-90">
            Son yenilənmə: {formatLastSync(lastSync)}
          </div>
        )}
      </div>
    </div>
  );
}
