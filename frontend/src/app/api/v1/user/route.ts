
//get necessary user data

import { NextResponse } from "next/server";
import { getUserIdentifier } from "@/lib/utils";
import { getUser } from "@/lib/data/data-service";

export async function GET() {
  try {
    const userID = await getUserIdentifier();
    const userInfo = await getUser(userID);

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