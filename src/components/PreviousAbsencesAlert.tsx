"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Plus, Minus, Check } from "lucide-react";
import { Group } from "@/types";
import { setAbsenceCount, getAggregatedAbsences } from "@/utils/localStorage";

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
      const currentAbsences = getAggregatedAbsences();
      const newSubjects: SubjectAbsence[] = group.academic_load.map((item) => {
        const limit = Math.floor(item.total_hours * 0.25);
        const currentAbsencesForSubject = currentAbsences[item.subject] || 0;

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
          // Add previous absences to current count
          const currentCount = subject.currentAbsences;
          const newCount = currentCount + subject.previousAbsences;
          setAbsenceCount(subject.subject, newCount);
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Əvvəlki Qayibları Əlavə Et
                  </h2>
                  <p className="text-orange-100 text-sm">
                    Semestrin ortasında olduğunuz üçün əvvəlki qayibları qeyd
                    edin
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Məlumat
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Semestrin ortasında olduğunuz üçün əvvəlki qayibları əlavə
                      etməlisiniz. Hər fənn üçün əvvəlki qayib sayını daxil
                      edin. Bu məlumatlar yalnız bir dəfə soruşulacaq.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Fənn məlumatları yüklənir...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {subject.subject}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Limit: {subject.limit} qayib | Hazırda:{" "}
                          {subject.currentAbsences} qayib
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          handleAbsenceChange(
                            index,
                            subject.previousAbsences - 1
                          )
                        }
                        disabled={subject.previousAbsences <= 0}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-red-600" />
                      </button>

                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max={subject.limit}
                          value={subject.previousAbsences}
                          onChange={(e) =>
                            handleAbsenceChange(
                              index,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center text-lg font-semibold bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Əvvəlki qayib
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleAbsenceChange(
                            index,
                            subject.previousAbsences + 1
                          )
                        }
                        disabled={subject.previousAbsences >= subject.limit}
                        className="w-8 h-8 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-green-600" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Ümumi qayib</span>
                        <span>
                          {subject.currentAbsences + subject.previousAbsences}/
                          {subject.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (subject.currentAbsences +
                              subject.previousAbsences) /
                              subject.limit >=
                            0.9
                              ? "bg-red-500"
                              : (subject.currentAbsences +
                                  subject.previousAbsences) /
                                  subject.limit >=
                                0.75
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              ((subject.currentAbsences +
                                subject.previousAbsences) /
                                subject.limit) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {hasAnyPreviousAbsences && (
                  <span className="font-medium">
                    Ümumi əlavə ediləcək qayib: {totalPreviousAbsences}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
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
