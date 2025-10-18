import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  group_id: string;
  universityId: number;
  faculty?: string;
  academic_load: {
    subject: string;
    total_hours: number;
  }[];
  week_schedule: {
    day: string;
    lessons: {
      time: string;
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
    }[];
  }[];
  universityRules?: {
    lessonTimes: string[];
    maxLessonsPerDay: number;
    lessonDuration: number;
    breakDuration: number;
    lunchBreak?: {
      start: string;
      end: string;
      duration: number;
    };
    specialRules?: {
      [key: string]: unknown;
    };
  };
}

const GroupSchema = new Schema<IGroup>(
  {
    group_id: { type: String, required: true, unique: true },
    universityId: { type: Number, required: true },
    faculty: { type: String, required: false },
    academic_load: [
      {
        subject: { type: String, required: true },
        total_hours: { type: Number, required: true },
      },
    ],
    week_schedule: [
      {
        day: { type: String, required: true },
        lessons: [
          {
            time: { type: String, required: true },
            subject: { type: String, default: "" },
            teacher: { type: String, default: "" },
            room: { type: String, default: "" },
            lesson: {
              type: {
                upper: {
                  subject: { type: String, default: "" },
                  teacher: { type: String, default: "" },
                  room: { type: String, default: "" },
                },
                lower: {
                  subject: { type: String, default: "" },
                  teacher: { type: String, default: "" },
                  room: { type: String, default: "" },
                },
              },
              required: false,
            },
          },
        ],
      },
    ],
    universityRules: {
      lessonTimes: [{ type: String }],
      maxLessonsPerDay: { type: Number, default: 6 },
      lessonDuration: { type: Number, default: 80 },
      breakDuration: { type: Number, default: 10 },
      lunchBreak: {
        start: { type: String },
        end: { type: String },
        duration: { type: Number },
      },
      specialRules: { type: Schema.Types.Mixed },
    },
  },
  {
    strict: false, // Allow additional fields
  }
);

// Clear any existing model to force schema update
if (mongoose.models.Group) {
  delete mongoose.models.Group;
}

export default mongoose.model<IGroup>(
  "Group",
  GroupSchema,
  "university_11_groups"
);
