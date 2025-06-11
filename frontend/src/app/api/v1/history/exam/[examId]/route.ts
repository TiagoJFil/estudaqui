
import { HistoryService } from "@/lib/data/data-service";
import { getExamById } from "@/lib/llm/exam-service";
import { getUserIdentifierServerside } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const user = await getUserIdentifierServerside()
  const { examId } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Invalid request. Provide a name" },
      { status: 400 }
    );
  }
  if ( name === "" || name.length > 100) {
    return NextResponse.json(
      { error: "Invalid name. Name must be between 1 and 100 characters." },
      { status: 400 }
    );
  }

  await HistoryService.updateExamName(user, examId, name);
  return NextResponse.json(
    { message: "Exam name updated." },
    { status: 200 }
  );
}

//create a DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const user = await getUserIdentifierServerside();
  const { examId } = await params;

  try {
    await HistoryService.deleteExam(user, examId);
    return NextResponse.json(
      { message: "Exam deleted from history." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam." },
      { status: 500 }
    );
  }
}