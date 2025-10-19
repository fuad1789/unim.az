import { Group, UserPreferences, DayName, Lesson } from "@/types";
import {
  isOffline,
  loadOfflineGroupData,
  saveOfflineGroupData,
  loadOfflineUserPreferences,
  saveOfflineUserPreferences,
  getOfflineAvailableGroups,
  getOfflineGroupData,
  hasOfflineData,
  setLastSyncTime,
  getLastSyncTime,
} from "./offlineManager";

// Load university data from MongoDB or offline cache
export async function loadUniversityData(
  universityId: number
): Promise<Group[]> {
  try {
    // First check if we have offline data
    if (hasOfflineData(universityId)) {
      console.log(`Loading offline data for university ${universityId}`);
      return loadOfflineGroupData(universityId) as Group[];
    }

    // If online, try to fetch from API
    if (!isOffline()) {
      const response = await fetch(`/api/groups?universityId=${universityId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const groups = result.data as Group[];
          // Cache the data for offline use
          saveOfflineGroupData(universityId, groups);
          setLastSyncTime();
          return groups;
        }
      }
    }

    // Fallback to empty array if no data available
    return [];
  } catch (error) {
    console.error("Error loading university data:", error);
    // Try offline data as fallback
    if (hasOfflineData(universityId)) {
      return loadOfflineGroupData(universityId) as Group[];
    }
    return [];
  }
}

// Get available groups for a university
export async function getAvailableGroups(
  universityId: number
): Promise<string[]> {
  // First try offline data
  if (hasOfflineData(universityId)) {
    return getOfflineAvailableGroups(universityId);
  }

  // If online, try to fetch from API
  if (!isOffline()) {
    const groups = await loadUniversityData(universityId);
    const groupNames = groups.map((group) => group.group_id || group.group);
    return [...new Set(groupNames.filter(Boolean))];
  }

  // Fallback to offline data
  return getOfflineAvailableGroups(universityId);
}

// Get group data
export async function getGroupData(
  universityId: number,
  groupName: string
): Promise<Group | null> {
  // First try offline data
  if (hasOfflineData(universityId)) {
    const offlineGroup = getOfflineGroupData(universityId, groupName);
    if (offlineGroup) {
      return offlineGroup;
    }
  }

  // If online, try to fetch from API
  if (!isOffline()) {
    const groups = await loadUniversityData(universityId);
    return (
      groups.find((group) => group.group_id === groupName) ||
      groups.find((group) => group.group === groupName) ||
      null
    );
  }

  // Fallback to offline data
  return getOfflineGroupData(universityId, groupName);
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
