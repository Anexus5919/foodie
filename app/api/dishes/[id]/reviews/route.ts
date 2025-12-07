import { NextResponse } from "next/server";
import { storage } from "../../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await storage.getDishReviews(id);
  return NextResponse.json(reviews);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const review = await storage.createDishReview({
      ...body,
      dishId: id,
    });
    return NextResponse.json(review);
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}