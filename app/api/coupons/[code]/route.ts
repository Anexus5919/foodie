import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const coupon = await storage.getCoupon(code);
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }
  return NextResponse.json(coupon);
}