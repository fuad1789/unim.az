"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { University, Group, UserPreferences, Lesson, WeekType } from "@/types";
import { getGroupData, getCurrentTimeInMinutes } from "@/utils/dataManager";
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

// Azerbaijani month abbreviations
const AZ_MONTHS_SHORT = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyn",
  "İyl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

function formatAzDateShort(d: Date): string {
  const year = d.getFullYear();
  const month = AZ_MONTHS_SHORT[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const jsDow = d.getDay(); // 0..6, Sun..Sat
  const dowIndex = jsDow === 0 ? 6 : jsDow - 1; // Monday=0..Sunday=6
  const dowShort = DAYS[dowIndex]?.short || "";
  return `${year} ${month} ${day}, ${dowShort}`;
}

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
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return today === 0 ? 6 : today - 1;
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number>(
    getCurrentTimeInMinutes()
  );

  // Tick every 30s to keep countdowns fresh
  useEffect(() => {
    const id = setInterval(
      () => setNowMinutes(getCurrentTimeInMinutes()),
      30000
    );
    return () => clearInterval(id);
  }, []);

  const university = universities.find(
    (u) => u.id === preferences.universityId
  );

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

  // Whether the currently selected day is today
  const isTodaySelected = useMemo(() => {
    const jsDow = new Date().getDay(); // 0..6, Sun..Sat
    const todayIndex = jsDow === 0 ? 6 : jsDow - 1; // Monday=0..Sunday=6
    return selectedDay === todayIndex;
  }, [selectedDay]);

  // Determine lesson status (past | current | upcoming) and live progress
  function getLessonStatus(timeRange: string | undefined): {
    status: "past" | "current" | "upcoming";
    progress: number; // 0..100 for current, otherwise 0
    remainingMinutes?: number; // for current state
  } {
    const now = getCurrentTimeInMinutes();
    const [startStr, endStr] = (timeRange || "").split("-");
    const toMin = (s?: string) => {
      if (!s) return NaN;
      const [h, m] = s.split(":").map((n) => Number(n));
      if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
      return h * 60 + m;
    };
    const start = toMin(startStr);
    const end = toMin(endStr);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { status: "upcoming", progress: 0 };
    }
    if (now < start) return { status: "upcoming", progress: 0 };
    if (now >= end) return { status: "past", progress: 0 };
    const progress = Math.min(
      100,
      Math.max(0, ((now - start) / (end - start)) * 100)
    );
    const remainingMinutes = Math.max(0, end - now);
    return { status: "current", progress, remainingMinutes };
  }

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
      .filter(
        (lesson): lesson is Lesson & { colorClass: string } => lesson !== null
      );
  }, [group, selectedDay, weekType]);

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleDayChange = (direction: "prev" | "next") => {
    if (isTransitioning) return;

    if (direction === "prev" && selectedDay > 0) {
      setIsTransitioning(true);
      setSelectedDay(selectedDay - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    } else if (direction === "next" && selectedDay < DAYS.length - 1) {
      setIsTransitioning(true);
      setSelectedDay(selectedDay + 1);
      setTimeout(() => setIsTransitioning(false), 300);
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
    if (!touchStart || !touchEnd || isTransitioning) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedDay < DAYS.length - 1) {
      setIsTransitioning(true);
      setSelectedDay(selectedDay + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
    if (isRightSwipe && selectedDay > 0) {
      setIsTransitioning(true);
      setSelectedDay(selectedDay - 1);
      setTimeout(() => setIsTransitioning(false), 300);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-area-inset-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {university.img ? (
                  <Image
                    src={university.img}
                    alt={university.name}
                    width={32}
                    height={32}
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
            {formatAzDateShort(new Date())}
          </p>
        </div>
      </div>


      {/* Day Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => handleDayChange("prev")}
            disabled={selectedDay === 0 || isTransitioning}
            className={`p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
              isTransitioning ? "scale-95" : "scale-100"
            }`}
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
            <p className="text-xs text-gray-500 mt-1">Sola/sağa sürüşdürün</p>
          </div>

          <button
            onClick={() => handleDayChange("next")}
            disabled={selectedDay === DAYS.length - 1 || isTransitioning}
            className={`p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
              isTransitioning ? "scale-95" : "scale-100"
            }`}
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
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
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
              {/* Next lesson countdown (only today, and only if no ongoing lesson) */}
              {(() => {
                if (!isTodaySelected) return null;
                const anyCurrent = currentDayLessons.some(
                  (l) => getLessonStatus(l.time).status === "current"
                );
                if (anyCurrent) return null;
                const toStartMin = (t?: string) => {
                  if (!t) return NaN;
                  const [sh] = t.split("-");
                  if (!sh) return NaN;
                  const [hStr, mStr] = sh.split(":");
                  const h = Number(hStr);
                  const m = Number(mStr);
                  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
                  return h * 60 + m;
                };
                const upcoming = currentDayLessons
                  .map((l) => ({ l, start: toStartMin(l.time) }))
                  .filter(({ start }) => start > nowMinutes)
                  .sort((a, b) => a.start - b.start)[0];
                if (!upcoming) return null;
                const minutesLeft = Math.max(0, upcoming.start - nowMinutes);
                return (
                  <div className="flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-full px-3 py-1">
                      Növbəti dərsə {minutesLeft} dəq qalıb
                    </span>
                  </div>
                );
              })()}
              {currentDayLessons.map((lesson, index) => {
                const { status, progress, remainingMinutes } = isTodaySelected
                  ? getLessonStatus(lesson.time)
                  : { status: "upcoming" as const, progress: 0 };
                const isCurrent = status === "current";
                const isPast = status === "past";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                    onClick={() => handleLessonClick(lesson)}
                    className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 cursor-pointer active:scale-95 ${
                      isCurrent
                        ? "bg-blue-50/80 border-blue-200 shadow-md"
                        : isPast
                        ? "bg-gray-50 border-gray-200 opacity-90"
                        : "bg-white border-gray-200 hover:shadow-md"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated left accent and pulsing indicator for current lesson */}
                    {isCurrent && (
                      <motion.div
                        className="absolute left-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-tr-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    )}

                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${lesson.colorClass} mt-2 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h4
                            className={`font-semibold text-base mb-2 line-clamp-2 ${
                              isPast ? "text-gray-500" : "text-gray-900"
                            }`}
                          >
                            {lesson.subject}
                          </h4>
                          {isCurrent && (
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                              {typeof remainingMinutes === "number"
                                ? `${remainingMinutes} dəq qalıb`
                                : "Davam edir"}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`flex items-center space-x-2 text-sm ${
                              isPast ? "text-gray-500" : "text-gray-600"
                            }`}
                          >
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{lesson.teacher}</span>
                          </div>
                          <div
                            className={`flex items-center space-x-2 text-sm ${
                              isPast ? "text-gray-500" : "text-gray-600"
                            }`}
                          >
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>Otaq: {lesson.room}</span>
                          </div>
                          <div
                            className={`flex items-center space-x-2 text-sm ${
                              isPast ? "text-gray-500" : "text-gray-600"
                            }`}
                          >
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{lesson.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
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
              className="bg-white rounded-t-2xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4">
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

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-2">
                      {selectedLesson.subject}
                    </h4>
                    <div className="space-y-2">
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
