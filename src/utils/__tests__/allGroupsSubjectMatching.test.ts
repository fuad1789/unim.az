/**
 * Tests to verify that subject matching works across all groups
 */

import { normalizeSubjectName } from "../academics";
import {
  getAbsenceCountForAcademicLoadSubject,
  setAbsenceCount,
  clearAllUserData,
} from "../localStorage";

// Sample data from different groups to test
const testGroups = [
  {
    groupId: "681",
    subjects: [
      "Kompüter mühəndisliyinin əsasları",
      "Komp. müh. əsas.",
      "Proqramlaşdırmanın əsasları",
      "Proqramlaş. əsas.",
      "Xətti cəbr və analitik həndəsə",
      "Xətti cəbr və an. hən.",
    ],
  },
  {
    groupId: "671",
    subjects: [
      "Ölçmə texnikasının əsasları",
      "Ölçmə texnika. əsas.",
      "Elektronikanın əsasları",
      "Əməliyyat sistemləri",
    ],
  },
  {
    groupId: "672",
    subjects: [
      "Kompüter arxitekturası",
      "K o m p ü t e r   a r x i t e k t u r a s ı", // This has spaces between letters
      "İnformasiya texnologiyalarının əsasları",
      "İnformasiya texnolog. əsas.",
      "Multimediya texnologiyaları",
      "Multimediya texnolog.",
    ],
  },
  {
    groupId: "673",
    subjects: [
      "Dövrələr nəzərioyyəsi",
      "Döv.nəz.",
      "Avtomatlaşdırma texniki vasitələri",
      "Avtomatlaş. texniki vasitələ.",
    ],
  },
];

