"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Check, Info } from "lucide-react";
import { Group } from "@/types";
import {
  setAbsenceCount,
  getAbsenceCountForAcademicLoadSubject,
  getMatchingSubjectKey,
} from "@/utils/localStorage";

interface PreviousAbsencesAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  group: Group | null;
}

interface SubjectAbsence {
  subject: string;
  currentAbsences: number;
  limit: number;
  previousAbsences: number;
}

export default function PreviousAbsencesAlert({
  isOpen,
  onClose,
  onConfirm,
  group,
}: PreviousAbsencesAlertProps) {
  const [subjects, setSubjects] = useState<SubjectAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize subjects when group changes
  useEffect(() => {
    if (group?.academic_load) {
      const newSubjects: SubjectAbsence[] = group.academic_load.map((item) => {
        const limit = Math.floor(item.total_hours * 0.25);
        const currentAbsencesForSubject = getAbsenceCountForAcademicLoadSubject(
          item.subject
        );

        return {
          subject: item.subject,
          currentAbsences: currentAbsencesForSubject,
          limit,
          previousAbsences: 0,
        };
      });

      setSubjects(newSubjects);
    }
  }, [group]);

  const handleAbsenceChange = (index: number, value: number) => {
    setSubjects((prev) => {
      const newSubjects = [...prev];
      newSubjects[index].previousAbsences = Math.max(
        0,
        Math.min(value, newSubjects[index].limit)
      );
      return newSubjects;
    });
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      // Add previous absences to localStorage
      subjects.forEach((subject) => {
        if (subject.previousAbsences > 0) {
          // Find the matching subject key in aggregated absences
          const matchingKey = getMatchingSubjectKey(subject.subject);
          if (matchingKey) {
            // Add previous absences to current count
            const currentCount = subject.currentAbsences;
            const newCount = currentCount + subject.previousAbsences;
            setAbsenceCount(matchingKey, newCount);
          } else {
            // If no matching key found, use the academic_load subject name as fallback
            const currentCount = subject.currentAbsences;
            const newCount = currentCount + subject.previousAbsences;
            setAbsenceCount(subject.subject, newCount);
          }
        }
      });

      // Mark as completed in localStorage
      localStorage.setItem("unimaz-previous-absences-added", "true");

      onConfirm();
    } catch (error) {
      console.error("Error adding previous absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPreviousAbsences = subjects.reduce(
    (sum, subject) => sum + subject.previousAbsences,
    0
  );
  const hasAnyPreviousAbsences = totalPreviousAbsences > 0;

  if (!isOpen || !group) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
            mass: 0.8,
          }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Əvvəlki Qayiblar
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Semestr ortası qeydiyyatı
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 group"
              >
                <X className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Info Card */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">
                      Məlumat
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Semestrin ortasında olduğunuz üçün əvvəlki qayibları əlavə
                      etməlisiniz. Bu məlumatlar yalnız bir dəfə soruşulacaq.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">
                  Fənn məlumatları yüklənir...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    {/* Subject Header */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                        {subject.subject}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Limit: {subject.limit}</span>
                        <span>•</span>
                        <span>Hazırda: {subject.currentAbsences}</span>
                      </div>
                    </div>

                    {/* Counter */}
                    <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
                      <button
                        onClick={() =>
                          handleAbsenceChange(
                            index,
                            subject.previousAbsences - 1
                          )
                        }
                        disabled={subject.previousAbsences <= 0}
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200 disabled:border-gray-100"
                      >
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      </button>

                      <div className="text-center">
                        <div className="w-12 h-10 sm:w-16 sm:h-12 bg-white border border-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            {subject.previousAbsences}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleAbsenceChange(
                            index,
                            subject.previousAbsences + 1
                          )
                        }
                        disabled={subject.previousAbsences >= subject.limit}
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200 disabled:border-gray-100"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Ümumi qayib</span>
                        <span className="font-medium">
                          {subject.currentAbsences + subject.previousAbsences}/
                          {subject.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${
                            (subject.currentAbsences +
                              subject.previousAbsences) /
                              subject.limit >=
                            0.9
                              ? "bg-red-500"
                              : (subject.currentAbsences +
                                  subject.previousAbsences) /
                                  subject.limit >=
                                0.75
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              ((subject.currentAbsences +
                                subject.previousAbsences) /
                                subject.limit) *
                                100,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
              {hasAnyPreviousAbsences && (
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Ümumi əlavə ediləcək: {totalPreviousAbsences} qayib
                  </span>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium text-sm"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Əlavə edilir...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Təsdiq et</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
