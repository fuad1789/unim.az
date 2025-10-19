"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { University, Group, UserPreferences, Lesson, WeekType } from "@/types";
import { getGroupData, getCurrentTimeInMinutes } from "@/utils/dataManager";
import { calculateCurrentWeekType } from "@/utils/weekCalculator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  calculateAbsenceLimits,
  getAbsenceLimitForSubject,
  isMidSemester,
} from "@/utils/academics";
import {
  getAbsenceCount,
  getSpecificAbsenceCount,
  setAbsenceCount,
  getSubjectGrade,
  getLessonGrade,
  setLessonGrade,
  getCurrentWeekId,
  composeLessonKey,
  hasAddedPreviousAbsences,
} from "@/utils/localStorage";
import GradeRating from "./GradeRating";
import PreviousAbsencesAlert from "./PreviousAbsencesAlert";
import {
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
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

  // Offline sync hook
  useOfflineSync({
    universityId: preferences.universityId,
    autoSync: true,
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return today === 0 ? 6 : today - 1;
  });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number>(
    getCurrentTimeInMinutes()
  );
  // UI state for attendance and grades (now with localStorage persistence)
  const [attendanceStates, setAttendanceStates] = useState<
    Record<string, boolean>
  >({});
  const [showAttendanceOptions, setShowAttendanceOptions] = useState<
    string | null
  >(null);
  const [showGradeRating, setShowGradeRating] = useState<string | null>(null);
  const [showPreviousAbsencesAlert, setShowPreviousAbsencesAlert] =
    useState(false);

  // Force re-render trigger for localStorage updates
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounced refresh to prevent excessive re-renders
  const debouncedRefresh = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 200);
    };
  }, []);

  // Computed absence limits based on academic load
  const absenceLimits = useMemo(() => {
    if (!group?.academic_load) return {};
    return calculateAbsenceLimits(group.academic_load);
  }, [group?.academic_load]);

  // Tick every 30s to keep countdowns fresh
  useEffect(() => {
    const id = setInterval(
      () => setNowMinutes(getCurrentTimeInMinutes()),
      30000
    );
    return () => clearInterval(id);
  }, []);

  // Initialize UI states when group changes
  useEffect(() => {
    if (group) {
      // Reset UI states (localStorage data is loaded on-demand)
      setAttendanceStates({});
    }
  }, [group]);

  // Load attendance states from localStorage when component mounts or group changes
  useEffect(() => {
    if (group) {
      const newAttendanceStates: Record<string, boolean> = {};

      // Check all lessons for existing absences
      const days = group.week_schedule || group.week || [];
      days.forEach((day, dayIndex) => {
        day.lessons.forEach((lesson, lessonIndex) => {
          if (lesson.subject) {
            const weekAwareKey = composeLessonKey({
              weekId: getCurrentWeekId(),
              dayIndex,
              lessonIndex,
              subject: lesson.subject,
            });

            // Check if absence exists for this lesson
            if (getSpecificAbsenceCount(weekAwareKey) > 0) {
              const lessonKey = `${dayIndex}-${lessonIndex}-${lesson.subject}`;
              newAttendanceStates[lessonKey] = true;
            }
          }
        });
      });

      setAttendanceStates(newAttendanceStates);
    }
  }, [group, refreshTrigger]);

  // Check if we should show the previous absences alert
  useEffect(() => {
    if (group && isMidSemester() && !hasAddedPreviousAbsences()) {
      // Show alert after a short delay to let the dashboard load
      const timer = setTimeout(() => {
        setShowPreviousAbsencesAlert(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [group]);

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

  // Memoize expensive calculations to prevent unnecessary re-renders
  const memoizedLessonData = useMemo(() => {
    if (!group) return [];

    const days = group.week_schedule || group.week || [];
    const day = days[selectedDay];
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

  // Get lessons for selected day - now using memoized data
  const currentDayLessons = memoizedLessonData;

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
    if (showGradeRating) return; // Disable swipe when grade modal is open
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showGradeRating) return; // Disable swipe when grade modal is open
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (showGradeRating) return; // Disable swipe when grade modal is open
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

  const handleAttendanceClick = (lessonKey: string) => {
    setShowAttendanceOptions(
      showAttendanceOptions === lessonKey ? null : lessonKey
    );
  };

  const handleAttendanceSelect = (
    lessonKey: string,
    type: "first" | "second"
  ) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [lessonKey]: true,
    }));

    // Build week-aware lesson key to keep data per week/day/lesson
    const [dayIndexStr, indexStr, ...subjectParts] = lessonKey.split("-");
    const weekAwareKey = composeLessonKey({
      weekId: getCurrentWeekId(),
      dayIndex: Number(dayIndexStr),
      lessonIndex: Number(indexStr),
      subject: subjectParts.join("-"),
    });

    // Set the exact count based on selection (don't add to existing)
    if (type === "first") {
      setAbsenceCount(weekAwareKey, 1); // 1 absence for this specific lesson this week
    } else {
      setAbsenceCount(weekAwareKey, 2); // 2 absences for this specific lesson this week
    }

    // Force re-render by triggering state update (debounced)
    debouncedRefresh();

    setShowAttendanceOptions(null);
  };

  const handleAttendanceRemove = (lessonKey: string) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [lessonKey]: false,
    }));

    // Build week-aware lesson key to keep data per week/day/lesson
    const [dayIndexStr, indexStr, ...subjectParts] = lessonKey.split("-");
    const weekAwareKey = composeLessonKey({
      weekId: getCurrentWeekId(),
      dayIndex: Number(dayIndexStr),
      lessonIndex: Number(indexStr),
      subject: subjectParts.join("-"),
    });

    // Remove absence count (set to 0)
    setAbsenceCount(weekAwareKey, 0);

    // Force re-render by triggering state update (debounced)
    debouncedRefresh();

    setShowAttendanceOptions(null);
  };

  const handleGradeClick = (lessonKey: string) => {
    setShowGradeRating(lessonKey);
  };

  const handleGradeSelect = (lessonKey: string, grade: number) => {
    // Write per-lesson grade (for button display) and update subject grade accordingly
    const subject = lessonKey.split("-").slice(2).join("-");
    const weekAwareKey = composeLessonKey({
      weekId: getCurrentWeekId(),
      dayIndex: Number(lessonKey.split("-")[0]),
      lessonIndex: Number(lessonKey.split("-")[1]),
      subject,
    });
    setLessonGrade(weekAwareKey, grade);

    // Force re-render by triggering state update (debounced)
    debouncedRefresh();
  };

  const handleGradeRatingClose = () => {
    setShowGradeRating(null);
  };

  const handlePreviousAbsencesClose = () => {
    setShowPreviousAbsencesAlert(false);
  };

  const handlePreviousAbsencesConfirm = () => {
    setShowPreviousAbsencesAlert(false);
    // Force re-render to update absence counts (debounced)
    debouncedRefresh();
  };

  // Helper function to get absence limit for a lesson
  const getAbsenceLimitForLesson = (lessonSubject: string): number => {
    return getAbsenceLimitForSubject(lessonSubject, absenceLimits);
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
    <div
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-area-inset-top">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {university.img ? (
                  <Image
                    src={university.img}
                    alt={university.name}
                    width={32}
                    height={32}
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                ) : (
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                  {university.name}
                </h1>
                <p className="text-xs text-gray-600 truncate">
                  Qrup: {preferences.groupName}
                </p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs sm:text-sm flex-shrink-0 touch-manipulation"
            >
              Dəyişdir
            </button>
          </div>
        </div>
      </div>

      {/* Week Type Banner - Modernized */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-4 sm:py-5">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-sans">
            {calculateCurrentWeekType(university)}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm">
            {formatAzDateShort(new Date())}
          </p>
        </div>
      </div>

      {/* Day Navigation - Enhanced */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={() => handleDayChange("prev")}
            disabled={selectedDay === 0 || isTransitioning}
            className={`p-2 sm:p-3 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95 ${
              isTransitioning ? "scale-95" : "scale-100"
            }`}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>

          <motion.div
            className="flex-1 text-center"
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">
              {DAYS[selectedDay]?.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedDay + 1} / {DAYS.length}
            </p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">
              Sola/sağa sürüşdürün
            </p>
          </motion.div>

          <button
            onClick={() => handleDayChange("next")}
            disabled={selectedDay === DAYS.length - 1 || isTransitioning}
            className={`p-2 sm:p-3 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95 ${
              isTransitioning ? "scale-95" : "scale-100"
            }`}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Day indicator dots */}
        <div className="flex justify-center space-x-1.5 sm:space-x-2 pb-2 sm:pb-3">
          {DAYS.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                index === selectedDay ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Schedule Content */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
            <div className="space-y-3 sm:space-y-4">
              {/* Lesson countdown banner: show remaining of current lesson; otherwise, next lesson */}
              {(() => {
                if (!isTodaySelected) return null;

                // Check if there's an ongoing lesson and show time remaining for it first
                const currentLesson = currentDayLessons.find(
                  (l) => getLessonStatus(l.time).status === "current"
                );
                if (currentLesson) {
                  const { remainingMinutes = 0 } = getLessonStatus(
                    currentLesson.time
                  );
                  return (
                    <div className="flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-full px-2 sm:px-3 py-1">
                        Dərsin bitməsinə {remainingMinutes} dəq qalıb
                      </span>
                    </div>
                  );
                }

                // Otherwise, show countdown to the next lesson
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
                    <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-full px-2 sm:px-3 py-1">
                      Növbəti dərsə {minutesLeft} dəq qalıb
                    </span>
                  </div>
                );
              })()}
              {currentDayLessons.map((lesson, index) => {
                const { status, progress } = isTodaySelected
                  ? getLessonStatus(lesson.time)
                  : { status: "upcoming" as const, progress: 0 };
                const isCurrent = status === "current";
                const isPast = status === "past";

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: "easeOut",
                    }}
                    className={`relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-md ${
                      isCurrent
                        ? "bg-blue-50/80 border-blue-200 shadow-md"
                        : isPast
                        ? "bg-gray-50 border-gray-200 opacity-90"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {/* Animated left accent and pulsing indicator for current lesson */}
                    {isCurrent && (
                      <div
                        className="absolute left-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-tr-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    {/* Main card content */}
                    <div className="p-4">
                      <div className="flex items-start space-x-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4
                              className={`font-semibold text-xs sm:text-sm line-clamp-2 flex-1 min-w-0 ${
                                isPast ? "text-gray-500" : "text-gray-900"
                              }`}
                            >
                              {lesson.subject}
                            </h4>
                          </div>

                          <div className="space-y-1">
                            <div
                              className={`flex items-center space-x-2 text-xs ${
                                isPast ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{lesson.teacher}</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-xs ${
                                isPast ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Otaq: {lesson.room}</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-xs ${
                                isPast ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{lesson.time}</span>
                            </div>

                            {/* Qayib məlumatı - ayrı xətt ilə */}
                            {lesson.subject && (
                              <>
                                <div className="border-t border-gray-200 my-1.5"></div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {(() => {
                                      if (!lesson.subject) return null;
                                      // Show aggregated total for this subject across all weeks
                                      const current = getAbsenceCount(
                                        lesson.subject
                                      );
                                      const limit = getAbsenceLimitForLesson(
                                        lesson.subject
                                      );

                                      if (limit === 0) return null;

                                      const percentage = Math.min(
                                        (current / limit) * 100,
                                        100
                                      );
                                      const isWarning = percentage >= 75;
                                      const isDanger = percentage >= 90;

                                      const gradeValue = getSubjectGrade(
                                        String(lesson.subject)
                                      );

                                      return (
                                        <div className="flex items-center space-x-2">
                                          {/* Absence total badge */}
                                          <span
                                            className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
                                              isDanger
                                                ? "bg-red-100 text-red-700"
                                                : isWarning
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-blue-100 text-blue-700"
                                            }`}
                                          >
                                            {current}/{limit}
                                          </span>
                                          {/* Grade total badge */}
                                          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                            {gradeValue ?? 0}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Simple action buttons on the right */}
                        <div className="flex flex-col items-center space-y-1.5 ml-2">
                          <div className="flex flex-col space-y-1.5">
                            {/* Davamiyyət düyməsi - aşağıya genişlənən animasiyalı */}
                            <div className="flex flex-col items-center space-y-2">
                              {/* Q düyməsi - yalnız seçimlər açıq olmadıqda görünür */}
                              {showAttendanceOptions !==
                                `${selectedDay}-${index}-${lesson.subject}` && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const lessonKey = `${selectedDay}-${index}-${lesson.subject}`;
                                    handleAttendanceClick(lessonKey);
                                  }}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95 ${
                                    attendanceStates[
                                      `${selectedDay}-${index}-${lesson.subject}`
                                    ]
                                      ? "bg-red-500 hover:bg-red-600 shadow-md"
                                      : "bg-gray-100 hover:bg-gray-200"
                                  }`}
                                >
                                  {(() => {
                                    const key = composeLessonKey({
                                      weekId: getCurrentWeekId(),
                                      dayIndex: selectedDay,
                                      lessonIndex: index,
                                      subject: String(lesson.subject),
                                    });
                                    const count = lesson.subject
                                      ? getSpecificAbsenceCount(key)
                                      : 0;
                                    // refreshTrigger is used to force re-render when localStorage changes
                                    const text =
                                      count === 1
                                        ? "'40"
                                        : count === 2
                                        ? "'80"
                                        : "Q";
                                    const isSet =
                                      attendanceStates[
                                        `${selectedDay}-${index}-${lesson.subject}`
                                      ];
                                    return (
                                      <span
                                        className={`text-xs font-bold ${
                                          isSet ? "text-white" : "text-gray-600"
                                        }`}
                                      >
                                        {text}
                                      </span>
                                    );
                                  })()}
                                </button>
                              )}

                              {/* Seçim düymələri - Q düyməsi '40-a çevrilir, '80 aşağı düşür */}
                              {showAttendanceOptions ===
                                `${selectedDay}-${index}-${lesson.subject}` && (
                                <motion.div
                                  className="flex flex-col items-center space-y-2"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{
                                    duration: 0.25,
                                    ease: "easeInOut",
                                  }}
                                >
                                  {/* Remove button - shown when absences exist */}
                                  {(() => {
                                    const key = composeLessonKey({
                                      weekId: getCurrentWeekId(),
                                      dayIndex: selectedDay,
                                      lessonIndex: index,
                                      subject: String(lesson.subject),
                                    });
                                    const count = lesson.subject
                                      ? getSpecificAbsenceCount(key)
                                      : 0;
                                    return count > 0 ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const lessonKey = `${selectedDay}-${index}-${lesson.subject}`;
                                          handleAttendanceRemove(lessonKey);
                                        }}
                                        className="w-7 h-7 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                                        title="Qayıbı sil"
                                      >
                                        ✕
                                      </button>
                                    ) : null;
                                  })()}

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const lessonKey = `${selectedDay}-${index}-${lesson.subject}`;
                                      handleAttendanceSelect(
                                        lessonKey,
                                        "first"
                                      );
                                    }}
                                    className="w-7 h-7 bg-red-300 text-white text-[11px] font-bold rounded-full flex items-center justify-center hover:bg-red-400 transition-all duration-200 hover:scale-105"
                                  >
                                    &apos;40
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const lessonKey = `${selectedDay}-${index}-${lesson.subject}`;
                                      handleAttendanceSelect(
                                        lessonKey,
                                        "second"
                                      );
                                    }}
                                    className="w-7 h-7 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-105"
                                  >
                                    &apos;80
                                  </button>
                                </motion.div>
                              )}
                            </div>

                            {/* Qiymət düyməsi - qayib seçimləri açıq olduqda gizlənir */}
                            {showAttendanceOptions !==
                              `${selectedDay}-${index}-${lesson.subject}` && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const lessonKey = `${selectedDay}-${index}-${lesson.subject}`;
                                  handleGradeClick(lessonKey);
                                }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95 ${
                                  (() => {
                                    if (!lesson.subject) return false;
                                    const key = composeLessonKey({
                                      weekId: getCurrentWeekId(),
                                      dayIndex: selectedDay,
                                      lessonIndex: index,
                                      subject: String(lesson.subject),
                                    });
                                    return getLessonGrade(key) !== null;
                                  })()
                                    ? "bg-green-500 hover:bg-green-600 shadow-md"
                                    : "bg-green-100 hover:bg-green-200"
                                }`}
                              >
                                {(() => {
                                  // Only show filled (green) state if THIS lesson has a stored lesson grade
                                  const hasLessonGrade = (() => {
                                    if (!lesson.subject) return false;
                                    const key = composeLessonKey({
                                      weekId: getCurrentWeekId(),
                                      dayIndex: selectedDay,
                                      lessonIndex: index,
                                      subject: String(lesson.subject),
                                    });
                                    return getLessonGrade(key) !== null;
                                  })();
                                  return hasLessonGrade;
                                })() ? (
                                  <span className="text-white text-[11px] font-bold">
                                    {(() => {
                                      if (!lesson.subject) return 0;
                                      const weekAwareKey = composeLessonKey({
                                        weekId: getCurrentWeekId(),
                                        dayIndex: selectedDay,
                                        lessonIndex: index,
                                        subject: String(lesson.subject),
                                      });
                                      return getLessonGrade(weekAwareKey) ?? 0;
                                    })()}
                                  </span>
                                ) : (
                                  <Award className="w-4.5 h-4.5 text-green-600" />
                                )}
                              </button>
                            )}
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

      {/* Grade Rating Modal */}
      {showGradeRating && (
        <GradeRating
          isOpen={!!showGradeRating}
          onClose={handleGradeRatingClose}
          onGradeSelect={(grade: number) => {
            if (showGradeRating) {
              handleGradeSelect(showGradeRating, grade);
            }
          }}
          currentGrade={(() => {
            if (!showGradeRating) return 0;
            return 0; // Always start from 0 for new grade entry
          })()}
          subjectName={(() => {
            const [dayIndex, lessonIndex] = showGradeRating.split("-");
            const day = (group?.week_schedule || group?.week || [])[
              parseInt(dayIndex)
            ];
            const lesson = day?.lessons[parseInt(lessonIndex)];
            return lesson?.subject || "Dərs";
          })()}
        />
      )}

      {/* Previous Absences Alert */}
      <PreviousAbsencesAlert
        isOpen={showPreviousAbsencesAlert}
        onClose={handlePreviousAbsencesClose}
        onConfirm={handlePreviousAbsencesConfirm}
        group={group}
      />
    </div>
  );
}
