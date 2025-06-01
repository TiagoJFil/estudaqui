// Build a Next.js API route to handle file uploads receives a PDF file, and calls ExamService.upload to process it. The route should return the structured exam JSON as a response.
import { NextResponse } from "next/server";
import { upload } from "@/services/examService";
import { getUser, subtractCreditsFromUser } from "@/lib/data/data-service";
import { getUserIdentifier } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const userID = await getUserIdentifier();
    if (!userID) {
      return NextResponse.json(
        { error: "User not authenticated." },
        { status: 401 }
      );
    }
    const user = await getUser(userID);
    if(user?.credits === undefined || user?.credits <= 0) {
      return NextResponse.json(
        { error: "User does not have any credits." },
        { status: 403 }
      );
    }
    const formData = await request.formData();
    const pdfFile = formData.get("files") as File;
    if (!pdfFile || pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF." },
        { status: 400 }
      );
    }

    //TODO see if we are sending more files
    if(user.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more credits to upload files." },
        { status: 403 }
      );
    }

    const examJson = await upload(pdfFile,userID);
//TODO alterar isto, para remover o credito no incio e se corre rmal dar o credito de volta para o user nao poder enviar mais do que uma vez do mesmo credito
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
