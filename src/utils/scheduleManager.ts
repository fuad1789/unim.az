/**
 * Schedule management utilities for localStorage
 * Handles saving and loading of schedule data for the wizard and created schedules
 */

export interface AcademicLoad {
  subject: string;
  total_hours: number;
}

export interface SubLesson {
  subject: string;
  room: string;
  teacher: string;
  lessonType: string;
}

export interface Lesson {
  time: string;
  subject?: string;
  teacher?: string;
  room?: string;
  lessonType?: string;
  subLessons?: SubLesson[];
  lesson?: {
    upper: {
      subject: string;
      teacher: string;
      room: string;
    };
    lower: {
      subject: string;
      teacher: string;
      room: string;
    };
  };
}

export interface Day {
  day: string;
  lessons: Lesson[];
}

export interface ScheduleData {
  group_id: string;
  universityId?: number;
  faculty?: string;
  academic_load: AcademicLoad[];
  week_schedule: Day[];
}

const WIZARD_STORAGE_KEY = "schedule-wizard-data";
const SCHEDULES_STORAGE_KEY = "created-schedules";

/**
 * Save wizard data to localStorage (temporary storage during wizard process)
 */
export function saveWizardData(data: ScheduleData): void {
  try {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silent error handling
  }
}

/**
 * Load wizard data from localStorage
 */
export function loadWizardData(): ScheduleData | null {
  try {
    const stored = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear wizard data from localStorage
 */
export function clearWizardData(): void {
  try {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    // Silent error handling
  }
}

/**
 * Save a completed schedule to localStorage
 */
export function saveSchedule(
  groupName: string,
  scheduleData: ScheduleData
): void {
  try {
    // Load existing schedules
    const existingSchedules = loadAllSchedules();

    // Add or update the schedule
    existingSchedules[groupName] = {
      ...scheduleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save back to localStorage
    localStorage.setItem(
      SCHEDULES_STORAGE_KEY,
      JSON.stringify(existingSchedules)
    );
  } catch {
    // Silent error handling
  }
}

/**
 * Save a completed schedule to MongoDB
 */
export async function saveScheduleToMongoDB(
  scheduleData: ScheduleData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scheduleData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to save schedule",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Load a specific schedule by group name
 */
export function loadSchedule(groupName: string): ScheduleData | null {
  try {
    const schedules = loadAllSchedules();
    return schedules[groupName] || null;
  } catch {
    return null;
  }
}

/**
 * Load all created schedules
 */
export function loadAllSchedules(): Record<
  string,
  ScheduleData & { created_at: string; updated_at: string }
> {
  try {
    const stored = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Delete a schedule by group name
 */
export function deleteSchedule(groupName: string): void {
  try {
    const schedules = loadAllSchedules();
    delete schedules[groupName];
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  } catch {
    // Silent error handling
  }
}

/**
 * Check if a schedule exists for a group
 */
export function scheduleExists(groupName: string): boolean {
  const schedule = loadSchedule(groupName);
  return schedule !== null;
}

/**
 * Get list of all created group names
 */
export function getCreatedGroupNames(): string[] {
  const schedules = loadAllSchedules();
  return Object.keys(schedules);
}

/**
 * Export all schedules as JSON
 */
export function exportSchedules(): string {
  const schedules = loadAllSchedules();
  return JSON.stringify(schedules, null, 2);
}

/**
 * Import schedules from JSON
 */
export function importSchedules(jsonData: string): boolean {
  try {
    const schedules = JSON.parse(jsonData);
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all schedules
 */
export function clearAllSchedules(): void {
  try {
    localStorage.removeItem(SCHEDULES_STORAGE_KEY);
  } catch {
    // Silent error handling
  }
}