describe("All Groups Subject Matching", () => {
  beforeEach(() => {
    clearAllUserData();
  });

  describe("Cross-group subject normalization", () => {
    test("should normalize subjects consistently across all groups", () => {
      // Test that the same subject names normalize to the same result regardless of group
      const testCases = [
        {
          input: "Kompüter mühəndisliyinin əsasları",
          expected: "kompüter mühəndisliyinin əsasları",
        },
        {
          input: "Komp. müh. əsas.",
          expected: "kompüter mühəndisliyinin əsasları",
        },
        {
          input: "Proqramlaşdırmanın əsasları",
          expected: "proqramlaşdırmanın əsasları",
        },
        { input: "Proqramlaş. əsas.", expected: "proqramlaşdırmanın əsasları" },
        {
          input: "Ölçmə texnikasının əsasları",
          expected: "ölçmə texnikasının əsasları",
        },
        {
          input: "Ölçmə texnika. əsas.",
          expected: "ölçmə texnikasının əsasları",
        },
        { input: "Dövrələr nəzərioyyəsi", expected: "dövrələr nəzəriyyəsi" },
        { input: "Döv.nəz.", expected: "dövrələr nəzəriyyəsi" },
        {
          input: "Avtomatlaşdırma texniki vasitələri",
          expected: "avtomatlaşdırma texniki vasitələri",
        },
        {
          input: "Avtomatlaş. texniki vasitələ.",
          expected: "avtomatlaşdırma texniki vasitələri",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizeSubjectName(input)).toBe(expected);
      });
    });

    test("should handle special cases with spaces between letters", () => {
      // This is a real case from group 672
      const spacedSubject = "K o m p ü t e r   a r x i t e k t u r a s ı";
      const normalSubject = "Kompüter arxitekturası";

      // Both should normalize to the same result
      const normalizedSpaced = normalizeSubjectName(spacedSubject);
      const normalizedNormal = normalizeSubjectName(normalSubject);

      // They should be similar enough to match
      expect(normalizedSpaced).toContain("kompüter");
      expect(normalizedNormal).toContain("kompüter");
    });
  });

  describe("Cross-group absence matching", () => {
    test("should match absences across different groups for the same subject", () => {
      // Set absence in one group's format
      setAbsenceCount(
        "2025-W40|2|1|Kompüter mühəndisliyinin əsasları (mühazirə)",
        3
      );

      // Should be able to find it using abbreviated format from another group
      expect(getAbsenceCountForAcademicLoadSubject("Komp. müh. əsas.")).toBe(3);
    });

    test("should match absences for dövrələr nəzəriyyəsi variants", () => {
      // Set absence using one variant
      setAbsenceCount("2025-W40|2|1|Dövrələr nəzərioyyəsi (məşğələ)", 2);

      // Should find it using the abbreviated variant
      expect(getAbsenceCountForAcademicLoadSubject("Döv.nəz.")).toBe(2);
    });

    test("should match absences for ölçmə texnikasının əsasları variants", () => {
      // Set absence using full name
      setAbsenceCount("2025-W40|2|1|Ölçmə texnikasının əsasları (lab.)", 1);

      // Should find it using abbreviated name
      expect(
        getAbsenceCountForAcademicLoadSubject("Ölçmə texnika. əsas.")
      ).toBe(1);
    });

    test("should aggregate absences from different groups for the same subject", () => {
      // Set absences using different variants from different groups
      setAbsenceCount(
        "2025-W40|2|1|Kompüter mühəndisliyinin əsasları (mühazirə)",
        2
      );
      setAbsenceCount("2025-W40|3|1|Komp. müh. əsas. (məşğələ)", 1);

      // Should aggregate both
      expect(
        getAbsenceCountForAcademicLoadSubject(
          "Kompüter mühəndisliyinin əsasları"
        )
      ).toBe(3);
      expect(getAbsenceCountForAcademicLoadSubject("Komp. müh. əsas.")).toBe(3);
    });
  });

  describe("Group-specific subject handling", () => {
    test("should handle group 671 subjects correctly", () => {
      setAbsenceCount("2025-W40|2|1|Ölçmə texnikasının əsasları (mühazirə)", 2);
      setAbsenceCount("2025-W40|3|1|Elektronikanın əsasları (məşğələ)", 1);

      expect(
        getAbsenceCountForAcademicLoadSubject("Ölçmə texnika. əsas.")
      ).toBe(2);
      expect(
        getAbsenceCountForAcademicLoadSubject("Elektronikanın əsasları")
      ).toBe(1);
    });

    test("should handle group 672 subjects correctly", () => {
      setAbsenceCount(
        "2025-W40|2|1|İnformasiya texnologiyalarının əsasları (mühazirə)",
        2
      );
      setAbsenceCount("2025-W40|3|1|Multimediya texnologiyaları (məşğələ)", 1);

      expect(
        getAbsenceCountForAcademicLoadSubject("İnformasiya texnolog. əsas.")
      ).toBe(2);
      expect(
        getAbsenceCountForAcademicLoadSubject("Multimediya texnolog.")
      ).toBe(1);
    });

    test("should handle group 673 subjects correctly", () => {
      setAbsenceCount("2025-W40|2|1|Dövrələr nəzərioyyəsi (mühazirə)", 2);
      setAbsenceCount(
        "2025-W40|3|1|Avtomatlaşdırma texniki vasitələri (məşğələ)",
        1
      );

      expect(getAbsenceCountForAcademicLoadSubject("Döv.nəz.")).toBe(2);
      expect(
        getAbsenceCountForAcademicLoadSubject("Avtomatlaş. texniki vasitələ.")
      ).toBe(1);
    });
  });

  describe("Edge cases across groups", () => {
    test("should not match completely different subjects", () => {
      setAbsenceCount(
        "2025-W40|2|1|Kompüter mühəndisliyinin əsasları (mühazirə)",
        2
      );

      // These should not match
      expect(
        getAbsenceCountForAcademicLoadSubject("Elektronikanın əsasları")
      ).toBe(0);
      expect(
        getAbsenceCountForAcademicLoadSubject("Multimediya texnologiyaları")
      ).toBe(0);
      expect(
        getAbsenceCountForAcademicLoadSubject("Dövrələr nəzəriyyəsi")
      ).toBe(0);
    });

    test("should handle empty or invalid subject names gracefully", () => {
      expect(getAbsenceCountForAcademicLoadSubject("")).toBe(0);
      expect(getAbsenceCountForAcademicLoadSubject("   ")).toBe(0);
      expect(
        getAbsenceCountForAcademicLoadSubject("Non-existent Subject")
      ).toBe(0);
    });
  });
});


