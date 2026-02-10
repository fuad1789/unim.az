import { Group, UserPreferences, DayName, Lesson } from "@/types";
import {
  isOffline,
  loadCurrentGroupData,
  saveCurrentGroupData,
  loadOfflineUserPreferences,
  saveOfflineUserPreferences,
  setLastSyncTime,
  getLastSyncTime,
} from "./offlineManager";

// BASIT YAPI: University data yükle (tüm grupları)
export async function loadUniversityData(
  universityId: number
): Promise<Group[]> {
  try {
    // If online, fetch from API
    if (!isOffline()) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(
          `/api/groups?universityId=${universityId}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            const groups = result.data as Group[];
            setLastSyncTime();
            return groups;
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
        console.error("Fetch failed or timed out:", e);
        // Fallthrough to return empty array
      }
    }

    return [];
  } catch (error) {
    console.error("Error loading university data:", error);
    return [];
  }
}

// BASIT YAPI: Available groups listesi al
export async function getAvailableGroups(
  universityId: number
): Promise<string[]> {
  try {
    if (!isOffline()) {
      const groups = await loadUniversityData(universityId);
      const groupNames = groups.map((group) => group.group_id || group.group);
      return [...new Set(groupNames.filter(Boolean))];
    }
    return [];
  } catch (error) {
    console.error("Error getting available groups:", error);
    return [];
  }
}

// BASIT YAPI: Grup datası al ve kaydet
export async function getGroupData(
  universityId: number,
  groupName: string
): Promise<Group | null> {
  try {
    // ÖNEMLI: Önce her zaman offline cache'den oku
    const currentData = loadCurrentGroupData();
    if (
      currentData &&
      currentData.universityId === universityId &&
      currentData.groupName === groupName
    ) {
      console.log("Loading from offline cache");
      return currentData.group;
    }

    // Cache'de yoksa, sadece online ise API'den al
    if (isOffline()) {
      console.log("Offline mode - no cache data available");
      return null;
    }

    // Online ise API'den al
    const groups = await loadUniversityData(universityId);
    const group =
      groups.find((g) => g.group_id === groupName) ||
      groups.find((g) => g.group === groupName);

    if (group) {
      saveCurrentGroupData(universityId, groupName, group);
      console.log(`Saved group data for offline: ${groupName}`);
      return group;
    }

    return null;
  } catch (error) {
    console.error("Error getting group data:", error);

    // Hata durumunda cache'den dene
    const currentData = loadCurrentGroupData();
    if (
      currentData &&
      currentData.universityId === universityId &&
      currentData.groupName === groupName
    ) {
      console.log("Falling back to cached data");
      return currentData.group;
    }

    return null;
  }
}

// Get current day lessons
export function getCurrentDayLessons(group: Group): Lesson[] {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const dayNames: DayName[] = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const currentDayName = dayNames[dayIndex];

  const dayData = (group.week_schedule || group.week || []).find(
    (day) => day.day === currentDayName
  );
  if (!dayData) return [];

  return dayData.lessons.filter((lesson) => {
    // Filter based on week type
    if (lesson.lesson) {
      // This lesson has both upper and lower week variants
      return true; // We'll handle the selection in the component
    }
    return true; // Regular lessons appear in both weeks
  });
}

// Parse time string to get start and end times
export function parseTime(
  timeString: string
): { start: number; end: number } | null {
  if (!timeString) return null;

  const [startStr, endStr] = timeString.split("-");
  if (!startStr || !endStr) return null;

  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

  return {
    start: startHour * 60 + startMin,
    end: endHour * 60 + endMin,
  };
}

// Get current time in minutes since midnight
export function getCurrentTimeInMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Save user preferences to localStorage
export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    // Save to both legacy location and offline manager
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    saveOfflineUserPreferences(preferences);
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
}

// Load user preferences from localStorage
export function loadUserPreferences(): UserPreferences | null {
  try {
    // First try legacy location
    const stored = localStorage.getItem("userPreferences");
    if (stored) {
      const preferences = JSON.parse(stored);
      // Also save to offline manager for consistency
      saveOfflineUserPreferences(preferences);
      return preferences;
    }

    // Fallback to offline manager
    return loadOfflineUserPreferences();
  } catch (error) {
    console.error("Error loading user preferences:", error);
    // Try offline manager as fallback
    return loadOfflineUserPreferences();
  }
}

// Clear user preferences
export function clearUserPreferences(): void {
  try {
    localStorage.removeItem("userPreferences");
    // Also clear from offline manager
    localStorage.removeItem("unimaz-offline-user-preferences");
  } catch (error) {
    console.error("Error clearing user preferences:", error);
  }
}

// Check if we're in offline mode
export function isAppOffline(): boolean {
  return isOffline();
}

// Get last sync time
export function getLastDataSync(): number {
  return getLastSyncTime();
}

// Force sync data when online
export async function syncDataWhenOnline(universityId: number): Promise<void> {
  if (!isOffline()) {
    try {
      console.log(`Syncing data for university ${universityId}`);
      await loadUniversityData(universityId);
      console.log("Data sync completed");
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  }
}
