// Build a Next.js API route to handle file uploads receives a PDF file, and calls ExamService.upload to process it. The route should return the structured exam JSON as a response.
import { NextResponse } from "next/server";
import { upload } from "@/services/examService";
import { subtractCreditsFromUser } from "@/lib/data/data-service";
import { getServerSession } from "next-auth";
import { getUserIdentifierServerside } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const userID = await getUserIdentifierServerside();

    const formData = await request.formData();
    const pdfFile = formData.get("files") as File;

    if (!pdfFile || pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF." },
        { status: 400 }
      );
    }

    const examJson = await upload(pdfFile,userID);

    await subtractCreditsFromUser(userID, 1);

    return NextResponse.json(examJson, { status: 200 });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process the uploaded file." },
      { status: 500 }
    );
  }
}
