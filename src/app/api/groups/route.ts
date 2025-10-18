import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { getUniversityRules } from "@/utils/universityRules";

// Dynamic Group model creation
function getGroupModel(universityId: number) {
  const collectionName = `university_${universityId}_groups`;

  // Clear existing model to avoid conflicts
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const universityId = searchParams.get("universityId");

    let query = {};
    let Group;

    if (groupId) {
      // Search across all university collections for a specific group
      query = { group_id: groupId };

      // Try SDU first (most common)
      Group = getGroupModel(11);
      let groups = await Group.find(query);

      if (groups.length === 0 && universityId) {
        // If not found in SDU and universityId is specified, try that university
        Group = getGroupModel(parseInt(universityId));
        groups = await Group.find(query);
      }

      return NextResponse.json({ success: true, data: groups });
    } else if (universityId) {
      query = { universityId: parseInt(universityId) };
      Group = getGroupModel(parseInt(universityId));
      const groups = await Group.find(query);
      return NextResponse.json({ success: true, data: groups });
    } else {
      // Return all groups from all universities
      const allGroups = [];

      // Get SDU groups
      const sduGroup = getGroupModel(11);
      const sduGroups = await sduGroup.find({});
      allGroups.push(...sduGroups);

      // TODO: Add other universities as they are created

      return NextResponse.json({ success: true, data: allGroups });
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Ensure universityId is present
    if (!body.universityId) {
      return NextResponse.json(
        { success: false, error: "universityId is required" },
        { status: 400 }
      );
    }

    // Get university-specific rules
    const universityRules = getUniversityRules(body.universityId);

    // Add university rules to the group data
    const groupData = {
      ...body,
      universityRules: universityRules
        ? {
            lessonTimes: universityRules.lessonTimes,
            maxLessonsPerDay: universityRules.rules.maxLessonsPerDay,
            lessonDuration: universityRules.rules.lessonDuration,
            breakDuration: universityRules.rules.breakDuration,
            lunchBreak: universityRules.rules.lunchBreak,
            specialRules: universityRules.rules.specialRules,
          }
        : undefined,
    };

    // Get the correct model for this university
    const Group = getGroupModel(body.universityId);

    // Check if group already exists
    const existingGroup = await Group.findOne({ group_id: body.group_id });
    if (existingGroup) {
      return NextResponse.json(
        { success: false, error: "Group already exists" },
        { status: 409 }
      );
    }

    const group = new Group(groupData);
    const savedGroup = await group.save();

    return NextResponse.json(
      { success: true, data: savedGroup },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create group" },
      { status: 500 }
    );
  }
}
