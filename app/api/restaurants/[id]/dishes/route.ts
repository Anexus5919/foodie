import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Change type to Promise
) {
  const { id } = await params; // 2. Await the params

  const dishes = await storage.getDishes(id);
  
  if (!dishes) {
    return NextResponse.json({ error: "Dishes not found" }, { status: 404 });
  }
  
  return NextResponse.json(dishes);
}