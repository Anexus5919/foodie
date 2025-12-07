import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await storage.getUser(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await storage.updateUser(id, body);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}