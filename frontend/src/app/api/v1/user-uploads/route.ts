import { NextResponse } from "next/server";
import { getUserIdentifierServerside } from "@/lib/utils";
import { getUserUploads } from "@/lib/data/data-service";

export async function GET() {
  try {
    const userID = await getUserIdentifierServerside();
    const uploads = await getUserUploads(userID);
    return NextResponse.json(uploads, { status: 200 });
  } catch (error) {
    console.error("Error fetching user uploads:", error);
    return NextResponse.json({ error: "Failed to fetch uploads." }, { status: 500 });
  }
}
