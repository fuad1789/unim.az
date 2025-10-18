"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import {
  saveWizardData,
  loadWizardData,
  clearWizardData,
  saveSchedule,
  saveScheduleToMongoDB,
  type ScheduleData,
  type AcademicLoad,
  type Lesson,
  type SubLesson,
} from "@/utils/scheduleManager";

const DAYS = ["B.e.", "Ç.a.", "Çər.", "C.a.", "Cümə"];
const DAY_NAMES = {
  "B.e.": "Bazar ertəsi",
  "Ç.a.": "Çərşənbə axşamı",
  "Çər.": "Çərşənbə",
  "C.a.": "Cümə axşamı",
  Cümə: "Cümə",
};
const TIME_SLOTS = [
  "08:30-09:50",
  "10:05-11:25",
  "11:40-13:00",
  "13:15-14:35",
  "14:50-16:10",
  "16:25-17:45",
];

const COMMON_SUBJECTS = [
  "Kompüter mühəndisliyinin əsasları",
  "Proqramlaşdırmanın əsasları",
  "Xətti cəbr və analitik həndəsə",
  "Azərbaycan dilində işgüzar və akademik kommunikasiya",
  "Xarici dil",
  "Fəlsəfə",
  "Fizika",
  "Riyaziyyat",
  "İnformasiya texnologiyaları",
  "Verilənlər bazası",
  "Alqoritmlər və məlumat strukturları",
  "Kompyuter şəbəkələri",
  "Operasiya sistemləri",
  "Proqram mühəndisliyi",
  "Veb texnologiyaları",
];

function ScheduleWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupName = searchParams.get("group") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [hasLessonsToday, setHasLessonsToday] = useState<boolean | null>(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(
    null
  );
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<
    number | null
  >(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<number | null>(null);
  const [focusedSubjectIndex, setFocusedSubjectIndex] = useState<number | null>(
    null
  );
  const [focusedAcademicSubjectIndex, setFocusedAcademicSubjectIndex] =
    useState<number | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    group_id: groupName,
    faculty: "Mühəndislik",
    academic_load: [],
    week_schedule: DAYS.map((day, index) => ({
      day: ["I", "II", "III", "IV", "V"][index] || day,
      lessons: [],
    })),
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (groupName) {
      const saved = loadWizardData();
      if (saved) {
        setScheduleData(saved);
      }
    }
  }, [groupName]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (groupName && scheduleData.academic_load.length > 0) {
      saveWizardData(scheduleData);
    }
  }, [scheduleData, groupName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownOpen !== null) {
        const target = event.target as Element;
        if (!target.closest(".type-dropdown-container")) {
          closeTypeDropdown();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [typeDropdownOpen]);

  const addSubject = () => {
    setScheduleData((prev) => ({
      ...prev,
      academic_load: [...prev.academic_load, { subject: "", total_hours: 0 }],
    }));
  };

  const updateSubject = (
    index: number,
    field: keyof AcademicLoad,
    value: string | number
  ) => {
    setScheduleData((prev) => ({
      ...prev,
      academic_load: prev.academic_load.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      ),
    }));
  };

  const removeSubject = (index: number) => {
    setScheduleData((prev) => ({
      ...prev,
      academic_load: prev.academic_load.filter((_, i) => i !== index),
    }));
  };

  const addLesson = (dayIndex: number) => {
    const currentDay = scheduleData.week_schedule[dayIndex];
    const existingLessons = currentDay.lessons;

    // Find the next available time slot
    let nextTimeSlot = "";

    if (existingLessons.length > 0) {
      // Get all used time slots
      const usedTimeSlots = existingLessons
        .map((lesson) => lesson.time)
        .filter((time) => time && TIME_SLOTS.includes(time))
        .sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));

      if (usedTimeSlots.length > 0) {
        // Find the last used time slot
        const lastUsedTime = usedTimeSlots[usedTimeSlots.length - 1];
        const lastUsedIndex = TIME_SLOTS.indexOf(lastUsedTime);

        // Find the next available slot
        for (let i = lastUsedIndex + 1; i < TIME_SLOTS.length; i++) {
          if (!usedTimeSlots.includes(TIME_SLOTS[i])) {
            nextTimeSlot = TIME_SLOTS[i];
            break;
          }
        }

        // If no slot found after the last one, try to find any available slot
        if (!nextTimeSlot) {
          for (let i = 0; i < TIME_SLOTS.length; i++) {
            if (!usedTimeSlots.includes(TIME_SLOTS[i])) {
              nextTimeSlot = TIME_SLOTS[i];
              break;
            }
          }
        }
      } else {
        // If no lessons have time set, use the first time slot
        nextTimeSlot = TIME_SLOTS[0];
      }
    } else {
      // If no lessons exist, use the first time slot
      nextTimeSlot = TIME_SLOTS[0];
    }

    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              lessons: [
                ...day.lessons,
                {
                  time: nextTimeSlot,
                  subject: "",
                  teacher: "",
                  room: "",
                  lessonType: "",
                },
              ],
            }
          : day
      ),
    }));
  };

  const updateLesson = (
    dayIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: string
  ) => {
    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              lessons: day.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              ),
            }
          : day
      ),
    }));
  };

  const removeLesson = (dayIndex: number, lessonIndex: number) => {
    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? { ...day, lessons: day.lessons.filter((_, j) => j !== lessonIndex) }
          : day
      ),
    }));
  };

  const addSubLesson = (dayIndex: number, lessonIndex: number) => {
    const currentLesson =
      scheduleData.week_schedule[dayIndex].lessons[lessonIndex];

    // Check if already has maximum sub-lessons (1)
    if (currentLesson.subLessons && currentLesson.subLessons.length >= 1) {
      return; // Don't add more sub-lessons
    }

    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              lessons: day.lessons.map((lesson, j) =>
                j === lessonIndex
                  ? {
                      ...lesson,
                      subLessons: [
                        ...(lesson.subLessons || []),
                        { subject: "", room: "", teacher: "", lessonType: "" },
                      ],
                    }
                  : lesson
              ),
            }
          : day
      ),
    }));
  };

  const updateSubLesson = (
    dayIndex: number,
    lessonIndex: number,
    subLessonIndex: number,
    field: keyof SubLesson,
    value: string
  ) => {
    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              lessons: day.lessons.map((lesson, j) =>
                j === lessonIndex
                  ? {
                      ...lesson,
                      subLessons: (lesson.subLessons || []).map(
                        (subLesson, k) =>
                          k === subLessonIndex
                            ? { ...subLesson, [field]: value }
                            : subLesson
                      ),
                    }
                  : lesson
              ),
            }
          : day
      ),
    }));
  };

  const removeSubLesson = (
    dayIndex: number,
    lessonIndex: number,
    subLessonIndex: number
  ) => {
    setScheduleData((prev) => ({
      ...prev,
      week_schedule: prev.week_schedule.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              lessons: day.lessons.map((lesson, j) =>
                j === lessonIndex
                  ? {
                      ...lesson,
                      subLessons: (lesson.subLessons || []).filter(
                        (_, k) => k !== subLessonIndex
                      ),
                    }
                  : lesson
              ),
            }
          : day
      ),
    }));
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Step 2'de günlər arasında naviqasiya
      if (currentDayIndex < DAYS.length - 1) {
        setCurrentDayIndex((prev) => prev + 1);
        setHasLessonsToday(null); // Reset for next day
      } else {
        setCurrentStep(3);
      }
    } else if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2 && currentDayIndex > 0) {
      // Step 2'de əvvəlki günə qayıt
      setCurrentDayIndex((prev) => prev - 1);
      setHasLessonsToday(null); // Reset for previous day
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Validation for step 1 - check if all subjects have names and hours
  const isStep1Valid = () => {
    if (scheduleData.academic_load.length === 0) return false;
    return scheduleData.academic_load.every(
      (subject) => subject.subject.trim() !== "" && subject.total_hours > 0
    );
  };

  // Check if any subject is empty (for step 2 validation)
  const hasEmptySubjects = () => {
    return scheduleData.academic_load.some(
      (subject) => subject.subject.trim() === ""
    );
  };

  // Validation for step 2 - check if current day is completed
  const isStep2Valid = () => {
    // User hasn't answered whether there are lessons today
    if (hasLessonsToday === null) return false;

    // If user said no lessons today, it's valid
    if (hasLessonsToday === false) return true;

    // If user said there are lessons, check if all lessons are filled
    const currentDay = scheduleData.week_schedule[currentDayIndex];
    return currentDay.lessons.every(
      (lesson) =>
        lesson.time &&
        lesson.time.trim() !== "" &&
        lesson.subject &&
        lesson.subject.trim() !== "" &&
        lesson.room &&
        lesson.room.trim() !== ""
    );
  };

  // Get current step validation
  const isCurrentStepValid = () => {
    if (currentStep === 1) return isStep1Valid();
    if (currentStep === 2) return isStep2Valid();
    return true; // Step 3 doesn't need validation
  };

  const handleFinish = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Convert to SDU format before saving
      const sduFormatData = convertToSDUFormat(scheduleData);

      // Save to MongoDB
      const result = await saveScheduleToMongoDB(sduFormatData);

      if (!result.success) {
        setSaveError(result.error || "Failed to save schedule");
        return;
      }

      // Also save to localStorage as backup
      saveSchedule(groupName, sduFormatData);

      // Clear wizard data
      clearWizardData();

      // Redirect back to home page
      router.push("/");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Clear wizard data and go back
    clearWizardData();
    router.push("/");
  };

  const openTimeModal = (lessonIndex: number) => {
    setSelectedTimeIndex(lessonIndex);
    setTimeModalOpen(true);
  };

  const closeTimeModal = () => {
    setTimeModalOpen(false);
    setSelectedTimeIndex(null);
    setShowCustomTimeInput(false);
    setCustomTimeInput("");
  };

  const selectTime = (time: string) => {
    if (selectedTimeIndex !== null) {
      updateLesson(currentDayIndex, selectedTimeIndex, "time", time);
    }
    closeTimeModal();
  };

  const handleCustomTimeSubmit = () => {
    if (customTimeInput.trim() && selectedTimeIndex !== null) {
      updateLesson(
        currentDayIndex,
        selectedTimeIndex,
        "time",
        customTimeInput.trim()
      );
      setCustomTimeInput("");
      setShowCustomTimeInput(false);
      closeTimeModal();
    }
  };

  const openCustomTimeInput = () => {
    setShowCustomTimeInput(true);
    setCustomTimeInput("");
  };

  const openSubjectModal = (lessonIndex: number) => {
    setSelectedSubjectIndex(lessonIndex);
    setSubjectModalOpen(true);
  };

  const closeSubjectModal = () => {
    setSubjectModalOpen(false);
    setSelectedSubjectIndex(null);
  };

  const selectSubject = (subject: string) => {
    if (selectedSubjectIndex !== null) {
      // Check if this is a sub-lesson
      if (selectedSubjectIndex >= 1000) {
        const lessonIndex = Math.floor(selectedSubjectIndex / 1000) - 1;
        const subLessonIndex = selectedSubjectIndex % 1000;

        // For sub-lessons, add the lesson type to the subject name if a type is selected
        const currentLesson =
          scheduleData.week_schedule[currentDayIndex].lessons[lessonIndex];
        const subLesson = currentLesson.subLessons?.[subLessonIndex];
        const lessonType = subLesson?.lessonType;

        let finalSubject = subject;
        if (lessonType) {
          const typeMap: { [key: string]: string } = {
            Lab: "(lab.)",
            Müh: "(mühazirə)",
            Məşğ: "(məş.)",
          };
          finalSubject = subject + (typeMap[lessonType] || "");
        }

        updateSubLesson(
          currentDayIndex,
          lessonIndex,
          subLessonIndex,
          "subject",
          finalSubject
        );
      } else {
        // For main lessons, add the lesson type to the subject name if a type is selected
        const currentLesson =
          scheduleData.week_schedule[currentDayIndex].lessons[
            selectedSubjectIndex
          ];
        const lessonType = currentLesson.lessonType;

        let finalSubject = subject;
        if (lessonType) {
          const typeMap: { [key: string]: string } = {
            Lab: "(lab.)",
            Müh: "(mühazirə)",
            Məşğ: "(məş.)",
          };
          finalSubject = subject + (typeMap[lessonType] || "");
        }

        updateLesson(
          currentDayIndex,
          selectedSubjectIndex,
          "subject",
          finalSubject
        );
      }
    }
    closeSubjectModal();
  };

  const openTypeDropdown = (lessonIndex: number) => {
    setTypeDropdownOpen(lessonIndex);
  };

  const closeTypeDropdown = () => {
    setTypeDropdownOpen(null);
  };

  const selectLessonType = (lessonIndex: number, type: string) => {
    // Check if this is a sub-lesson
    if (lessonIndex >= 1000) {
      const actualLessonIndex = Math.floor(lessonIndex / 1000) - 1;
      const subLessonIndex = lessonIndex % 1000;

      // Update sub-lesson type and modify subject name to include type
      const currentLesson =
        scheduleData.week_schedule[currentDayIndex].lessons[actualLessonIndex];
      const subLesson = currentLesson.subLessons?.[subLessonIndex];
      const baseSubject = subLesson?.subject || "";

      // Remove existing type from subject name if present
      const cleanSubject = baseSubject.replace(
        /\s*\((mühazirə|lab|məşğ|müh|məş)\)\s*$/,
        ""
      );

      // Add new type to subject name
      const typeMap: { [key: string]: string } = {
        Lab: "(lab.)",
        Müh: "(mühazirə)",
        Məşğ: "(məş.)",
      };

      const newSubject = cleanSubject + (typeMap[type] || "");

      updateSubLesson(
        currentDayIndex,
        actualLessonIndex,
        subLessonIndex,
        "lessonType",
        type
      );
      updateSubLesson(
        currentDayIndex,
        actualLessonIndex,
        subLessonIndex,
        "subject",
        newSubject
      );
    } else {
      // Update lesson type and modify subject name to include type
      const currentLesson =
        scheduleData.week_schedule[currentDayIndex].lessons[lessonIndex];
      const baseSubject = currentLesson.subject || "";

      // Remove existing type from subject name if present
      const cleanSubject = baseSubject.replace(
        /\s*\((mühazirə|lab|məşğ|müh|məş)\)\s*$/,
        ""
      );

      // Add new type to subject name
      const typeMap: { [key: string]: string } = {
        Lab: "(lab.)",
        Müh: "(mühazirə)",
        Məşğ: "(məş.)",
      };

      const newSubject = cleanSubject + (typeMap[type] || "");

      updateLesson(currentDayIndex, lessonIndex, "lessonType", type);
      updateLesson(currentDayIndex, lessonIndex, "subject", newSubject);
    }
    closeTypeDropdown();
  };

  const handleSubjectFocus = (lessonIndex: number) => {
    setFocusedSubjectIndex(lessonIndex);
  };

  const handleSubjectBlur = () => {
    setFocusedSubjectIndex(null);
  };

  const handleAcademicSubjectFocus = (index: number) => {
    setFocusedAcademicSubjectIndex(index);
  };

  const handleAcademicSubjectBlur = () => {
    setFocusedAcademicSubjectIndex(null);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Minimal Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl sm:text-lg font-semibold text-gray-800 mb-1">
          Akademik Yük
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Qrupunuzun fənləri və saatlarını əlavə edin
        </p>
      </div>

      {/* Empty State */}
      {scheduleData.academic_load.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center py-8 sm:py-12 px-4 sm:px-6"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
            Hələ fənn əlavə edilməyib
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
            Aşağıdakı düyməyə basaraq qrupunuzun fənlərini əlavə etməyə başlayın
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addSubject}
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            İlk Fənn Əlavə Et
          </motion.button>
        </motion.div>
      )}

      {/* Enhanced Subject Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {scheduleData.academic_load.map((subject, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="group relative"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                {/* Card Header with Subject Number */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-100 relative">
                  {/* Delete Button - Top Right */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeSubject(index)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200 opacity-100 z-10 flex items-center justify-center"
                    title="Fənn sil"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </motion.button>

                  <div className="flex items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        {index + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Fənn #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Subject Name Input */}
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Fənn Adı
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={subject.subject}
                          onChange={(e) =>
                            updateSubject(index, "subject", e.target.value)
                          }
                          onFocus={() => handleAcademicSubjectFocus(index)}
                          onBlur={handleAcademicSubjectBlur}
                          placeholder="Məsələn: Proqramlaşdırmanın əsasları"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          list={`subjects-${index}`}
                        />
                        <datalist id={`subjects-${index}`}>
                          {COMMON_SUBJECTS.map((subject) => (
                            <option key={subject} value={subject} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Hours Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Ümumi Saat
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="number"
                          value={subject.total_hours || ""}
                          onChange={(e) => {
                            let value = e.target.value;
                            // If the value is just "0", treat it as empty
                            if (value === "0") {
                              value = "";
                            }
                            // If user types a number and current value is "0", replace it
                            if (
                              subject.total_hours === 0 &&
                              /^\d/.test(value)
                            ) {
                              value = value;
                            }
                            updateSubject(
                              index,
                              "total_hours",
                              value === "" ? 0 : parseInt(value) || 0
                            );
                          }}
                          onKeyDown={(e) => {
                            // If current value is "0" and user types a number, select all text first
                            if (
                              subject.total_hours === 0 &&
                              /^\d/.test(e.key)
                            ) {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              input.value = e.key;
                              updateSubject(
                                index,
                                "total_hours",
                                parseInt(e.key) || 0
                              );
                            }
                          }}
                          placeholder="45"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {subject.subject && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <span>Fənn məlumatları tamamlandı</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-600 font-medium">
                            100%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Add Subject Button - Only show when there are subjects */}
      {scheduleData.academic_load.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addSubject}
          className="w-full group relative overflow-hidden rounded-2xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
        >
          <div className="relative z-10 py-4 px-6">
            <div className="flex items-center justify-center space-x-3">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{ duration: 0.5 }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </motion.div>
              <span className="text-sm sm:text-lg font-semibold">
                Yeni Fənn Əlavə Et
              </span>
            </div>
          </div>

          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </motion.button>
      )}
    </div>
  );

  const renderStep2 = () => {
    const currentDay = scheduleData.week_schedule[currentDayIndex];
    const hasLessons = currentDay.lessons.length > 0;

    return (
      <div className="space-y-6">
        {/* Main Title */}
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Həftəlik Cədvəl
          </h3>
        </div>

        {/* Day Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {DAYS.map((day, index) => (
            <motion.button
              key={day}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentDayIndex(index)}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                currentDayIndex === index
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {day}
            </motion.button>
          ))}
        </div>

        {/* Dynamic Subtitle */}
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            {DAY_NAMES[DAYS[currentDayIndex] as keyof typeof DAY_NAMES]} üçün
            dərslər
          </p>
        </div>

        {/* Has Lessons Question - Minimal Design */}
        {hasLessonsToday === null && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Bu gün dərs varmı?
              </h4>
              <p className="text-gray-500 text-sm">
                {DAY_NAMES[DAYS[currentDayIndex] as keyof typeof DAY_NAMES]}{" "}
                günü üçün dərslər planlaşdırılıb?
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasLessonsToday(true)}
                className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors duration-200"
              >
                Bəli
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasLessonsToday(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Xeyr
              </motion.button>
            </div>
          </div>
        )}

        {/* Content Area - Only show if user said there are lessons */}
        {hasLessonsToday === true && (
          <div className="space-y-4 relative">
            {currentDay.lessons.map((lesson, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                {/* Lesson Card with Header */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                  {/* Lesson Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-3 sm:px-4 py-2 border-b border-gray-100 relative rounded-t-xl">
                    {/* Action Buttons - Top Right */}
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
                      <motion.button
                        onClick={() => addSubLesson(currentDayIndex, index)}
                        disabled={
                          lesson.subLessons && lesson.subLessons.length >= 1
                        }
                        className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 text-center ${
                          lesson.subLessons && lesson.subLessons.length >= 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-blue-100"
                        }`}
                        title={
                          lesson.subLessons && lesson.subLessons.length >= 1
                            ? "Maksimum 1 alt dərs əlavə edilə bilər"
                            : "Alt dərs əlavə et"
                        }
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">
                          Alt dərs
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() => removeLesson(currentDayIndex, index)}
                        className="p-1.5 sm:p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                        title="Dərs sil"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </motion.button>
                    </div>

                    {/* Lesson Info - Left */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        {index + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Dərs #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="p-3 sm:p-4 relative">
                    <div className="space-y-3">
                      {/* Time and Room - Same Row with 70-30 */}
                      <div className="flex gap-3">
                        {/* Time Button - 70% */}
                        <div className="flex-[0.7]">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Vaxt
                          </label>
                          <button
                            onClick={() => openTimeModal(index)}
                            className={`w-full h-8 sm:h-10 flex items-center justify-center border rounded-lg transition-colors ${
                              lesson.time
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-300 hover:border-gray-400 text-gray-500"
                            }`}
                            title={lesson.time || "Vaxt seç"}
                          >
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            <span className="text-xs sm:text-sm">
                              {lesson.time || "Vaxt seç"}
                            </span>
                          </button>
                        </div>

                        {/* Room Input - 30% */}
                        <div className="flex-[0.3]">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Otaq
                          </label>
                          <input
                            type="text"
                            value={lesson.room}
                            onChange={(e) =>
                              updateLesson(
                                currentDayIndex,
                                index,
                                "room",
                                e.target.value
                              )
                            }
                            placeholder="Otaq nömrəsi"
                            className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors ${
                              lesson.room
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Subject and Type - Same Row with 70-30 */}
                      <div className="flex gap-3">
                        {/* Subject Button - 70% */}
                        <div className="flex-[0.7] min-w-0">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Fənn
                          </label>
                          <button
                            onClick={() => openSubjectModal(index)}
                            className={`w-full h-8 sm:h-10 flex items-center border rounded-lg transition-colors ${
                              lesson.subject
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-300 hover:border-gray-400 text-gray-500"
                            }`}
                            title={lesson.subject || "Fənn seç"}
                          >
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 ml-3 mr-3 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            <span className="text-xs sm:text-sm truncate min-w-0 flex-1 text-left pr-3">
                              {lesson.subject || "Fənn seç"}
                            </span>
                          </button>
                        </div>

                        {/* Lesson Type Dropdown - 30% */}
                        <div className="flex-[0.3] relative type-dropdown-container">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Növ
                          </label>
                          <button
                            onClick={() => openTypeDropdown(index)}
                            className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors flex items-center justify-between ${
                              lesson.lessonType
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-300 hover:border-gray-400 text-gray-500"
                            }`}
                            title={lesson.lessonType || "Növ seç"}
                          >
                            <span className="truncate">
                              {lesson.lessonType || "Növ seç"}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                typeDropdownOpen === index ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Custom Dropdown */}
                          {typeDropdownOpen === index && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => selectLessonType(index, "Lab")}
                                  className="w-full px-3 py-2 text-xs sm:text-sm text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  Lab
                                </button>
                                <button
                                  onClick={() => selectLessonType(index, "Müh")}
                                  className="w-full px-3 py-2 text-xs sm:text-sm text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  Müh
                                </button>
                                <button
                                  onClick={() =>
                                    selectLessonType(index, "Məşğ")
                                  }
                                  className="w-full px-3 py-2 text-xs sm:text-sm text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  Məşğ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-lessons - New Layout */}
                {lesson.subLessons && lesson.subLessons.length > 0 && (
                  <div className="px-2 sm:px-3 pb-2">
                    <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l-2 border-blue-200 bg-blue-50/30 rounded-r">
                      <div className="space-y-3 py-2">
                        {lesson.subLessons.map((subLesson, subIndex) => (
                          <motion.div
                            key={subIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-2"
                          >
                            {/* Subject and Type - Same Row with 50-50 */}
                            <div className="flex gap-2">
                              {/* Subject Button - 50% */}
                              <div className="flex-1 min-w-0">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Fənn
                                </label>
                                <button
                                  onClick={() =>
                                    openSubjectModal(
                                      1000 * (index + 1) + subIndex
                                    )
                                  }
                                  className={`w-full h-7 flex items-center border rounded-lg transition-colors ${
                                    subLesson.subject
                                      ? "border-blue-500 bg-blue-50 text-blue-600"
                                      : "border-gray-300 hover:border-gray-400 text-gray-500"
                                  }`}
                                  title={subLesson.subject || "Fənn seç"}
                                >
                                  <svg
                                    className="w-3 h-3 ml-2 mr-2 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                  </svg>
                                  <span className="text-xs truncate min-w-0 flex-1 text-left pr-2">
                                    {subLesson.subject || "Fənn seç"}
                                  </span>
                                </button>
                              </div>

                              {/* Type Dropdown - 50% */}
                              <div className="flex-1 relative type-dropdown-container">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Növ
                                </label>
                                <button
                                  onClick={() =>
                                    openTypeDropdown(
                                      1000 * (index + 1) + subIndex
                                    )
                                  }
                                  className={`w-full h-7 px-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors flex items-center justify-between ${
                                    subLesson.lessonType
                                      ? "border-blue-500 bg-blue-50 text-blue-600"
                                      : "border-gray-300 hover:border-gray-400 text-gray-500"
                                  }`}
                                  title={subLesson.lessonType || "Növ seç"}
                                >
                                  <span className="truncate text-xs">
                                    {subLesson.lessonType || "Növ seç"}
                                  </span>
                                  <svg
                                    className={`w-3 h-3 transition-transform ${
                                      typeDropdownOpen ===
                                      1000 * (index + 1) + subIndex
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>

                                {/* Custom Dropdown */}
                                {typeDropdownOpen ===
                                  1000 * (index + 1) + subIndex && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                    <div className="py-1">
                                      <button
                                        onClick={() =>
                                          selectLessonType(
                                            1000 * (index + 1) + subIndex,
                                            "Lab"
                                          )
                                        }
                                        className="w-full px-2 py-1 text-xs text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        Lab
                                      </button>
                                      <button
                                        onClick={() =>
                                          selectLessonType(
                                            1000 * (index + 1) + subIndex,
                                            "Müh"
                                          )
                                        }
                                        className="w-full px-2 py-1 text-xs text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        Müh
                                      </button>
                                      <button
                                        onClick={() =>
                                          selectLessonType(
                                            1000 * (index + 1) + subIndex,
                                            "Məşğ"
                                          )
                                        }
                                        className="w-full px-2 py-1 text-xs text-left hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        Məşğ
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Room Input - Full Width */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Otaq
                              </label>
                              <input
                                type="text"
                                value={subLesson.room}
                                onChange={(e) =>
                                  updateSubLesson(
                                    currentDayIndex,
                                    index,
                                    subIndex,
                                    "room",
                                    e.target.value
                                  )
                                }
                                placeholder="Otaq nömrəsi"
                                className={`w-full px-2 py-1 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors ${
                                  subLesson.room
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-300 focus:border-blue-500"
                                }`}
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="flex justify-end">
                              <button
                                onClick={() =>
                                  removeSubLesson(
                                    currentDayIndex,
                                    index,
                                    subIndex
                                  )
                                }
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Sil"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add Lesson Button - Enhanced */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => addLesson(currentDayIndex)}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 border-2 border-dashed border-gray-300 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 hover:shadow-md overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Dərs əlavə et
              </div>
            </motion.button>
          </div>
        )}

        {/* No Lessons Message - Elegant Design */}
        {hasLessonsToday === false && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-10 max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-2">
              Bu gün dərs yoxdur
            </h4>
            <p className="text-gray-500 text-base leading-relaxed">
              {DAY_NAMES[DAYS[currentDayIndex] as keyof typeof DAY_NAMES]} günü
              üçün dərslər planlaşdırılmayıb.
            </p>
          </div>
        )}
      </div>
    );
  };

  const [showJson, setShowJson] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Convert new format to SDU format
  const convertToSDUFormat = (data: ScheduleData) => {
    const convertedSchedule = data.week_schedule.map((day) => ({
      day: day.day,
      lessons: day.lessons
        .filter((lesson) => lesson.time && lesson.subject) // Filter out empty lessons
        .map((lesson) => {
          // If lesson has subLessons, convert to upper/lower format
          if (lesson.subLessons && lesson.subLessons.length > 0) {
            const subLesson = lesson.subLessons[0];
            return {
              time: lesson.time,
              lesson: {
                upper: {
                  subject: lesson.subject || "Təyin edilməyib",
                  teacher: lesson.teacher || "Təyin edilməyib",
                  room: lesson.room || "Təyin edilməyib",
                },
                lower: {
                  subject: subLesson.subject || "Təyin edilməyib",
                  teacher: subLesson.teacher || "Təyin edilməyib",
                  room: subLesson.room || "Təyin edilməyib",
                },
              },
            };
          } else {
            // Regular lesson without subLessons
            return {
              time: lesson.time,
              subject: lesson.subject || "Təyin edilməyib",
              teacher: lesson.teacher || "Təyin edilməyib",
              room: lesson.room || "Təyin edilməyib",
            };
          }
        }),
    }));

    return {
      group_id: data.group_id,
      faculty: data.faculty,
      academic_load: data.academic_load,
      week_schedule: convertedSchedule,
    };
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
          Yoxlama və Təsdiq
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm">
          Məlumatları yoxlayın və cədvəli yaradın
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <h4 className="font-medium text-gray-800 mb-1 text-xs sm:text-sm">
            Qrup Məlumatları
          </h4>
          <p className="text-xs sm:text-sm text-gray-600">
            <strong>Qrup:</strong> {scheduleData.group_id} |{" "}
            <strong>Fakultə:</strong> {scheduleData.faculty}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-1 text-xs sm:text-sm">
            Akademik Yük ({scheduleData.academic_load.length} fənn)
          </h4>
          <div className="space-y-1">
            {scheduleData.academic_load.map((subject, index) => (
              <p key={index} className="text-xs text-gray-600">
                • {subject.subject} - {subject.total_hours} saat
              </p>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-1 text-xs sm:text-sm">
            Həftəlik Cədvəl
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {scheduleData.week_schedule.map((day, index) => (
              <p key={index} className="text-xs text-gray-600">
                <strong>{day.day} günü:</strong> {day.lessons.length} dərs
              </p>
            ))}
          </div>
        </div>

        {/* JSON Format Section */}
        <div className="border-t pt-3">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center justify-between w-full text-left hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <h4 className="font-medium text-gray-800 text-xs sm:text-sm">
              JSON Formatında Məlumatlar (SDU Formatı)
            </h4>
            <svg
              className={`w-4 h-4 transition-transform ${
                showJson ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showJson && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(convertToSDUFormat(scheduleData), null, 2)}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Bu JSON formatı SDU formatında cədvəl məlumatlarınızı göstərir
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  if (!groupName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-4">⚠️</div>
          <div className="text-gray-600 mb-4 text-sm sm:text-base">
            Qrup adı tapılmadı
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
          >
            Ana səhifəyə qayıt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                Qrup {groupName} üçün Cədvəl Yaratmaq
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Addım {currentStep} / 3
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-28">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </motion.div>
      </div>

      {/* Enhanced Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3 px-4 sm:px-6 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
              currentStep === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Geri</span>
          </button>

          <button
            onClick={currentStep < 3 ? handleNext : handleFinish}
            disabled={!isCurrentStepValid() || isSaving}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md ${
              isCurrentStepValid() && !isSaving
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saxlanılır...</span>
              </div>
            ) : currentStep < 3 ? (
              "Növbəti"
            ) : (
              "Bitir"
            )}
          </button>
        </div>

        {/* Error Display */}
        {saveError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Xəta</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{saveError}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setSaveError(null)}
                    className="bg-red-100 px-2 py-1 rounded text-sm text-red-800 hover:bg-red-200"
                  >
                    Bağla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Selection Modal */}
      {timeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-4 sm:p-6 w-80 max-w-[90vw] shadow-xl"
          >
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Vaxt Seç
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => selectTime(time)}
                  className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  {time}
                </button>
              ))}

              {/* Custom Time Input Option */}
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={openCustomTimeInput}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-left text-gray-600"
                >
                  + Özəl vaxt daxil et
                </button>
              </div>
            </div>

            {/* Custom Time Input */}
            {showCustomTimeInput && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Vaxt daxil edin (məs: 08:30-09:50)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTimeInput}
                    onChange={(e) => {
                      let value = e.target.value;
                      // If the value is just "0", treat it as empty
                      if (value === "0") {
                        value = "";
                      }
                      setCustomTimeInput(value);
                    }}
                    onKeyDown={(e) => {
                      // If current value is "0" and user types a number, replace it
                      if (customTimeInput === "0" && /^\d/.test(e.key)) {
                        e.preventDefault();
                        setCustomTimeInput(e.key);
                      }
                      if (e.key === "Enter") {
                        handleCustomTimeSubmit();
                      }
                    }}
                    placeholder="08:30-09:50"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleCustomTimeSubmit}
                    disabled={!customTimeInput.trim()}
                    className="px-3 py-2 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Təsdiq
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomTimeInput(false);
                      setCustomTimeInput("");
                    }}
                    className="px-3 py-2 text-xs sm:text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Ləğv
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={closeTimeModal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Bağla
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Subject Selection Modal */}
      {subjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-4 sm:p-6 w-96 max-w-[90vw] shadow-xl"
          >
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Fənn Seç
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Əvvəlcə əlavə etdiyiniz fənnlərdən seçin
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {scheduleData.academic_load.length > 0 ? (
                scheduleData.academic_load
                  .filter((subject) => subject.subject.trim() !== "")
                  .map((subject, subjectIndex) => (
                    <button
                      key={subjectIndex}
                      onClick={() => selectSubject(subject.subject)}
                      className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{subject.subject}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {subject.total_hours}h
                        </span>
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <p className="text-sm">
                    {scheduleData.academic_load.length === 0
                      ? "Hələ fənn əlavə edilməyib"
                      : "Fənn adları doldurulmayıb"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Əvvəlcə 1-ci addımda fənn adlarını doldurun
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={closeSubjectModal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Bağla
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function ScheduleWizardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScheduleWizardContent />
    </Suspense>
  );
}
