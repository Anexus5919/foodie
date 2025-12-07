import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function POST(request: Request) {
  try {
    const { firebaseUid, email } = (await request.json()) as {
      firebaseUid: string;
      email: string;
    };

    // Check if user exists
    let user = await storage.getUserByFirebaseUid(firebaseUid);

    if (!user) {
      // Check by email
      user = await storage.getUserByEmail(email);

      if (user) {
        // Link Firebase UID to existing user
        user = await storage.updateUser(user.id, { firebaseUid });
      } else {
        // Create new user
        user = await storage.createUser({
          email,
          name: email.split("@")[0], // Use email prefix as name
        } as unknown as Parameters<typeof storage.createUser>[0]);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}