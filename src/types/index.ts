export interface SubLesson {
  subject: string;
  room: string;
  teacher: string;
  lessonType: string;
}

export interface Lesson {
  time?: string;
  subject?: string;
  teacher?: string;
  room?: string;
  lessonType?: string;
  subLessons?: SubLesson[];
  lesson?: {
    upper: {
      subject: string;
      teacher: string;
      room: string;
    };
    lower: {
      subject: string;
      teacher: string;
      room: string;
    };
  };
}

export interface Day {
  day: string;
  lessons: Lesson[];
}

export interface AcademicLoadItem {
  subject: string;
  total_hours: number;
}

export interface Group {
  group: string;
  group_id?: string;
  // Prefer week_schedule, but some sources still use week
  week_schedule?: Day[];
  week?: Day[];
  academic_load?: AcademicLoadItem[];
}

export interface University {
  id: number;
  name: string;
  shortName?: string;
  startWeekType: "ust" | "alt";
  startDate: string;
  img?: string;
}

export interface UserPreferences {
  universityId: number;
  groupName: string;
}

export type WeekType = "ust" | "alt";
export type DayName = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII";
