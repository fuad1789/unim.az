/**
 * localStorage utilities for managing user data (absences/grades)
 * All user-specific data is stored in a single JSON object under "unimaz-userdata" key
 * Now uses global subject mapping system for consistent subject name handling
 */

import {
  findCanonicalSubjectName,
  normalizeSubjectName as globalNormalizeSubjectName,
} from "./subjectMapping";

export interface UserData {
  absences: Record<string, number>;
  grades: Record<string, number>;
}

const STORAGE_KEY = "unimaz-userdata";

/**
 * Initialize empty user data structure
 */
function getEmptyUserData(): UserData {
  return {
    absences: {},
    grades: {},
  };
}

/**
 * Read the entire user data object from localStorage
 * Returns empty structure if no data exists or if there's an error
 */
export function readUserData(): UserData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getEmptyUserData();
    }

    const parsed = JSON.parse(stored);

    // Ensure the structure is correct
    return {
      absences: parsed.absences || {},
      grades: parsed.grades || {},
    };
  } catch (error) {
    console.error("Error reading user data from localStorage:", error);
    return getEmptyUserData();
  }
}

/**
 * Write the entire user data object to localStorage
 * This implements the "Read -> Update -> Write back" cycle
 */
export function writeUserData(userData: UserData): void {
  try {
    const jsonString = JSON.stringify(userData);
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    console.error("Error writing user data to localStorage:", error);
  }
}

/**
 * Extract base subject name by removing type indicators (mühazirə, məşğələ, laboratoriya, etc.)
 * Now uses global subject mapping system
 */
