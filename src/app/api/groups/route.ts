import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Group from "@/models/Group";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    let query = {};

    if (groupId) {
      query = { group_id: groupId };
    }

    const groups = await Group.find(query);

    return NextResponse.json({ success: true, data: groups });
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
    const group = new Group(body);
    const savedGroup = await group.save();

    return NextResponse.json(
      { success: true, data: savedGroup },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create group" },
      { status: 500 }
    );
  }
}
