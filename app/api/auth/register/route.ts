import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function POST(request: Request) {
  try {
    const { email, name, role } = (await request.json()) as {
      email: string;
      name: string;
      role?: string;
    };

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const user = await storage.createUser({
      email,
      name,
      role: role || "customer",
    } as unknown as Parameters<typeof storage.createUser>[0]);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
