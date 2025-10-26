/**
 * Offline Manager - Handles offline data storage and synchronization
 * Provides offline-first functionality for university and group data
 *
 * BASIT YAPILANDIRMA:
 * - Kullanıcı bir university + group seçerse
 * - O grubun TÜM datası (haftalık ders programı) tek bir key'de kaydedilir
 * - Key: `unimaz-current-group-data`
 * - Value: Group object (tüm haftalık program, academic load, vs.)
 */

import { Group, University, UserPreferences } from "@/types";

// Storage keys for offline data - BASIT YAPILANDIRMA
const OFFLINE_KEYS = {
  CURRENT_GROUP_DATA: "unimaz-current-group-data", // Tek bir key: seçilen grubun tüm datası
  USER_PREFERENCES: "unimaz-offline-user-preferences",
  LAST_SYNC: "unimaz-offline-last-sync",
  OFFLINE_MODE: "unimaz-offline-mode",
} as const;

export interface CurrentGroupData {
  universityId: number;
  groupName: string;
  group: Group; // Tüm haftalık program, academic_load, vs.
  lastSync: number;
}

export interface OfflineUserPreferences extends UserPreferences {
  lastUpdated: number;
  isOffline: boolean;
}

/**
 * Check if the application is currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Set offline mode status
 */
export function setOfflineMode(isOffline: boolean): void {
  try {
    localStorage.setItem(OFFLINE_KEYS.OFFLINE_MODE, JSON.stringify(isOffline));
  } catch (error) {
    console.error("Error setting offline mode:", error);
  }
}

/**
 * Get offline mode status
 */
export function getOfflineMode(): boolean {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.OFFLINE_MODE);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error("Error getting offline mode:", error);
    return false;
  }
}

/**
 * BASIT YAPI: Seçilen grubun tüm datasını kaydet
 * Kullanıcı university + group seçtiğinde, o grubun tüm haftalık program datası kaydedilir
 */
export function saveCurrentGroupData(
  universityId: number,
  groupName: string,
  group: Group
): void {
  try {
    const data: CurrentGroupData = {
      universityId,
      groupName,
      group,
      lastSync: Date.now(),
    };
    localStorage.setItem(OFFLINE_KEYS.CURRENT_GROUP_DATA, JSON.stringify(data));
    console.log(`Saved current group data for ${groupName}`);
  } catch (error) {
    console.error("Error saving current group data:", error);
  }
}

/**
 * BASIT YAPI: Kaydedilen grubun datasını yükle
 */
export function loadCurrentGroupData(): CurrentGroupData | null {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.CURRENT_GROUP_DATA);
    if (!stored) return null;

    const data: CurrentGroupData = JSON.parse(stored);
    return data;
  } catch (error) {
    console.error("Error loading current group data:", error);
    return null;
  }
}

/**
 * Mevcut kaydedilmiş grup datası var mı kontrol et
 */
export function hasCurrentGroupData(): boolean {
  return loadCurrentGroupData() !== null;
}

/**
 * Save user preferences with offline metadata
 */
export function saveOfflineUserPreferences(preferences: UserPreferences): void {
  try {
    const offlinePreferences: OfflineUserPreferences = {
      ...preferences,
      lastUpdated: Date.now(),
      isOffline: isOffline(),
    };
    localStorage.setItem(
      OFFLINE_KEYS.USER_PREFERENCES,
      JSON.stringify(offlinePreferences)
    );
  } catch (error) {
    console.error("Error saving offline user preferences:", error);
  }
}

/**
 * Load user preferences from offline storage
 */
export function loadOfflineUserPreferences(): UserPreferences | null {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.USER_PREFERENCES);
    if (!stored) return null;

    const data: OfflineUserPreferences = JSON.parse(stored);
    return {
      universityId: data.universityId,
      groupName: data.groupName,
    };
  } catch (error) {
    console.error("Error loading offline user preferences:", error);
    return null;
  }
}

// Eski fonksiyonlar - artık kullanılmıyor (basitleştirme için kaldırıldı)
// Bunlar yerine saveCurrentGroupData / loadCurrentGroupData kullanılmalı

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): number {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.LAST_SYNC);
    return stored ? parseInt(stored) : 0;
  } catch (error) {
    console.error("Error getting last sync time:", error);
    return 0;
  }
}

