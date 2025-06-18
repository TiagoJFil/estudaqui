import { NextResponse } from "next/server";
import { getSuggestedAnswer } from "@/lib/backend/llm/exam-service";

export async function GET(request: Request) {
  try {
    // Grab question and additionalContent from query parameters
    const url = new URL(request.url);
    const question = url.searchParams.get("question") || "";
    const additionalContent = url.searchParams.get("additionalContent");
    const answer = await getSuggestedAnswer(question, additionalContent);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error in suggest-answer API:", error);
    return NextResponse.json({ answer: "" }, { status: 500 });
  }
}
