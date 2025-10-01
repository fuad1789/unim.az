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

// Slider-based 1..10 rating

export default function GradeRating({
  isOpen,
  onClose,
  onGradeSelect,
  currentGrade,
  subjectName,
}: GradeRatingProps) {
  const [selectedGrade, setSelectedGrade] = useState<number>(
    typeof currentGrade === "number" ? currentGrade : 0
  );

  const commitSelection = (grade: number) => {
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

            {/* Minimal slider 1..10 */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="px-4 py-2 rounded-full bg-blue-600 text-white text-lg font-bold shadow">
                  {selectedGrade}
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value))}
                  onMouseUp={() => commitSelection(selectedGrade)}
                  onTouchEnd={() => commitSelection(selectedGrade)}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>
                  {selectedGrade === 0 && "Seçilməyib"}
                  {selectedGrade >= 1 && selectedGrade <= 2 && "Çox pis"}
                  {selectedGrade >= 3 && selectedGrade <= 4 && "Pis"}
                  {selectedGrade >= 5 && selectedGrade <= 6 && "Orta"}
                  {selectedGrade >= 7 && selectedGrade <= 8 && "Yaxşı"}
                  {selectedGrade >= 9 && selectedGrade <= 10 && "Əla"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
