import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function GET() {
  const orders = await storage.getAvailableOrdersForDelivery();
  return NextResponse.json(orders);
}