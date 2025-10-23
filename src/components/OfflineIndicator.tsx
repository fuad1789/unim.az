"use client";

/**
 * Offline Indicator Component
 * Shows when the app is offline and provides sync status
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  isOffline,
  getLastSyncTime,
  isOfflineDataStale,
  canWorkOffline,
  getOfflineStats,
  needsOfflineRefresh,
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
  const [canWorkOfflineMode, setCanWorkOfflineMode] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineStats, setOfflineStats] = useState({
    hasUniversityData: false,
    hasGroupData: false,
    dataSize: 0,
  });

  const updateStatus = () => {
    setIsAppOffline(isOffline());
    setLastSync(getLastSyncTime());
    setIsStale(isOfflineDataStale());
    setCanWorkOfflineMode(canWorkOffline());
    setNeedsRefresh(needsOfflineRefresh());

    const stats = getOfflineStats();
    setOfflineStats({
      hasUniversityData: stats.hasUniversityData,
      hasGroupData: stats.hasGroupData,
      dataSize: stats.dataSize,
    });
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

    // Listen for offline data updates
    const handleOfflineDataUpdated = () => {
      updateStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offlineDataUpdated", handleOfflineDataUpdated);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "offlineDataUpdated",
        handleOfflineDataUpdated
      );
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

  // Don't show if everything is up to date and online
  if (!isAppOffline && !isStale && !needsRefresh && lastSync > 0) {
    return null;
  }

  const getStatusColor = () => {
    if (isAppOffline) return "bg-orange-500 text-white";
    if (isStale) return "bg-yellow-500 text-white";
    if (needsRefresh) return "bg-blue-500 text-white";
    return "bg-green-500 text-white";
  };

  const getStatusText = () => {
    if (isAppOffline) return "Offline rejim";
    if (isStale) return "Məlumatlar köhnədir";
    if (needsRefresh) return "Yenilənmə lazımdır";
    return "Sinxronizasiya edildi";
  };

  const getStatusIcon = () => {
    if (isAppOffline) return "animate-pulse";
    if (isStale || needsRefresh) return "animate-bounce";
    return "";
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div
        className={`
        px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-xs
        ${getStatusColor()}
      `}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 bg-white rounded-full ${getStatusIcon()}`}
          ></div>
          <span>{getStatusText()}</span>
          {!isAppOffline && (isStale || needsRefresh) && universityId && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 disabled:opacity-50"
            >
              {isSyncing ? "Sinxronizasiya..." : "Yenilə"}
            </button>
          )}
        </div>

        {lastSync > 0 && (
          <div className="text-xs mt-1 opacity-90">
            Son yenilənmə: {formatLastSync(lastSync)}
          </div>
        )}

        {/* Offline data status */}
        {isAppOffline && (
          <div className="text-xs mt-1 opacity-90">
            {canWorkOfflineMode ? (
              <span className="text-green-200">
                ✓ Offline məlumatlar mövcuddur
              </span>
            ) : (
              <span className="text-red-200">⚠ Offline məlumatlar yoxdur</span>
            )}
          </div>
        )}

        {/* Data size info */}
        {offlineStats.dataSize > 0 && (
          <div className="text-xs mt-1 opacity-75">
            Məlumat ölçüsü: {(offlineStats.dataSize / 1024).toFixed(1)} KB
          </div>
        )}
      </div>
    </div>
  );
}
