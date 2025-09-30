import { Group, UserPreferences, WeekType, DayName, Lesson } from "@/types";

// Load university data
export async function loadUniversityData(
  universityId: number
): Promise<Group[]> {
  try {
    // Map university IDs to their data files
    const universityFiles: Record<number, string> = {
      11: "SDU_muhendislik", // Sumqayıt Dövlət Universiteti
      // Add more universities as their data becomes available
    };

    const fileName = universityFiles[universityId];
    if (!fileName) {
      throw new Error(`No data available for university ID: ${universityId}`);
    }

    // Use dynamic import with proper path
    const data = await import(`../data/${fileName}.json`);
    return data.default as Group[];
  } catch (error) {
    console.error("Error loading university data:", error);
    return [];
  }
}

// Get available groups for a university
export async function getAvailableGroups(
  universityId: number
): Promise<string[]> {
  const groups = await loadUniversityData(universityId);
  return groups.map((group) => group.group);
}

// Get group data
export async function getGroupData(
  universityId: number,
  groupName: string
): Promise<Group | null> {
  const groups = await loadUniversityData(universityId);
  return groups.find((group) => group.group === groupName) || null;
}

// Get current day lessons
export function getCurrentDayLessons(
  group: Group,
  _weekType: WeekType
): Lesson[] {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const dayNames: DayName[] = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const currentDayName = dayNames[dayIndex];

  const dayData = group.week.find((day) => day.day === currentDayName);
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
