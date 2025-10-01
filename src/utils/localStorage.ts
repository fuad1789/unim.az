export type SubjectId = string;

export interface SubjectStats {
  absences: number;
  grades: number[];
}

const STORAGE_NAMESPACE = "unimAz.subjectStats.v1";

interface StorageShape {
  [subjectId: SubjectId]: SubjectStats;
}

function safeParse(json: string | null): StorageShape {
  if (!json) return {};
  try {
    const obj = JSON.parse(json) as StorageShape;
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function readAll(): StorageShape {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_NAMESPACE));
}

function writeAll(data: StorageShape): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(data));
}

export function getSubjectStats(subjectId: SubjectId): SubjectStats {
  const all = readAll();
  const existing = all[subjectId];
  return existing ?? { absences: 0, grades: [] };
}

export function setSubjectStats(
  subjectId: SubjectId,
  stats: SubjectStats
): void {
  const all = readAll();
  all[subjectId] = {
    absences: Math.max(0, Math.floor(stats.absences || 0)),
    grades: Array.isArray(stats.grades)
      ? stats.grades.map((g) => (Number.isFinite(g) ? Number(g) : 0))
      : [],
  };
  writeAll(all);
}

export function incrementAbsence(
  subjectId: SubjectId,
  delta: number
): SubjectStats {
  const stats = getSubjectStats(subjectId);
  const next: SubjectStats = {
    ...stats,
    absences: Math.max(0, stats.absences + delta),
  };
  setSubjectStats(subjectId, next);
  return next;
}

export function addGrade(subjectId: SubjectId, grade: number): SubjectStats {
  const stats = getSubjectStats(subjectId);
  const normalized = Number(grade);
  if (!Number.isFinite(normalized)) return stats;
  const next: SubjectStats = {
    ...stats,
    grades: [...stats.grades, normalized],
  };
  setSubjectStats(subjectId, next);
  return next;
}

export function removeGradeAt(
  subjectId: SubjectId,
  index: number
): SubjectStats {
  const stats = getSubjectStats(subjectId);
  if (index < 0 || index >= stats.grades.length) return stats;
  const next: SubjectStats = {
    ...stats,
    grades: stats.grades.filter((_, i) => i !== index),
  };
  setSubjectStats(subjectId, next);
  return next;
}

export function sumGrades(subjectId: SubjectId): number {
  const stats = getSubjectStats(subjectId);
  return stats.grades.reduce((acc, g) => acc + (Number.isFinite(g) ? g : 0), 0);
}

export function makeSubjectId(
  subject: string,
  teacher?: string,
  room?: string
): SubjectId {
  const base = `${subject || ""}`.trim().toLowerCase();
  const t = `${teacher || ""}`.trim().toLowerCase();
  const r = `${room || ""}`.trim().toLowerCase();
  return [base, t, r].filter(Boolean).join("| ");
}
