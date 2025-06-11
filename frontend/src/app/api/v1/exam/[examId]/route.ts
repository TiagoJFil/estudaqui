
import { getExamById } from "@/lib/llm/exam-service";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/exam/[examId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const {examId} = await params;
  const examJson = await getExamById(examId);
  if (!examJson) {
    return NextResponse.json(
      { error: "Exam not found." },
      { status: 404 }
    );
  }
  return NextResponse.json(examJson, { status: 200 });
}


