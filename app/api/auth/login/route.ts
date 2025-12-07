import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}