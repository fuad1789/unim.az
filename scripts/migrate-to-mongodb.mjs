import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/unim-az";

// Group Schema - Simplified without separate models
const GroupSchema = new mongoose.Schema({
  group_id: { type: String, required: true, unique: true },
  faculty: { type: String, required: true },
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
          subject: { type: String, required: true },
          teacher: { type: String, required: true },
          room: { type: String, required: true },
          upper: {
            subject: { type: String },
            teacher: { type: String },
            room: { type: String },
          },
          lower: {
            subject: { type: String },
            teacher: { type: String },
            room: { type: String },
          },
        },
      ],
    },
  ],
});

const Group = mongoose.model("Group", GroupSchema);

async function migrateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Read the JSON file
    const jsonPath = path.join(__dirname, "..", "src", "data", "sdu.json");
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    console.log(`Found ${jsonData.length} groups to migrate`);

    // Clear existing data
    await Group.deleteMany({});
    console.log("Cleared existing data");

    // Clean and validate data before inserting
    const cleanedData = jsonData.map((group) => {
      // Clean week_schedule lessons
      const cleanedWeekSchedule = group.week_schedule.map((day) => ({
        ...day,
        lessons: day.lessons.filter(
          (lesson) =>
            lesson.subject && lesson.teacher && lesson.room && lesson.time
        ),
      }));

      return {
        ...group,
        week_schedule: cleanedWeekSchedule,
      };
    });

    // Remove duplicates based on group_id
    const uniqueData = cleanedData.reduce((acc, current) => {
      const existing = acc.find((item) => item.group_id === current.group_id);
      if (!existing) {
        acc.push(current);
      } else {
        console.log(
          `Duplicate group_id found: ${current.group_id}, skipping...`
        );
      }
      return acc;
    }, []);

    console.log(
      `After removing duplicates: ${uniqueData.length} unique groups`
    );

    // Insert new data one by one to handle any remaining issues
    let successCount = 0;
    for (const group of uniqueData) {
      try {
        await Group.create(group);
        successCount++;
      } catch (error) {
        console.error(
          `Failed to insert group ${group.group_id}:`,
          error.message
        );
      }
    }

    console.log(`Successfully migrated ${successCount} groups to MongoDB`);

    // Verify the migration
    const count = await Group.countDocuments();
    console.log(`Total groups in database: ${count}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration
migrateData();
