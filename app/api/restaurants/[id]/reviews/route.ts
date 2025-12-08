import { NextResponse } from "next/server";
import { storage } from "../../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await storage.getReviewsByRestaurant(id);
  return NextResponse.json(reviews);
}