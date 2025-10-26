/**
 * Sync Manager - Handles data synchronization when online
 */

import {
  isOffline,
  setLastSyncTime,
  getLastSyncTime,
  isOfflineDataStale,
  loadCurrentGroupData,
} from "./offlineManager";
import { getGroupData } from "./dataManager";

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
   * Sync current group data
   */
  async syncUniversityData(universityId: number): Promise<boolean> {
    if (isOffline() || this.syncInProgress) {
      return false;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      console.log(`Syncing data for university ${universityId}`);

      // Check if we have a current group to sync
      const currentGroup = loadCurrentGroupData();
      if (!currentGroup || currentGroup.universityId !== universityId) {
        console.log("No current group to sync");
        return false;
      }

      // Fetch fresh group data from API
      const groupData = await getGroupData(universityId, currentGroup.groupName);
      
      if (groupData) {
        // Data is already saved by getGroupData
        setLastSyncTime();
        console.log(`Successfully synced group ${currentGroup.groupName}`);
        return true;
      }

      return false;
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
            // Check if we have current group data for this university
            const currentGroup = loadCurrentGroupData();
            if (!currentGroup || currentGroup.universityId !== universityId) {
              return true; // Skip if no group to sync
            }

            // Sync the current group
            const groupData = await getGroupData(universityId, currentGroup.groupName);
            return groupData !== null;
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
