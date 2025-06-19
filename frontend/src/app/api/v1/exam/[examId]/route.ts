
import { getExamById, getExamByIdWithUser } from "@/lib/backend/llm/exam-service";
import { getUserIdentifierServerside } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/exam/[examId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const userID = await getUserIdentifierServerside();
  const {examId} = await params;
  const examJson = await getExamByIdWithUser(examId,userID);
  if (!examJson) {
    return NextResponse.json(
      { error: "Exam not found." },
      { status: 404 }
    );
  }
  return NextResponse.json(examJson, { status: 200 });
}


