/**
 * Tests for schedule management utilities
 */

import {
  saveWizardData,
  loadWizardData,
  clearWizardData,
  saveSchedule,
  loadSchedule,
  loadAllSchedules,
  deleteSchedule,
  scheduleExists,
  getCreatedGroupNames,
  exportSchedules,
  importSchedules,
  clearAllSchedules,
  type ScheduleData,
} from "../scheduleManager";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("scheduleManager", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const mockScheduleData: ScheduleData = {
    group_id: "651a",
    faculty: "Mühəndislik",
    academic_load: [
      { subject: "Kompüter mühəndisliyinin əsasları", total_hours: 60 },
      { subject: "Proqramlaşdırmanın əsasları", total_hours: 75 },
    ],
    week_schedule: [
      { day: "I", lessons: [] },
      {
        day: "II",
        lessons: [
          {
            time: "08:30-09:50",
            subject: "Kompüter mühəndisliyinin əsasları",
            teacher: "Test Teacher",
            room: "101",
          },
        ],
      },
    ],
  };

  describe("wizard data management", () => {
    test("should save and load wizard data", () => {
      saveWizardData(mockScheduleData);
      const loaded = loadWizardData();

      expect(loaded).toEqual(mockScheduleData);
    });

    test("should clear wizard data", () => {
      saveWizardData(mockScheduleData);
      clearWizardData();
      const loaded = loadWizardData();

      expect(loaded).toBeNull();
    });

    test("should return null when no wizard data exists", () => {
      const loaded = loadWizardData();
      expect(loaded).toBeNull();
    });
  });

  describe("schedule management", () => {
    test("should save and load a schedule", () => {
      saveSchedule("651a", mockScheduleData);
      const loaded = loadSchedule("651a");

      expect(loaded).toEqual(mockScheduleData);
    });

    test("should check if schedule exists", () => {
      expect(scheduleExists("651a")).toBe(false);

      saveSchedule("651a", mockScheduleData);
      expect(scheduleExists("651a")).toBe(true);
    });

    test("should get all created group names", () => {
      saveSchedule("651a", mockScheduleData);
      saveSchedule("652a", { ...mockScheduleData, group_id: "652a" });

      const groupNames = getCreatedGroupNames();
      expect(groupNames).toContain("651a");
      expect(groupNames).toContain("652a");
    });

    test("should delete a schedule", () => {
      saveSchedule("651a", mockScheduleData);
      expect(scheduleExists("651a")).toBe(true);

      deleteSchedule("651a");
      expect(scheduleExists("651a")).toBe(false);
    });

    test("should export and import schedules", () => {
      saveSchedule("651a", mockScheduleData);
      saveSchedule("652a", { ...mockScheduleData, group_id: "652a" });

      const exported = exportSchedules();
      expect(exported).toContain("651a");
      expect(exported).toContain("652a");

      clearAllSchedules();
      expect(getCreatedGroupNames()).toHaveLength(0);

      const importResult = importSchedules(exported);
      expect(importResult).toBe(true);
      expect(getCreatedGroupNames()).toHaveLength(2);
    });

    test("should clear all schedules", () => {
      saveSchedule("651a", mockScheduleData);
      saveSchedule("652a", { ...mockScheduleData, group_id: "652a" });

      expect(getCreatedGroupNames()).toHaveLength(2);

      clearAllSchedules();
      expect(getCreatedGroupNames()).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    test("should handle invalid JSON gracefully", () => {
      localStorageMock.setItem("schedule-wizard-data", "invalid json");
      const loaded = loadWizardData();
      expect(loaded).toBeNull();
    });

    test("should handle missing data gracefully", () => {
      const loaded = loadSchedule("nonexistent");
      expect(loaded).toBeNull();
    });
  });
});
