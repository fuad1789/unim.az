/**
 * Offline Manager - Handles offline data storage and synchronization
 * Provides offline-first functionality for university and group data
 */

import { Group, University, UserPreferences } from "@/types";

// Storage keys for offline data
const OFFLINE_KEYS = {
  UNIVERSITY_DATA: "unimaz-offline-university-data",
  GROUP_DATA: "unimaz-offline-group-data",
  USER_PREFERENCES: "unimaz-offline-user-preferences",
  LAST_SYNC: "unimaz-offline-last-sync",
  OFFLINE_MODE: "unimaz-offline-mode",
} as const;

export interface OfflineData {
  universities: University[];
  groups: Record<number, Group[]>; // universityId -> groups
  lastSync: number;
  version: string;
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
 * Save university data for offline use
 */
export function saveOfflineUniversityData(universities: University[]): void {
  try {
    const data = {
      universities,
      lastSync: Date.now(),
      version: "1.0.0",
    };
    localStorage.setItem(OFFLINE_KEYS.UNIVERSITY_DATA, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving offline university data:", error);
  }
}

/**
 * Load university data from offline storage
 */
export function loadOfflineUniversityData(): University[] {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.UNIVERSITY_DATA);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return data.universities || [];
  } catch (error) {
    console.error("Error loading offline university data:", error);
    return [];
  }
}

/**
 * Save group data for a specific university offline
 */
export function saveOfflineGroupData(
  universityId: number,
  groups: Group[]
): void {
  try {
    const existingData = loadOfflineGroupData();
    const updatedData = {
      ...existingData,
      [universityId]: groups,
      lastSync: Date.now(),
      version: "1.0.0",
    };
    localStorage.setItem(OFFLINE_KEYS.GROUP_DATA, JSON.stringify(updatedData));
  } catch (error) {
    console.error("Error saving offline group data:", error);
  }
}

/**
 * Load group data for a specific university from offline storage
 */
export function loadOfflineGroupData(
  universityId?: number
): Record<number, Group[]> | Group[] {
  try {
    const stored = localStorage.getItem(OFFLINE_KEYS.GROUP_DATA);
    if (!stored) return universityId ? [] : {};

    const data = JSON.parse(stored);
    const groups = data[universityId || ""] || data;

    return universityId ? (Array.isArray(groups) ? groups : []) : groups;
  } catch (error) {
    console.error("Error loading offline group data:", error);
    return universityId ? [] : {};
  }
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

/**
 * Get available groups for a university from offline storage
 */
export function getOfflineAvailableGroups(universityId: number): string[] {
  const groups = loadOfflineGroupData(universityId) as Group[];
  if (!Array.isArray(groups)) return [];

  const groupNames = groups.map((group) => group.group_id || group.group);
  return [...new Set(groupNames.filter(Boolean))];
}

/**
 * Get specific group data from offline storage
 */
export function getOfflineGroupData(
  universityId: number,
  groupName: string
): Group | null {
  const groups = loadOfflineGroupData(universityId) as Group[];
  if (!Array.isArray(groups)) return null;

  return (
    groups.find(
      (group) => group.group_id === groupName || group.group === groupName
    ) || null
  );
}

/**
 * Check if offline data exists for a university
 */
export function hasOfflineData(universityId: number): boolean {
  const groups = loadOfflineGroupData(universityId) as Group[];
  return Array.isArray(groups) && groups.length > 0;
}

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
  });

  window.addEventListener("offline", () => {
    setOfflineMode(true);
    console.log("App is now offline");
  });
}

/**
 * Export offline data for backup
 */
export function exportOfflineData(): string {
  try {
    const data = {
      universities: loadOfflineUniversityData(),
      groups: loadOfflineGroupData(),
      userPreferences: loadOfflineUserPreferences(),
      lastSync: getLastSyncTime(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error exporting offline data:", error);
    return "";
  }
}

/**
 * Import offline data from backup
 */
export function importOfflineData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.universities) {
      saveOfflineUniversityData(data.universities);
    }

    if (data.groups) {
      Object.entries(data.groups).forEach(([universityId, groups]) => {
        saveOfflineGroupData(parseInt(universityId), groups as Group[]);
      });
    }

    if (data.userPreferences) {
      saveOfflineUserPreferences(data.userPreferences);
    }

    if (data.lastSync) {
      setLastSyncTime(data.lastSync);
    }

    return true;
  } catch (error) {
    console.error("Error importing offline data:", error);
    return false;
  }
}
