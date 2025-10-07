/**
 * Tests for subject name matching and normalization
 */

import { normalizeSubjectName } from "../academics";
import {
  getAbsenceCountForAcademicLoadSubject,
  getMatchingSubjectKey,
  setAbsenceCount,
  clearAllUserData,
} from "../localStorage";

describe("Subject Name Matching", () => {
  beforeEach(() => {
    // Clear all data before each test
    clearAllUserData();
  });

  describe("normalizeSubjectName", () => {
    test("should normalize dövrələr nəzəriyyəsi variants", () => {
      expect(normalizeSubjectName("Döv. nəz.")).toBe("dövrələr nəzəriyyəsi");
      expect(normalizeSubjectName("Dövrələr nəzəriyyəsi")).toBe(
        "dövrələr nəzəriyyəsi"
      );
      expect(normalizeSubjectName("Dövrələr nəzərioyyəsi")).toBe(
        "dövrələr nəzəriyyəsi"
      );
      expect(normalizeSubjectName("Dövrələr nəzəriyyəsi (mühazirə)")).toBe(
        "dövrələr nəzəriyyəsi"
      );
    });

    test("should normalize kompüter mühəndisliyinin əsasları variants", () => {
      expect(normalizeSubjectName("Komp. müh. əsas.")).toBe(
        "kompüter mühəndisliyinin əsasları"
      );
      expect(normalizeSubjectName("Kompüter mühəndisliyinin əsasları")).toBe(
        "kompüter mühəndisliyinin əsasları"
      );
      expect(
        normalizeSubjectName("Kompüter mühəndisliyinin əsasları (məşğələ)")
      ).toBe("kompüter mühəndisliyinin əsasları");
    });

    test("should normalize proqramlaşdırmanın əsasları variants", () => {
      expect(normalizeSubjectName("Proqramlaş. əsas.")).toBe(
        "proqramlaşdırmanın əsasları"
      );
      expect(normalizeSubjectName("Proqramlaşdırmanın əsasları")).toBe(
        "proqramlaşdırmanın əsasları"
      );
      expect(normalizeSubjectName("Proqramlaş. əsas. (lab.)")).toBe(
        "proqramlaşdırmanın əsasları"
      );
    });

    test("should handle type indicators", () => {
      expect(normalizeSubjectName("Fənn (mühazirə)")).toBe("fənn");
      expect(normalizeSubjectName("Fənn (məşğələ)")).toBe("fənn");
      expect(normalizeSubjectName("Fənn (lab.)")).toBe("fənn");
    });

    test("should handle common abbreviations", () => {
      expect(normalizeSubjectName("Fənn (müh)")).toBe("fənn");
      expect(normalizeSubjectName("Fənn (məş)")).toBe("fənn");
      expect(normalizeSubjectName("Fənn (lab)")).toBe("fənn");
    });
  });

  describe("Subject Matching Integration", () => {
    test("should match different variants of the same subject", () => {
      // Set absence for one variant
      setAbsenceCount("2025-W40|2|1|Dövrələr nəzəriyyəsi (mühazirə)", 2);

      // Should be able to find it using different variants
      expect(getAbsenceCountForAcademicLoadSubject("Döv. nəz.")).toBe(2);
      expect(
        getAbsenceCountForAcademicLoadSubject("Dövrələr nəzəriyyəsi")
      ).toBe(2);
      expect(
        getAbsenceCountForAcademicLoadSubject("Dövrələr nəzərioyyəsi")
      ).toBe(2);
    });

    test("should match kompüter mühəndisliyinin əsasları variants", () => {
      // Set absence for one variant
      setAbsenceCount(
        "2025-W40|2|1|Kompüter mühəndisliyinin əsasları (məşğələ)",
        3
      );

      // Should be able to find it using different variants
      expect(getAbsenceCountForAcademicLoadSubject("Komp. müh. əsas.")).toBe(3);
      expect(
        getAbsenceCountForAcademicLoadSubject(
          "Kompüter mühəndisliyinin əsasları"
        )
      ).toBe(3);
    });

    test("should match proqramlaşdırmanın əsasları variants", () => {
      // Set absence for one variant
      setAbsenceCount("2025-W40|2|1|Proqramlaş. əsas. (lab.)", 1);

      // Should be able to find it using different variants
      expect(
        getAbsenceCountForAcademicLoadSubject("Proqramlaşdırmanın əsasları")
      ).toBe(1);
      expect(getAbsenceCountForAcademicLoadSubject("Proqramlaş. əsas.")).toBe(
        1
      );
    });

    test("should aggregate absences from multiple variants", () => {
      // Set absences for different variants of the same subject
      setAbsenceCount("2025-W40|2|1|Dövrələr nəzəriyyəsi (mühazirə)", 2);
      setAbsenceCount("2025-W40|3|1|Dövrələr nəzəriyyəsi (məşğələ)", 1);
      setAbsenceCount("2025-W40|4|1|Döv. nəz. (lab.)", 1);

      // Should aggregate all variants
      expect(
        getAbsenceCountForAcademicLoadSubject("Dövrələr nəzəriyyəsi")
      ).toBe(4);
    });

    test("should return matching subject key for academic load subjects", () => {
      // Set absence for a specific variant
      setAbsenceCount(
        "2025-W40|2|1|Kompüter mühəndisliyinin əsasları (mühazirə)",
        2
      );

      // Should find the matching key
      const matchingKey = getMatchingSubjectKey("Komp. müh. əsas.");
      expect(matchingKey).toBe("Kompüter mühəndisliyinin əsasları (mühazirə)");
    });

    test("should handle complex subject names with special characters", () => {
      // Set absence for complex subject name
      setAbsenceCount(
        "2025-W40|2|1|Azərbaycan dilində işgüzar və akademik kommunikasiya (mühazirə)",
        1
      );

      // Should match with abbreviated version
      expect(
        getAbsenceCountForAcademicLoadSubject("Az. dil. işg. və ak. kom.")
      ).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty or null subject names", () => {
      expect(normalizeSubjectName("")).toBe("");
      expect(normalizeSubjectName("   ")).toBe("");
    });

    test("should handle subjects with no matches", () => {
      expect(
        getAbsenceCountForAcademicLoadSubject("Non-existent Subject")
      ).toBe(0);
      expect(getMatchingSubjectKey("Non-existent Subject")).toBeNull();
    });

    test("should handle subjects with very similar names", () => {
      // Set absence for one subject
      setAbsenceCount("2025-W40|2|1|Matematika (mühazirə)", 2);

      // Similar but different subject should not match
      expect(getAbsenceCountForAcademicLoadSubject("Matematik")).toBe(0);
    });
  });
});
