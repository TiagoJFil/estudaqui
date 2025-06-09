import { getExamById } from "@/services/examService";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/exam/[examId]
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  
    const examJson = await getExamById(params.examId);
    if (!examJson) {
        return NextResponse.json(
            { error: "Exam not found." },
            { status: 404 }
        );
    }

    return NextResponse.json(examJson, { status: 200 });
}
