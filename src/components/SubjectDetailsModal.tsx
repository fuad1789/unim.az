"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SubjectId,
  getSubjectStats,
  incrementAbsence,
  addGrade,
  removeGradeAt,
  sumGrades,
  makeSubjectId,
} from "@/utils/localStorage";

interface SubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  teacher?: string;
  room?: string;
  absenceLimit?: number; // optional visual threshold e.g., 8
}

export default function SubjectDetailsModal({
  isOpen,
  onClose,
  subject,
  teacher,
  room,
  absenceLimit = 8,
}: SubjectDetailsModalProps) {
  const subjectId: SubjectId | null = useMemo(() => {
    if (!subject) return null;
    return makeSubjectId(subject, teacher, room);
  }, [subject, teacher, room]);

  const [absences, setAbsences] = useState(0);
  const [grades, setGrades] = useState<number[]>([]);
  const [newGrade, setNewGrade] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !subjectId) return;
    const stats = getSubjectStats(subjectId);
    setAbsences(stats.absences);
    setGrades(stats.grades);
  }, [isOpen, subjectId]);

  if (!isOpen) return null;

  const sum = subjectId ? sumGrades(subjectId) : 0;
  const absenceColor =
    absences >= absenceLimit
      ? "text-red-600"
      : absences >= Math.max(1, Math.floor(absenceLimit * 0.75))
      ? "text-yellow-600"
      : "text-gray-800";

  function handleInc(delta: number) {
    if (!subjectId) return;
    const next = incrementAbsence(subjectId, delta);
    setAbsences(next.absences);
  }

  function handleAddGrade() {
    if (!subjectId) return;
    const val = Number(newGrade.replace(",", "."));
    if (!Number.isFinite(val)) return;
    const next = addGrade(subjectId, val);
    setGrades(next.grades);
    setNewGrade("");
  }

  function handleRemoveGrade(index: number) {
    if (!subjectId) return;
    const next = removeGradeAt(subjectId, index);
    setGrades(next.grades);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Fənn</div>
            <div className="font-semibold text-gray-900">{subject || "—"}</div>
            {teacher && (
              <div className="text-xs text-gray-500 mt-0.5">{teacher}</div>
            )}
            {room && <div className="text-xs text-gray-500">Otaq: {room}</div>}
          </div>
          <button
            aria-label="Bağla"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          <section>
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Qayıblar
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                onClick={() => handleInc(-1)}
              >
                −
              </button>
              <div className={`text-lg font-semibold ${absenceColor}`}>
                {absences}
                {absenceLimit ? `/${absenceLimit}` : ""}
              </div>
              <button
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                onClick={() => handleInc(1)}
              >
                +
              </button>
            </div>
          </section>

          <section>
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Qiymətlər
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                inputMode="decimal"
                className="flex-1 px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Qiymət daxil et"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
              />
              <button
                className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleAddGrade}
              >
                Əlavə Et
              </button>
            </div>

            {grades.length === 0 ? (
              <div className="text-sm text-gray-500">Hələ qiymət yoxdur.</div>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded">
                {grades.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>{g}</span>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => handleRemoveGrade(i)}
                      aria-label="Sil"
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 text-sm text-gray-700">
              Cari Bal (cəm): <span className="font-semibold">{sum}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
