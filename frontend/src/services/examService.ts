// services/examService.ts
import { llm } from "../lib/llm/LLMFacade";
import pdfParse from "pdf-parse";

export interface ExamQuestion {
  question: string;
  questionType: "openEnded" | "multipleChoice" | "other";
  responses?: string[];
  correctResponse?: string;
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
