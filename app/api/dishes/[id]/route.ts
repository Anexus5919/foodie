import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dish = await storage.getDish(id);
  if (!dish) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }
  return NextResponse.json(dish);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await storage.updateDish(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}