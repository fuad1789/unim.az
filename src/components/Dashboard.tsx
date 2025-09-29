"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  University,
  Group,
  UserPreferences,
  Lesson,
  WeekType,
  Day,
} from "@/types";
import {
  getGroupData,
  getCurrentDayLessons,
  parseTime,
  getCurrentTimeInMinutes,
} from "@/utils/dataManager";
import { calculateCurrentWeekType } from "@/utils/weekCalculator";
import {
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
} from "lucide-react";

interface DashboardProps {
  preferences: UserPreferences;
  universities: University[];
  onReset: () => void;
}

const DAYS = [
  { id: "I", name: "Bazar ertəsi", short: "BE" },
  { id: "II", name: "Çərşənbə axşamı", short: "ÇA" },
  { id: "III", name: "Çərşənbə", short: "Ç" },
  { id: "IV", name: "Cümə axşamı", short: "CA" },
  { id: "V", name: "Cümə", short: "C" },
  { id: "VI", name: "Şənbə", short: "Ş" },
  { id: "VII", name: "Bazar", short: "B" },
];

const SUBJECT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
];

export default function Dashboard({
  preferences,
  universities,
  onReset,
}: DashboardProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeInMinutes());
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const university = universities.find(
    (u) => u.id === preferences.universityId
  );

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeInMinutes());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (university) {
      setIsLoading(true);
      setError(null);

      getGroupData(preferences.universityId, preferences.groupName)
        .then((groupData) => {
          if (groupData) {
            setGroup(groupData);
          } else {
            setError("Qrup məlumatları tapılmadı");
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error loading group data:", err);
          setError("Qrup məlumatları yüklənə bilmədi");
          setIsLoading(false);
        });
    }
  }, [preferences, university]);

  const weekType: WeekType = useMemo(() => {
    if (!university) return "ust";
    const weekTypeText = calculateCurrentWeekType(university);
    return weekTypeText === "ÜST HƏFTƏDİR" ? "ust" : "alt";
  }, [university]);

  // Get lessons for selected day
  const currentDayLessons = useMemo(() => {
    if (!group) return [];
    const day = group.week[selectedDay];
    if (!day) return [];

    return day.lessons
      .map((lesson, index) => {
        if (lesson.lesson) {
          const variant =
            weekType === "ust" ? lesson.lesson.upper : lesson.lesson.lower;
          return {
            ...variant,
            time: lesson.time,
            colorClass: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
          };
        } else if (lesson.time && lesson.subject) {
          return {
            ...lesson,
            colorClass: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [group, selectedDay, weekType]);

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleDayChange = (direction: "prev" | "next") => {
    if (direction === "prev" && selectedDay > 0) {
      setSelectedDay(selectedDay - 1);
    } else if (direction === "next" && selectedDay < DAYS.length - 1) {
      setSelectedDay(selectedDay + 1);
    }
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedDay < DAYS.length - 1) {
      setSelectedDay(selectedDay + 1);
    }
    if (isRightSwipe && selectedDay > 0) {
      setSelectedDay(selectedDay - 1);
    }
  };

  if (!university) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <div>Universitet məlumatları tapılmadı</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Yüklənir...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Yenidən başla
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div className="text-gray-600 mb-4">Qrup məlumatları tapılmadı</div>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Yenidən başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-area-inset-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {university.img ? (
                  <img
                    src={university.img}
                    alt={university.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-gray-900 text-sm truncate">
                  {university.name}
                </h1>
                <p className="text-xs text-gray-600">
                  Qrup: {preferences.groupName}
                </p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm flex-shrink-0"
            >
              Dəyişdir
            </button>
          </div>
        </div>
      </div>

      {/* Week Type Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="text-center">
          <h2 className="text-lg font-bold">
            {calculateCurrentWeekType(university)}
          </h2>
          <p className="text-blue-100 text-sm">
            {new Date().toLocaleDateString("az-AZ", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => handleDayChange("prev")}
            disabled={selectedDay === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 text-center">
            <h3 className="font-bold text-gray-900 text-lg">
              {DAYS[selectedDay]?.name}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedDay + 1} / {DAYS.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Swipe left/right to navigate
            </p>
          </div>

          <button
            onClick={() => handleDayChange("next")}
            disabled={selectedDay === DAYS.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day indicator dots */}
        <div className="flex justify-center space-x-2 pb-3">
          {DAYS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedDay ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Schedule Content */}
      <div
        className="px-4 py-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentDayLessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bu gün dərs yoxdur
            </h3>
            <p className="text-gray-600">
              {DAYS[selectedDay]?.name} günü üçün dərs cədvəli yoxdur
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentDayLessons.map((lesson, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleLessonClick(lesson)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${lesson.colorClass} mt-2 flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">
                      {lesson.subject}
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lesson.teacher}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>Otaq: {lesson.room}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{lesson.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-2xl w-full max-w-md mx-4 mb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Dərs Təfərrüatları
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-2">
                      {selectedLesson.subject}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Müəllim</p>
                          <p className="font-medium text-gray-900">
                            {selectedLesson.teacher}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Otaq</p>
                          <p className="font-medium text-gray-900">
                            {selectedLesson.room}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Vaxt</p>
                          <p className="font-medium text-gray-900">
                            {selectedLesson.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
