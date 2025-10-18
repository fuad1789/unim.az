#!/usr/bin/env node

/**
 * Migration script to transfer all groups from JSON to MongoDB
 * This script will read all groups from sdu.json and upload them to MongoDB
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection string - update this to your test cluster
// For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

// Check if MongoDB URI is provided
if (MONGODB_URI === "mongodb://localhost:27017/test") {
  console.log(
    "⚠️  Using default localhost MongoDB. If you want to use MongoDB Atlas:"
  );
  console.log("   1. Set MONGODB_URI environment variable");
  console.log("   2. Or update the script with your Atlas connection string");
  console.log(
    "   3. Example: $env:MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/test'"
  );
  console.log("");
}

// Read JSON data
const jsonPath = path.join(__dirname, "../src/data/sdu.json");
const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

console.log(`Found ${jsonData.length} groups in JSON file`);

// Function to upload groups to MongoDB
async function uploadGroupsToMongoDB() {
  try {
    // Import mongoose dynamically
    const mongoose = await import("mongoose");

    // Connect to MongoDB
    await mongoose.default.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Define the Group schema (simplified version)
    const GroupSchema = new mongoose.default.Schema(
      {
        group_id: { type: String, required: true, unique: true },
        universityId: { type: Number, required: true },
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
      },
      {
        strict: false,
      }
    );

    // Clear existing model to avoid conflicts
    if (mongoose.default.models.Group) {
      delete mongoose.default.models.Group;
    }

    const Group = mongoose.default.model("Group", GroupSchema);

    // Clear existing groups (optional - comment out if you want to keep existing data)
    console.log("Clearing existing groups...");
    await Group.deleteMany({});
    console.log("Existing groups cleared");

    // Upload groups in batches
    const batchSize = 10;
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);

      // Add universityId to each group (SDU = 11)
      const batchWithUniversityId = batch.map((group) => ({
        ...group,
        universityId: 11, // Sumqayıt Dövlət Universiteti
      }));

      try {
        await Group.insertMany(batchWithUniversityId, { ordered: false });
        uploaded += batch.length;
        console.log(
          `Uploaded batch ${Math.floor(i / batchSize) + 1}: ${
            batch.length
          } groups (Total: ${uploaded})`
        );
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - some groups might already exist
          console.log(
            `Batch ${
              Math.floor(i / batchSize) + 1
            }: Some groups already exist, skipping duplicates`
          );
          uploaded += batch.length;
        } else {
          console.error(
            `Error uploading batch ${Math.floor(i / batchSize) + 1}:`,
            error.message
          );
          errors += batch.length;
        }
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`✅ Successfully uploaded: ${uploaded} groups`);
    console.log(`❌ Errors: ${errors} groups`);
    console.log(`📊 Total processed: ${uploaded + errors} groups`);

    // Verify the upload
    const totalInDB = await Group.countDocuments();
    console.log(`📈 Total groups in MongoDB: ${totalInDB}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close connection
    try {
      await mongoose.default.connection.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      console.log("Connection already closed");
    }
  }
}

// Run the migration
uploadGroupsToMongoDB();
