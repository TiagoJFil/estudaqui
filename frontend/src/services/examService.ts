import { llm } from "../lib/llm/LLMFacade";
import pdfParse from "pdf-parse";
import preprocessMathBlocks from "@/components/exam/preprocessMathBlocks";
import fs from "fs";
import path from "path";

export interface ExamQuestion {
  question: string;
  supplementalContent?: string | null; // Optional field for additional context
  questionType: "openEnded" | "multipleChoice" | "other";
  responses?: string[] | null;
  correctResponse?: string | null;
}

export interface ExamJSON {
  questions: ExamQuestion[];
}

/**
 * Extracts text from a PDF file buffer using pdf-parse
 * @param arrayBuffer PDF file as ArrayBuffer
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfData = await pdfParse(Buffer.from(arrayBuffer));
  return pdfData.text;
}

/**
 * Uploads a PDF file, extracts content, and returns structured exam JSON
 * @param pdfFile PDF file as File
 */
export async function upload(pdfFile: File): Promise<ExamJSON> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Invalid PDF file");
  }

  const rawText = await extractTextFromPDF(arrayBuffer);
  console.log("Extracted text from PDF:", rawText);
  const result = await llm.analyzeExam(rawText);

  return result as ExamJSON;
}

/**
 * Given an exam question, returns a suggested answer from the AI
 * @param question The question to generate an answer for
 */
export async function getSuggestedAnswer(question: string, additionalContent: string | null): Promise<string> {
  if (!question || question.trim() === "") {
    throw new Error("Question text cannot be empty");
  }
  const answer = await llm.getSuggestedAnswer(question, additionalContent);
  const processed = preprocessMathBlocks(answer.trim());
  // Log both original and processed to a file (server-side only)
  try {
    const logPath = path.resolve(process.cwd(), "preprocess-mathblock-log.txt");
    const logEntry = `---\nORIGINAL:\n${answer.trim()}\n---\nPROCESSED:\n${processed}\n===\n`;
    fs.appendFileSync(logPath, logEntry, "utf8");
  } catch (e) {
    // Ignore logging errors
  }
  return answer.trim();
}