function getBaseSubjectName(subjectName: string): string {
  const canonicalName = findCanonicalSubjectName(subjectName);
  return canonicalName || subjectName.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

/**
 * Normalize subject name for better matching by:
 * 1. Removing type indicators
 * 2. Converting to lowercase
 * 3. Removing extra spaces
 * 4. Handling common abbreviations
 */
function normalizeSubjectName(subjectName: string): string {
  const canonicalName = findCanonicalSubjectName(subjectName);
  return canonicalName
    ? canonicalName.toLowerCase()
    : globalNormalizeSubjectName(subjectName);
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a score between 0 and 1, where 1 is perfect match
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find the best matching subject from aggregated absences for a given academic_load subject
 * Uses fuzzy matching to handle abbreviated vs full names
 */
function findBestMatchingSubject(
  academicLoadSubject: string,
  aggregatedAbsences: Record<string, number>
): string | null {
  const normalizedAcademicLoad = normalizeSubjectName(academicLoadSubject);
  let bestMatch: string | null = null;
  let bestScore = 0;

  // First try exact match with normalized names
  for (const [storedSubject, _count] of Object.entries(aggregatedAbsences)) {
    const normalizedStored = normalizeSubjectName(storedSubject);
    if (normalizedAcademicLoad === normalizedStored) {
      return storedSubject; // Perfect match, return immediately
    }
  }

  // If no exact match, try fuzzy matching
  for (const [storedSubject, _count] of Object.entries(aggregatedAbsences)) {
    const normalizedStored = normalizeSubjectName(storedSubject);

    // Check if one contains the other (for cases where one is abbreviated)
    if (
      normalizedAcademicLoad.includes(normalizedStored) ||
      normalizedStored.includes(normalizedAcademicLoad)
    ) {
      return storedSubject; // High confidence match
    }

    // Calculate similarity score
    const similarity = calculateSimilarity(
      normalizedAcademicLoad,
      normalizedStored
    );

    // If similarity is high enough (>= 0.7), consider it a potential match
    if (similarity >= 0.7 && similarity > bestScore) {
      bestMatch = storedSubject;
      bestScore = similarity;
    }
  }

  return bestMatch;
}

/**
 * Returns ISO-like week id for today or provided date: e.g. "2025-W40"
 */
export function getCurrentWeekId(date: Date = new Date()): string {
  // ISO week calculation
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ) as Date & {
    // TS relax
  };
  const dayNum = d.getUTCDay() || 7; // Monday=1..Sunday=7
  if (dayNum !== 1) d.setUTCDate(d.getUTCDate() + (1 - dayNum));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const year = d.getUTCFullYear();
  return `${year}-W${weekNo}`;
}

/**
 * Compose a stable per-lesson key that is unique per week/day/index and subject
 * We use a pipe-delimited format to avoid collisions with subject text.
 * Format: weekId|dayIndex|lessonIndex|subject
 */
export function composeLessonKey(params: {
  weekId: string;
  dayIndex: number;
  lessonIndex: number;
  subject: string;
}): string {
  const { weekId, dayIndex, lessonIndex, subject } = params;
  return `${weekId}|${dayIndex}|${lessonIndex}|${subject}`;
}

/**
 * Extract base subject from stored key (supports both legacy and new formats)
 */
function extractBaseSubjectFromStoredKey(storedKey: string): string {
  if (storedKey.includes("|")) {
    // New format weekId|day|index|subject
    const parts = storedKey.split("|");
    const subject = parts.slice(3).join("|");
    return getBaseSubjectName(subject);
  }
  // Legacy fallback: try to take substring after last '-' (best effort)
  const legacySubject = storedKey.includes("-")
    ? storedKey.substring(storedKey.lastIndexOf("-") + 1)
    : storedKey;
  return getBaseSubjectName(legacySubject);
}

/**
 * Get absence count for a specific subject (aggregated across all types)
 * For example: "Fənn (mühazirə)" and "Fənn (məşğələ)" will be counted together as "Fənn"
 */
export function getAbsenceCount(subjectName: string): number {
  const userData = readUserData();
  const baseSubject = getBaseSubjectName(subjectName);

  // Sum up absences for all variants of this subject
  let totalAbsences = 0;
  for (const [key, count] of Object.entries(userData.absences)) {
    if (extractBaseSubjectFromStoredKey(key) === baseSubject) {
      totalAbsences += count;
    }
  }

  return totalAbsences;
}

/**
 * Get absence count for a specific subject variant (exact match only)
 * This is used for showing counts on individual lesson cards
 */
export function getSpecificAbsenceCount(subjectName: string): number {
  const userData = readUserData();
  return userData.absences[subjectName] || 0;
}

/**
 * Set absence count for a specific subject
 * Implements the atomic "Read -> Update -> Write back" cycle
 */
export function setAbsenceCount(subjectName: string, count: number): void {
  const userData = readUserData();
  userData.absences[subjectName] = Math.max(0, count); // Ensure non-negative
  writeUserData(userData);
}

/**
 * Increment absence count for a specific subject
 * Returns the new count
 */
export function incrementAbsenceCount(subjectName: string): number {
  const userData = readUserData();
  const currentCount = userData.absences[subjectName] || 0;
  const newCount = currentCount + 1;
  userData.absences[subjectName] = newCount;
  writeUserData(userData);
  return newCount;
}

/**
 * Decrement absence count for a specific subject
 * Returns the new count (minimum 0)
 */
export function decrementAbsenceCount(subjectName: string): number {
  const userData = readUserData();
  const currentCount = userData.absences[subjectName] || 0;
  const newCount = Math.max(0, currentCount - 1);
  userData.absences[subjectName] = newCount;
  writeUserData(userData);
  return newCount;
}

/**
 * Get grade for a specific subject
 */
export function getGrade(subjectName: string): number | null {
  const userData = readUserData();
  const grade = userData.grades[subjectName];
  return grade !== undefined ? grade : null;
}

/**
 * Set grade for a specific subject
 * Implements the atomic "Read -> Update -> Write back" cycle
 */
export function setGrade(subjectName: string, grade: number): void {
  const userData = readUserData();
  userData.grades[subjectName] = grade;
  writeUserData(userData);
}

/**
 * Remove grade for a specific subject
 */
export function removeGrade(subjectName: string): void {
  const userData = readUserData();
  delete userData.grades[subjectName];
  writeUserData(userData);
}

/**
 * Grades aggregated per base subject (lecture/lab/seminar combined)
 */
export function getSubjectGrade(subjectName: string): number | null {
  const base = getBaseSubjectName(subjectName);
  const userData = readUserData();
  const grade = userData.grades[base];
  return grade !== undefined ? grade : null;
}

export function setSubjectGrade(subjectName: string, grade: number): void {
  const base = getBaseSubjectName(subjectName);
  const userData = readUserData();
  const currentGrade = userData.grades[base] || 0;
  userData.grades[base] = currentGrade + grade;
  writeUserData(userData);
}

export function removeSubjectGrade(subjectName: string): void {
  const base = getBaseSubjectName(subjectName);
  const userData = readUserData();
  delete userData.grades[base];
  writeUserData(userData);
}

/**
 * Per-lesson (week-aware) grade storage for showing the selection on the button
 */
export function getLessonGrade(lessonKey: string): number | null {
  const userData = readUserData();
  const val = userData.grades[lessonKey];
  return val !== undefined ? val : null;
}

export function setLessonGrade(lessonKey: string, grade: number): void {
  const userData = readUserData();

  // Get the previous grade for this lesson to calculate the difference
  const previousGrade = userData.grades[lessonKey] || 0;

  // Update the lesson grade
  userData.grades[lessonKey] = grade;

  // Update the subject grade by adding the difference
  const subject = lessonKey.split("|")[3]; // Extract subject from lessonKey
  const base = getBaseSubjectName(subject);
  const currentSubjectGrade = userData.grades[base] || 0;
  const difference = grade - previousGrade;
  userData.grades[base] = currentSubjectGrade + difference;

  writeUserData(userData);
}

export function removeLessonGrade(lessonKey: string): void {
  const userData = readUserData();
  delete userData.grades[lessonKey];
  writeUserData(userData);
}

/**
 * Get all absences as a record
 */
export function getAllAbsences(): Record<string, number> {
  const userData = readUserData();
  return { ...userData.absences };
}

/**
 * Get aggregated absences by base subject name
 * This groups all subject variants (mühazirə, məşğələ, etc.) under their base subject
 */
export function getAggregatedAbsences(): Record<string, number> {
  const userData = readUserData();
  const aggregated: Record<string, number> = {};

  for (const [subjectName, count] of Object.entries(userData.absences)) {
    const baseSubject = extractBaseSubjectFromStoredKey(subjectName);
    aggregated[baseSubject] = (aggregated[baseSubject] || 0) + count;
  }

  return aggregated;
}

/**
 * Get absence count for a subject from academic_load by finding the best match
 * in the aggregated absences. This handles cases where academic_load has abbreviated
 * names but aggregated absences has full names, or vice versa.
 */
export function getAbsenceCountForAcademicLoadSubject(
  academicLoadSubject: string
): number {
  const aggregatedAbsences = getAggregatedAbsences();
  const matchingSubject = findBestMatchingSubject(
    academicLoadSubject,
    aggregatedAbsences
  );

  if (matchingSubject) {
    return aggregatedAbsences[matchingSubject];
  }

  // If no match found, return 0
  return 0;
}

/**
 * Get the matching subject key from aggregated absences for a given academic_load subject
 * This is used when setting absence counts to ensure we update the correct subject
 */
export function getMatchingSubjectKey(
  academicLoadSubject: string
): string | null {
  const aggregatedAbsences = getAggregatedAbsences();
  return findBestMatchingSubject(academicLoadSubject, aggregatedAbsences);
}

/**
 * Get all subject variants for a base subject
 * For example: getSubjectVariants("Fənn") might return ["Fənn (mühazirə)", "Fənn (məşğələ)"]
 */
export function getSubjectVariants(baseSubjectName: string): string[] {
  const userData = readUserData();
  const variants: string[] = [];

  for (const subjectName of Object.keys(userData.absences)) {
    if (getBaseSubjectName(subjectName) === baseSubjectName) {
      variants.push(subjectName);
    }
  }

  return variants;
}

/**
 * Get all grades as a record
 */
export function getAllGrades(): Record<string, number> {
  const userData = readUserData();
  return { ...userData.grades };
}

/**
 * Clear all user data (reset everything)
 */
export function clearAllUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing user data from localStorage:", error);
  }
}

