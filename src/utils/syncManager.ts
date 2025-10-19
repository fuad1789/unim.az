/**
 * Sync Manager - Handles data synchronization when online
 */

import { Group } from "@/types";
import {
  isOffline,
  saveOfflineGroupData,
  setLastSyncTime,
  getLastSyncTime,
  isOfflineDataStale,
} from "./offlineManager";

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  isStale: boolean;
  isSyncing: boolean;
  error: string | null;
}

class SyncManager {
  private syncInProgress = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  /**
   * Add a listener for sync status changes
   */
  addListener(listener: (status: SyncStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (status: SyncStatus) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: !isOffline(),
      lastSync: getLastSyncTime(),
      isStale: isOfflineDataStale(),
      isSyncing: this.syncInProgress,
      error: null,
    };
  }

  /**
   * Sync university data
   */
  async syncUniversityData(universityId: number): Promise<boolean> {
    if (isOffline() || this.syncInProgress) {
      return false;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      console.log(`Syncing data for university ${universityId}`);

      // Fetch groups data
      const response = await fetch(`/api/groups?universityId=${universityId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      const groups = result.data as Group[];

      // Save to offline storage
      saveOfflineGroupData(universityId, groups);
      setLastSyncTime();

      console.log(
        `Successfully synced ${groups.length} groups for university ${universityId}`
      );
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      this.notifyListeners();
      return false;
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync all available universities
   */
  async syncAllUniversities(
    universityIds: number[]
  ): Promise<{ success: number; failed: number }> {
    if (isOffline() || this.syncInProgress) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    this.notifyListeners();

    let success = 0;
    let failed = 0;

    try {
      console.log(`Syncing data for ${universityIds.length} universities`);

      // Sync universities in parallel (with concurrency limit)
      const concurrency = 3;
      const chunks = [];
      for (let i = 0; i < universityIds.length; i += concurrency) {
        chunks.push(universityIds.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (universityId) => {
          try {
            const response = await fetch(
              `/api/groups?universityId=${universityId}`
            );
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                saveOfflineGroupData(universityId, result.data);
                return true;
              }
            }
            return false;
          } catch {
            return false;
          }
        });

        const results = await Promise.all(promises);
        results.forEach((result) => (result ? success++ : failed++));
      }

      setLastSyncTime();
      console.log(`Sync completed: ${success} success, ${failed} failed`);
    } catch (error) {
      console.error("Bulk sync failed:", error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }

    return { success, failed };
  }

  /**
   * Check if sync is needed
   */
  needsSync(): boolean {
    return !isOffline() && isOfflineDataStale();
  }

  /**
   * Force sync if online
   */
  async forceSync(universityId: number): Promise<boolean> {
    if (isOffline()) {
      console.log("Cannot sync: offline");
      return false;
    }

    return this.syncUniversityData(universityId);
  }

  /**
   * Initialize sync manager
   */
  initialize(): void {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log("App is online, checking if sync is needed");
      this.notifyListeners();
    });

    window.addEventListener("offline", () => {
      console.log("App is offline");
      this.notifyListeners();
    });

    // Check if sync is needed on initialization
    if (this.needsSync()) {
      console.log("Data is stale, sync recommended");
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Initialize on module load
if (typeof window !== "undefined") {
  syncManager.initialize();
}
