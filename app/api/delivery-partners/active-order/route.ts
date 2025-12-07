import { NextResponse } from "next/server";

export async function GET() {
  // Logic from original file: In production, would query by deliveryPartnerId
  return NextResponse.json(null);
}