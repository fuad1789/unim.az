"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";

interface GradeRatingProps {
  isOpen: boolean;
  onClose: () => void;
  onGradeSelect: (grade: number) => void;
  currentGrade?: number;
  subjectName: string;
}

const GRADES = [1, 2, 3, 4, 5];

export default function GradeRating({
  isOpen,
  onClose,
  onGradeSelect,
  currentGrade,
  subjectName,
}: GradeRatingProps) {
  const [selectedGrade, setSelectedGrade] = useState<number>(currentGrade || 5);

  const handleGradeClick = (grade: number) => {
    setSelectedGrade(grade);
    onGradeSelect(grade);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Qiymət ver</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h4 className="text-base font-medium text-gray-900 mb-1">
                {subjectName}
              </h4>
              <p className="text-sm text-gray-600">Dərs üçün qiymət seçin</p>
            </div>

            {/* Grade buttons */}
            <div className="flex justify-center space-x-3 mb-6">
              {GRADES.map((grade) => (
                <motion.button
                  key={grade}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGradeClick(grade)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                    selectedGrade === grade
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {grade}
                </motion.button>
              ))}
            </div>

            {/* Grade description */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>
                  {selectedGrade === 1 && "Çox pis"}
                  {selectedGrade === 2 && "Pis"}
                  {selectedGrade === 3 && "Orta"}
                  {selectedGrade === 4 && "Yaxşı"}
                  {selectedGrade === 5 && "Əla"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
