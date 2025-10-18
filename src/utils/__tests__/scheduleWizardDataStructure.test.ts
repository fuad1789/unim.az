/**
 * Test to verify that schedule wizard data structure matches sdu.json format
 */

import { ScheduleData } from "../scheduleManager";

describe("Schedule Wizard Data Structure", () => {
  it("should match sdu.json structure format", () => {
    const sampleData: ScheduleData = {
      group_id: "681",
      faculty: "Mühəndislik",
      academic_load: [
        {
          subject: "Xətti cəbr və analitik həndəsə",
          total_hours: 60,
        },
        {
          subject: "Proqramlaşdırmanın əsasları",
          total_hours: 75,
        },
      ],
      week_schedule: [
        {
          day: "I",
          lessons: [],
        },
        {
          day: "II",
          lessons: [
            {
              time: "08:30-09:50",
              subject: "Xətti cəbr və analitik həndəsə (mühazirə)",
              teacher: "Hətəmova R.",
              room: "303",
            },
            {
              time: "10:05-11:25",
              subject: "Proqramlaşdırmanın əsasları (lab.)",
              teacher: "Rəhimov Ş.",
              room: "205",
            },
          ],
        },
        {
          day: "III",
          lessons: [
            {
              time: "08:30-09:50",
              lesson: {
                upper: {
                  subject: "Xətti cəbr və analitik həndəsə (məş.)",
                  teacher: "Hətəmova R.",
                  room: "201",
                },
                lower: {
                  subject: "Proqramlaşdırmanın əsasları (məş.)",
                  teacher: "Rəhimov Ş.",
                  room: "202",
                },
              },
            },
          ],
        },
        {
          day: "IV",
          lessons: [],
        },
        {
          day: "V",
          lessons: [],
        },
      ],
    };

    // Verify structure matches sdu.json format
    expect(sampleData).toHaveProperty("group_id");
    expect(sampleData).toHaveProperty("faculty");
    expect(sampleData).toHaveProperty("academic_load");
    expect(sampleData).toHaveProperty("week_schedule");

    // Verify academic_load structure
    expect(Array.isArray(sampleData.academic_load)).toBe(true);
    sampleData.academic_load.forEach((item) => {
      expect(item).toHaveProperty("subject");
      expect(item).toHaveProperty("total_hours");
      expect(typeof item.subject).toBe("string");
      expect(typeof item.total_hours).toBe("number");
    });

    // Verify week_schedule structure
    expect(Array.isArray(sampleData.week_schedule)).toBe(true);
    sampleData.week_schedule.forEach((day) => {
      expect(day).toHaveProperty("day");
      expect(day).toHaveProperty("lessons");
      expect(Array.isArray(day.lessons)).toBe(true);

      day.lessons.forEach((lesson) => {
        expect(lesson).toHaveProperty("time");
        expect(typeof lesson.time).toBe("string");

        // Either subject or lesson should be present
        const hasSubject = lesson.subject !== undefined;
        const hasLesson = lesson.lesson !== undefined;
        expect(hasSubject || hasLesson).toBe(true);

        if (hasSubject) {
          expect(lesson).toHaveProperty("teacher");
          expect(lesson).toHaveProperty("room");
        }

        if (hasLesson) {
          expect(lesson.lesson).toHaveProperty("upper");
          expect(lesson.lesson).toHaveProperty("lower");
          expect(lesson.lesson.upper).toHaveProperty("subject");
          expect(lesson.lesson.upper).toHaveProperty("teacher");
          expect(lesson.lesson.upper).toHaveProperty("room");
          expect(lesson.lesson.lower).toHaveProperty("subject");
          expect(lesson.lesson.lower).toHaveProperty("teacher");
          expect(lesson.lesson.lower).toHaveProperty("room");
        }
      });
    });

    // Verify day names are in correct format (I, II, III, IV, V)
    const expectedDays = ["I", "II", "III", "IV", "V"];
    sampleData.week_schedule.forEach((day, index) => {
      expect(day.day).toBe(expectedDays[index]);
    });
  });

  it("should handle lesson types correctly in subject names", () => {
    const typeMap: { [key: string]: string } = {
      Lab: "(lab.)",
      Müh: "(mühazirə)",
      Məşğ: "(məş.)",
    };

    // Test type mapping
    expect(typeMap["Lab"]).toBe("(lab.)");
    expect(typeMap["Müh"]).toBe("(mühazirə)");
    expect(typeMap["Məşğ"]).toBe("(məş.)");

    // Test subject name with type
    const baseSubject = "Proqramlaşdırmanın əsasları";
    const subjectWithType = baseSubject + typeMap["Lab"];
    expect(subjectWithType).toBe("Proqramlaşdırmanın əsasları (lab.)");
  });
});
