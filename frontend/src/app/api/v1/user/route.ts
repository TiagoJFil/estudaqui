//get necessary user data

import { NextResponse } from "next/server";
import { getUserIdentifierServerside } from "@/lib/utils";
import { UserService } from "@/lib/backend/data/data-service";

export async function GET() {
  try {
    const userID = await getUserIdentifierServerside();
    const userInfo = await UserService.getUser(userID);

    if (!userInfo) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(userInfo, { status: 200 });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information." },
      { status: 500 }
    );
  }
}