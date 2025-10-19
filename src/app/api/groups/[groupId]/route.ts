import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getGroupModel } from "@/models/groupFactory";
import { z } from "zod";

const ParamsSchema = z.object({ groupId: z.string().min(1) });
const QuerySchema = z.object({ universityId: z.coerce.number().optional() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await connectDB();

    const { groupId } = ParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { universityId } = QuerySchema.parse({
      universityId: searchParams.get("universityId") ?? undefined,
    });
    const uniId = universityId ?? 11; // default SDU as current behavior
    const Group = getGroupModel(uniId);
    const group = await Group.findOne({ group_id: groupId });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await connectDB();

    const { groupId } = ParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { universityId } = QuerySchema.parse({
      universityId: searchParams.get("universityId") ?? undefined,
    });
    const uniId = universityId ?? 11;
    const Group = getGroupModel(uniId);
    const body = await request.json();
    const group = await Group.findOneAndUpdate({ group_id: groupId }, body, {
      new: true,
      runValidators: true,
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await connectDB();

    const { groupId } = ParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { universityId } = QuerySchema.parse({
      universityId: searchParams.get("universityId") ?? undefined,
    });
    const uniId = universityId ?? 11;
    const Group = getGroupModel(uniId);
    const group = await Group.findOneAndDelete({ group_id: groupId });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
