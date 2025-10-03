"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Group, Lesson, WeekType, University } from "@/types";
import {
  getCurrentDayLessons,
  parseTime,
  getCurrentTimeInMinutes,
} from "@/utils/dataManager";
import { calculateCurrentWeekType } from "@/utils/weekCalculator";
import SubjectDetailsModal from "@/components/SubjectDetailsModal";
// Removed localStorage imports - no persistence functionality

interface TimelineScheduleProps {
  group: Group;
  university: University;
}

const TIME_SLOTS = [
  { time: "08:00", label: "08:00" },
  { time: "09:00", label: "09:00" },
  { time: "10:00", label: "10:00" },
  { time: "11:00", label: "11:00" },
  { time: "12:00", label: "12:00" },
  { time: "13:00", label: "13:00" },
  { time: "14:00", label: "14:00" },
  { time: "15:00", label: "15:00" },
  { time: "16:00", label: "16:00" },
  { time: "17:00", label: "17:00" },
  { time: "18:00", label: "18:00" },
];

const SUBJECT_COLORS = [
  "border-blue-500 bg-blue-50",
  "border-green-500 bg-green-50",
  "border-purple-500 bg-purple-50",
  "border-orange-500 bg-orange-50",
  "border-pink-500 bg-pink-50",
  "border-indigo-500 bg-indigo-50",
  "border-red-500 bg-red-50",
  "border-yellow-500 bg-yellow-50",
];

export default function TimelineSchedule({
  group,
  university,
}: TimelineScheduleProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeInMinutes());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{
    subject?: string;
    teacher?: string;
    room?: string;
  } | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeInMinutes());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const weekType: WeekType = useMemo(() => {
    const weekTypeText = calculateCurrentWeekType(university);
    return weekTypeText === "ÜST HƏFTƏDİR" ? "ust" : "alt";
  }, [university]);

  const lessons = useMemo(() => {
    return getCurrentDayLessons(group, weekType);
  }, [group, weekType]);

  // Process lessons for timeline display
  const processedLessons = useMemo(() => {
    return lessons
      .map((lesson, index) => {
        if (lesson.lesson) {
          // Handle lessons with upper/lower variants
          const variant =
            weekType === "ust" ? lesson.lesson.upper : lesson.lesson.lower;
          return {
            ...variant,
            time: lesson.time,
            colorClass: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
            isCurrentWeek: true,
          };
        } else if (lesson.time && lesson.subject) {
          // Handle regular lessons
          return {
            ...lesson,
            colorClass: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
            isCurrentWeek: true,
          };
        }
        return null;
      })
      .filter(
        (
          lesson
        ): lesson is Lesson & { colorClass: string; isCurrentWeek: boolean } =>
          lesson !== null
      )
      .map((lesson) => {
        const timeData = parseTime(lesson.time || "");
        return {
          ...lesson,
          timeData,
          top: timeData ? (timeData.start - 480) * 0.8 : 0, // 8:00 AM = 480 minutes
          height: timeData ? (timeData.end - timeData.start) * 0.8 : 0,
        };
      });
  }, [lessons, weekType]);

  const currentTimePosition = (currentTime - 480) * 0.8; // 8:00 AM = 480 minutes

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Bugünkü Dərs Cədvəli
          </h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString("az-AZ", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="relative">
          {/* Timeline */}
          <div className="relative h-[600px] overflow-y-auto">
            {/* Time markers */}
            <div className="absolute left-0 top-0 w-16 h-full">
              {TIME_SLOTS.map((slot, index) => (
                <div
                  key={slot.time}
                  className="absolute left-0 text-xs text-gray-500 font-medium"
                  style={{ top: `${index * 80}px` }}
                >
                  {slot.label}
                </div>
              ))}
            </div>

            {/* Timeline line */}
            <div className="absolute left-8 top-0 w-0.5 h-full bg-gray-200" />

            {/* Current time indicator */}
            {currentTimePosition >= 0 && currentTimePosition <= 600 && (
              <>
                <motion.div
                  className="absolute left-6 top-0 w-4 h-4 bg-red-500 rounded-full z-10"
                  style={{ top: `${currentTimePosition}px` }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div
                  className="absolute left-8 top-0 w-0.5 bg-red-500 z-10"
                  style={{
                    top: `${currentTimePosition}px`,
                    height: "2px",
                  }}
                />
              </>
            )}

            {/* Lesson cards */}
            <div className="ml-20 relative">
              {processedLessons.map((lesson, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className={`absolute left-0 right-0 rounded-lg border-l-4 ${lesson.colorClass} shadow-sm hover:shadow-lg transition-all duration-300`}
                  style={{
                    top: `${lesson.top}px`,
                    height: `${lesson.height}px`,
                    minHeight: "60px",
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="button"
                    className="h-full w-full text-left p-4 cursor-pointer"
                    onClick={() => {
                      setSelectedSubject({
                        subject: lesson.subject,
                        teacher: lesson.teacher,
                        room: lesson.room,
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="h-full flex flex-col justify-center">
                      <div className="font-bold text-gray-800 text-sm mb-1">
                        {lesson.subject}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {lesson.teacher}
                      </div>
                      <div className="text-xs text-gray-500">
                        Otaq: {lesson.room}
                      </div>
                      {lesson.time && (
                        <div className="text-xs text-gray-500 mt-1">
                          {lesson.time}
                        </div>
                      )}

                      {/* Quick stats removed - no persistence */}
                    </div>
                  </button>
                </motion.div>
              ))}

              {/* No lessons message */}
              {processedLessons.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center h-32 text-gray-500"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-sm">Bu gün dərs yoxdur</div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subject details modal */}
      <SubjectDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={selectedSubject?.subject}
        teacher={selectedSubject?.teacher}
        room={selectedSubject?.room}
        absenceLimit={8}
      />
    </>
  );
}

// QuickStats component removed - no persistence functionality
