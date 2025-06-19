// Build a Next.js API route to handle file uploads receives a PDF file, and calls ExamService.upload to process it. The route should return the structured exam JSON as a response.
import { NextResponse } from "next/server";
import { processExamUpload } from "@/lib/backend/llm/exam-service";
import { UserService, UploadService, FileService } from "@/lib/backend/data/data-service";
import { getUserIdentifierServerside } from "@/lib/utils";
import { InvalidFileTypeError, EmptyPDFError, ExistingUploadError, InsufficientCreditsError } from "@/lib/backend/exceptions";

export async function POST(request: Request) {
  try {
    const userID = await getUserIdentifierServerside();
    const user = await UserService.getUser(userID);
    const formData = await request.formData();
    const pdfFile = formData.get("file") as File;

    // Delegate validation, existing upload check, and credit enforcement
    const credits = user?.credits ?? 0;
    let examJson;
    try {
      examJson = await processExamUpload(pdfFile, userID, credits);
    } catch (err) {
      if (err instanceof InvalidFileTypeError || err instanceof EmptyPDFError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      if (err instanceof ExistingUploadError) {
        return NextResponse.json(err.examJson, { status: 200, headers: { "X-In-User-Uploads": "true" } });
      }
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err; // unhandled exception
    }
    // Deduct credit for new upload
    await UserService.subtractCredits(userID, 1);

    return NextResponse.json(examJson, { status: 200 });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process the uploaded file." },
      { status: 500 }
    );
  }
}