/**
 * Clear only absences data
 */
export function clearAbsences(): void {
  const userData = readUserData();
  userData.absences = {};
  writeUserData(userData);
}

/**
 * Clear only grades data
 */
export function clearGrades(): void {
  const userData = readUserData();
  userData.grades = {};
  writeUserData(userData);
}

/**
 * Export user data for backup purposes
 */
export function exportUserData(): string {
  const userData = readUserData();
  return JSON.stringify(userData, null, 2);
}

/**
 * Import user data from backup
 */
export function importUserData(jsonString: string): boolean {
  try {
    const userData = JSON.parse(jsonString);

    // Validate structure
    if (typeof userData !== "object" || userData === null) {
      throw new Error("Invalid data structure");
    }

    const validUserData: UserData = {
      absences:
        userData.absences && typeof userData.absences === "object"
          ? userData.absences
          : {},
      grades:
        userData.grades && typeof userData.grades === "object"
          ? userData.grades
          : {},
    };

    writeUserData(validUserData);
    return true;
  } catch (error) {
    console.error("Error importing user data:", error);
    return false;
  }
}

/**
 * Check if user has already added previous absences
 */
export function hasAddedPreviousAbsences(): boolean {
  try {
    return localStorage.getItem("unimaz-previous-absences-added") === "true";
  } catch (error) {
    console.error("Error checking previous absences status:", error);
    return false;
  }
}

/**
 * Mark that user has added previous absences
 */
export function markPreviousAbsencesAdded(): void {
  try {
    localStorage.setItem("unimaz-previous-absences-added", "true");
  } catch (error) {
    console.error("Error marking previous absences as added:", error);
  }
}
