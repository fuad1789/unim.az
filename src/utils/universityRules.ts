import { UniversityRules } from "@/types";
import universityRulesData from "@/data/universityRules.json";

// Universitet spesifik qaydalarını yüklə
export function getUniversityRules(
  universityId: number
): UniversityRules | null {
  const rules =
    universityRulesData[
      universityId.toString() as keyof typeof universityRulesData
    ];
  return rules || null;
}

// Universitetin dərs saatlarını al
export function getUniversityLessonTimes(universityId: number): string[] {
  const rules = getUniversityRules(universityId);
  return rules?.lessonTimes || [];
}

// Universitetin maksimum günlük dərs sayını al
export function getMaxLessonsPerDay(universityId: number): number {
  const rules = getUniversityRules(universityId);
  return rules?.rules.maxLessonsPerDay || 6; // default 6 dərs
}

// Universitetin dərs müddətini al
export function getLessonDuration(universityId: number): number {
  const rules = getUniversityRules(universityId);
  return rules?.rules.lessonDuration || 80; // default 80 dəqiqə
}

// Universitetin fasilə müddətini al
export function getBreakDuration(universityId: number): number {
  const rules = getUniversityRules(universityId);
  return rules?.rules.breakDuration || 10; // default 10 dəqiqə
}

// Universitetin nahar fasiləsini al
export function getLunchBreak(
  universityId: number
): { start: string; end: string; duration: number } | null {
  const rules = getUniversityRules(universityId);
  return rules?.rules.lunchBreak || null;
}

// Universitetin xüsusi qaydalarını al
export function getSpecialRules(
  universityId: number
): { [key: string]: unknown } | null {
  const rules = getUniversityRules(universityId);
  return rules?.rules.specialRules || null;
}

// Bütün universitet qaydalarını al
export function getAllUniversityRules(): { [key: string]: UniversityRules } {
  return universityRulesData as { [key: string]: UniversityRules };
}
