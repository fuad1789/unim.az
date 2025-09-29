export interface Lesson {
  time?: string;
  subject?: string;
  teacher?: string;
  room?: string;
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

export interface Group {
  group: string;
  week: Day[];
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
