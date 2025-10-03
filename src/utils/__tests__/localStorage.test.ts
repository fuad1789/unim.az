/**
 * Tests for the localStorage utility functions
 */

import {
  readUserData,
  writeUserData,
  getAbsenceCount,
  setAbsenceCount,
  incrementAbsenceCount,
  decrementAbsenceCount,
  getGrade,
  setGrade,
  removeGrade,
  clearAllUserData,
  getAggregatedAbsences,
  getSubjectVariants,
} from "../localStorage";

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

describe("localStorage utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("basic data operations", () => {
    it("should read empty data initially", () => {
      const data = readUserData();
      expect(data).toEqual({
        absences: {},
        grades: {},
      });
    });

    it("should write and read data correctly", () => {
      const testData = {
        absences: { Fəlsəfə: 3 },
        grades: { Kimya: 85 },
      };

      writeUserData(testData);
      const readData = readUserData();

      expect(readData).toEqual(testData);
    });
  });

  describe("absence operations", () => {
    it("should get absence count (default 0)", () => {
      expect(getAbsenceCount("Fəlsəfə")).toBe(0);
    });

    it("should set absence count", () => {
      setAbsenceCount("Fəlsəfə", 5);
      expect(getAbsenceCount("Fəlsəfə")).toBe(5);
    });

    it("should increment absence count", () => {
      setAbsenceCount("Fəlsəfə", 3);
      const newCount = incrementAbsenceCount("Fəlsəfə");

      expect(newCount).toBe(4);
      expect(getAbsenceCount("Fəlsəfə")).toBe(4);
    });

    it("should decrement absence count", () => {
      setAbsenceCount("Fəlsəfə", 3);
      const newCount = decrementAbsenceCount("Fəlsəfə");

      expect(newCount).toBe(2);
      expect(getAbsenceCount("Fəlsəfə")).toBe(2);
    });

    it("should not decrement below 0", () => {
      setAbsenceCount("Fəlsəfə", 1);
      decrementAbsenceCount("Fəlsəfə");
      const finalCount = decrementAbsenceCount("Fəlsəfə");

      expect(finalCount).toBe(0);
      expect(getAbsenceCount("Fəlsəfə")).toBe(0);
    });

    it("should aggregate absences for subject variants", () => {
      // Set absences for different variants of the same subject
      setAbsenceCount("Fəlsəfə (mühazirə)", 2);
      setAbsenceCount("Fəlsəfə (məşğələ)", 1);
      setAbsenceCount("Fəlsəfə (laboratoriya)", 1);

      // Should return total count for base subject
      expect(getAbsenceCount("Fəlsəfə")).toBe(4);
      expect(getAbsenceCount("Fəlsəfə (mühazirə)")).toBe(4);
      expect(getAbsenceCount("Fəlsəfə (məşğələ)")).toBe(4);
    });

    it("should handle different subjects separately", () => {
      setAbsenceCount("Fəlsəfə (mühazirə)", 2);
      setAbsenceCount("Kimya (mühazirə)", 3);

      expect(getAbsenceCount("Fəlsəfə")).toBe(2);
      expect(getAbsenceCount("Kimya")).toBe(3);
    });
  });

  describe("grade operations", () => {
    it("should get grade (default null)", () => {
      expect(getGrade("Kimya")).toBeNull();
    });

    it("should set and get grade", () => {
      setGrade("Kimya", 85);
      expect(getGrade("Kimya")).toBe(85);
    });

    it("should remove grade", () => {
      setGrade("Kimya", 85);
      removeGrade("Kimya");
      expect(getGrade("Kimya")).toBeNull();
    });
  });

  describe("aggregated absence operations", () => {
    it("should get aggregated absences by base subject", () => {
      setAbsenceCount("Fəlsəfə (mühazirə)", 2);
      setAbsenceCount("Fəlsəfə (məşğələ)", 1);
      setAbsenceCount("Kimya (mühazirə)", 3);

      const aggregated = getAggregatedAbsences();

      expect(aggregated).toEqual({
        Fəlsəfə: 3,
        Kimya: 3,
      });
    });

    it("should get subject variants", () => {
      setAbsenceCount("Fəlsəfə (mühazirə)", 2);
      setAbsenceCount("Fəlsəfə (məşğələ)", 1);
      setAbsenceCount("Kimya (mühazirə)", 3);

      const fəlsəfəVariants = getSubjectVariants("Fəlsəfə");
      const kimyaVariants = getSubjectVariants("Kimya");

      expect(fəlsəfəVariants).toEqual(
        expect.arrayContaining(["Fəlsəfə (mühazirə)", "Fəlsəfə (məşğələ)"])
      );
      expect(kimyaVariants).toEqual(["Kimya (mühazirə)"]);
    });
  });

  describe("clear operations", () => {
    it("should clear all user data", () => {
      setAbsenceCount("Fəlsəfə", 5);
      setGrade("Kimya", 85);

      clearAllUserData();

      expect(getAbsenceCount("Fəlsəfə")).toBe(0);
      expect(getGrade("Kimya")).toBeNull();
    });
  });
});
