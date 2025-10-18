import { Group, UserPreferences, DayName, Lesson } from "@/types";

// Load university data from MongoDB
export async function loadUniversityData(
  universityId: number
): Promise<Group[]> {
  try {
    // Fetch from MongoDB API
    const response = await fetch(`/api/groups`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        return result.data as Group[];
      }
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Get available groups for a university
export async function getAvailableGroups(
  universityId: number
): Promise<string[]> {
  const groups = await loadUniversityData(universityId);
  const groupNames = groups.map((group) => group.group_id || group.group);
  // Remove duplicates and filter out undefined/null values
  return [...new Set(groupNames.filter(Boolean))];
}

// Get group data
export async function getGroupData(
  universityId: number,
  groupName: string
): Promise<Group | null> {
  const groups = await loadUniversityData(universityId);
  return (
    groups.find((group) => group.group_id === groupName) ||
    groups.find((group) => group.group === groupName) ||
    null
  );
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
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
}

// Load user preferences from localStorage
export function loadUserPreferences(): UserPreferences | null {
  try {
    const stored = localStorage.getItem("userPreferences");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return null;
  }
}

// Clear user preferences
export function clearUserPreferences(): void {
  try {
    localStorage.removeItem("userPreferences");
  } catch (error) {
    console.error("Error clearing user preferences:", error);
  }
}
