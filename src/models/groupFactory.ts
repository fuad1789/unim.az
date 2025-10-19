import mongoose from "mongoose";

// Factory to get (or create) a per-university Group model bound to a specific collection
export function getGroupModel(universityId: number) {
  const collectionName = `university_${universityId}_groups`;

  // Clear existing model to avoid schema/model name conflicts when switching universities
  if (mongoose.models[`Group_${universityId}`]) {
    delete mongoose.models[`Group_${universityId}`];
  }

  const GroupSchema = new mongoose.Schema(
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
        specialRules: { type: mongoose.Schema.Types.Mixed },
      },
    },
    {
      strict: false,
    }
  );

  return mongoose.model(`Group_${universityId}`, GroupSchema, collectionName);
}
