import { NextResponse } from "next/server";

export async function GET() {
  // Logic from original file: In production, would filter by deliveryPartnerId and delivered status
  return NextResponse.json([]);
}