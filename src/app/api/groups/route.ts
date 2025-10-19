import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { z } from "zod";
import { getUniversityRules } from "@/utils/universityRules";
import { getGroupModel } from "@/models/groupFactory";

const PostBodySchema = z.object({
  group_id: z.string().min(1),
  universityId: z.number(),
  faculty: z.string().optional(),
  academic_load: z
    .array(z.object({ subject: z.string(), total_hours: z.number() }))
    .optional(),
  week_schedule: z
    .array(
      z.object({
        day: z.string(),
        lessons: z.array(
          z.object({
            time: z.string(),
            subject: z.string().optional(),
            teacher: z.string().optional(),
            room: z.string().optional(),
            lesson: z
              .object({
                upper: z.object({
                  subject: z.string(),
                  teacher: z.string(),
                  room: z.string(),
                }),
                lower: z.object({
                  subject: z.string(),
                  teacher: z.string(),
                  room: z.string(),
                }),
              })
              .optional(),
          })
        ),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const universityId = searchParams.get("universityId");

    let query = {} as Record<string, unknown>;
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
      const allGroups: unknown[] = [];

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

    const json = await request.json();
    const parseResult = PostBodySchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }
    const body = parseResult.data;

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
