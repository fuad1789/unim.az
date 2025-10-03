/**
 * Tests for the academics utility functions
 */

import {
  calculateAbsenceLimits,
  getAbsenceLimitForSubject,
} from "../academics";
import { AcademicLoadItem } from "@/types";

describe("academics utilities", () => {
  const mockAcademicLoad: AcademicLoadItem[] = [
    { subject: "Fəlsəfə", total_hours: 30 },
    { subject: "Tətbiqi riyaziyyat", total_hours: 45 },
    { subject: "Kimya", total_hours: 60 },
  ];

  describe("calculateAbsenceLimits", () => {
    it("should calculate correct absence limits", () => {
      const limits = calculateAbsenceLimits(mockAcademicLoad);

      expect(limits).toEqual({
        Fəlsəfə: 7, // Math.floor(30 * 0.25) = 7
        "Tətbiqi riyaziyyat": 11, // Math.floor(45 * 0.25) = 11
        Kimya: 15, // Math.floor(60 * 0.25) = 15
      });
    });

    it("should handle empty array", () => {
      const limits = calculateAbsenceLimits([]);
      expect(limits).toEqual({});
    });

    it("should handle invalid input", () => {
      const limits = calculateAbsenceLimits(
        null as unknown as AcademicLoadItem[]
      );
      expect(limits).toEqual({});
    });
  });

  describe("getAbsenceLimitForSubject", () => {
    const limits = {
      Fəlsəfə: 7,
      "Tətbiqi riyaziyyat": 11,
      Kimya: 15,
    };

    it("should find exact match", () => {
      const limit = getAbsenceLimitForSubject("Fəlsəfə", limits);
      expect(limit).toBe(7);
    });

    it("should find match after removing parentheses", () => {
      const limit = getAbsenceLimitForSubject("Fəlsəfə (məş.)", limits);
      expect(limit).toBe(7);
    });

    it("should find match after removing multiple parentheses", () => {
      const limit = getAbsenceLimitForSubject(
        "Tətbiqi riyaziyyat (mühazirə) (qrup A)",
        limits
      );
      expect(limit).toBe(11);
    });

    it("should return 0 for non-existent subject", () => {
      const limit = getAbsenceLimitForSubject("Non-existent subject", limits);
      expect(limit).toBe(0);
    });

    it("should handle empty subject name", () => {
      const limit = getAbsenceLimitForSubject("", limits);
      expect(limit).toBe(0);
    });

    it("should handle null limits object", () => {
      const limit = getAbsenceLimitForSubject(
        "Fəlsəfə",
        null as unknown as Record<string, number>
      );
      expect(limit).toBe(0);
    });
  });
});
