import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await storage.deleteAddress(id);
  return NextResponse.json({ success: true });
}