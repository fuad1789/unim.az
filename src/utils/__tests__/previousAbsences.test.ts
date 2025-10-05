/**
 * Tests for previous absences functionality
 */

import { isMidSemester } from "../academics";
import {
  hasAddedPreviousAbsences,
  markPreviousAbsencesAdded,
  clearAllUserData,
} from "../localStorage";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Previous Absences Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllUserData();
  });

  describe("isMidSemester", () => {
    it("should return true when current week is greater than 6", () => {
      // Mock current date to be in week 8
      const mockDate = new Date("2024-02-20"); // Week 8 of 2024
      jest
        .spyOn(global, "Date")
        .mockImplementation(() => mockDate as unknown as DateConstructor);

      expect(isMidSemester()).toBe(true);
    });

    it("should return false when current week is 6 or less", () => {
      // Mock current date to be in week 4
      const mockDate = new Date("2024-01-22"); // Week 4 of 2024
      jest
        .spyOn(global, "Date")
        .mockImplementation(() => mockDate as unknown as DateConstructor);

      expect(isMidSemester()).toBe(false);
    });
  });

  describe("Previous Absences Status", () => {
    it("should return false initially when no previous absences have been added", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(hasAddedPreviousAbsences()).toBe(false);
    });

    it("should return true after marking previous absences as added", () => {
      markPreviousAbsencesAdded();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "unimaz-previous-absences-added",
        "true"
      );

      localStorageMock.getItem.mockReturnValue("true");
      expect(hasAddedPreviousAbsences()).toBe(true);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(hasAddedPreviousAbsences()).toBe(false);
    });
  });
});