/**
 * Set last sync timestamp
 */
export function setLastSyncTime(timestamp: number = Date.now()): void {
  try {
    localStorage.setItem(OFFLINE_KEYS.LAST_SYNC, timestamp.toString());
  } catch (error) {
    console.error("Error setting last sync time:", error);
  }
}

/**
 * Clear all offline data
 */
export function clearOfflineData(): void {
  try {
    Object.values(OFFLINE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing offline data:", error);
  }
}

/**
 * Get offline data size in bytes (approximate)
 */
export function getOfflineDataSize(): number {
  try {
    let totalSize = 0;
    Object.values(OFFLINE_KEYS).forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });
    return totalSize;
  } catch (error) {
    console.error("Error calculating offline data size:", error);
    return 0;
  }
}

/**
 * Check if offline data is stale (older than 7 days)
 */
export function isOfflineDataStale(): boolean {
  const lastSync = getLastSyncTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return lastSync < sevenDaysAgo;
}

/**
 * Initialize offline mode - called when app starts
 */
export function initializeOfflineMode(): void {
  // Set offline mode based on network status
  setOfflineMode(isOffline());

  // Listen for online/offline events
  window.addEventListener("online", () => {
    setOfflineMode(false);
    console.log("App is now online");
    // Trigger sync when coming back online
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "ONLINE" });
    }
  });

  window.addEventListener("offline", () => {
    setOfflineMode(true);
    console.log("App is now offline");
    // Notify service worker about offline status
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "OFFLINE" });
    }
  });

  // Listen for service worker messages
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "CACHE_UPDATED") {
        console.log("Cache updated, refreshing data...");
        // Trigger a custom event for components to listen to
        window.dispatchEvent(new CustomEvent("offlineDataUpdated"));
      }
    });
  }
}

/**
 * BASIT YAPI: Offline data export et
 */
export function exportOfflineData(): string {
  try {
    const currentGroup = loadCurrentGroupData();
    const userPreferences = loadOfflineUserPreferences();

    const data = {
      currentGroup,
      userPreferences,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error exporting offline data:", error);
    return "";
  }
}

/**
 * BASIT YAPI: Offline data import et
 */
export function importOfflineData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.currentGroup) {
      const { universityId, groupName, group, lastSync } = data.currentGroup;
      saveCurrentGroupData(universityId, groupName, group);
    }

    if (data.userPreferences) {
      saveOfflineUserPreferences(data.userPreferences);
    }

    return true;
  } catch (error) {
    console.error("Error importing offline data:", error);
    return false;
  }
}

/**
 * BASIT YAPI: Offline modda çalışabilir mi kontrol et
 */
export function canWorkOffline(): boolean {
  return hasCurrentGroupData();
}

/**
 * BASIT YAPI: Offline data istatistikleri
 */
export function getOfflineStats(): {
  hasUniversityData: boolean;
  hasGroupData: boolean;
  lastSync: number;
  dataSize: number;
  isStale: boolean;
} {
  const currentGroup = loadCurrentGroupData();
  return {
    hasUniversityData: currentGroup !== null,
    hasGroupData: currentGroup !== null,
    lastSync: currentGroup?.lastSync || 0,
    dataSize: getOfflineDataSize(),
    isStale: isOfflineDataStale(),
  };
}

/**
 * Preload essential data for offline use
 */
export async function preloadOfflineData(): Promise<boolean> {
  try {
    // This would typically fetch and cache essential data
    // For now, we'll just ensure the service worker is ready
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: "PRELOAD_DATA" });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error preloading offline data:", error);
    return false;
  }
}

/**
 * Clear stale offline data
 */
export function clearStaleOfflineData(): void {
  const lastSync = getLastSyncTime();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  if (lastSync < thirtyDaysAgo) {
    console.log("Clearing stale offline data...");
    clearOfflineData();
  }
}

/**
 * Check if offline data needs refresh
 */
export function needsOfflineRefresh(): boolean {
  const lastSync = getLastSyncTime();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return lastSync < oneDayAgo;
}
