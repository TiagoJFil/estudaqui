// services/examService.ts
import { addExamInfoToPDF, getPDFInfo, savePDF } from "@/lib/data/data-service";
import { llm } from "../lib/llm/LLMFacade";
import pdfParse from "pdf-parse";
import { hashTextSHA256 } from "@/lib/utils";
import preprocessMathBlocks from "@/components/exam/preprocessMathBlocks";
import fs from "fs";
import path from "path";

export interface ExamQuestion {
  question: string;
  supplementalContent?: string | null; // Optional field for additional context
  questionType: "openEnded" | "multipleChoice" | "other";
  responses?: string[] | null;
  correctResponse?: string | null;
  suggestedAnswer?: string | null;
}

export interface ExamJSON {
  examId: string;
  questions: ExamQuestion[];
  uploadDate?: Date; // Optional field for upload date
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
export async function upload(pdfFile: File,userID: string): Promise<ExamJSON> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Invalid PDF file");
  }

  const rawText = await extractTextFromPDF(arrayBuffer);
  const pdfTextHash = await hashTextSHA256(rawText)
  const savedPdfInfo = await savePDF(pdfFile,userID,pdfTextHash)
  if(!savedPdfInfo.examInfo){
    const result = await llm.analyzeExam(rawText);
    savedPdfInfo.examInfo = result;
    addExamInfoToPDF(pdfTextHash, result);
  }

  return {questions: savedPdfInfo.examInfo.questions, examId: pdfTextHash} as ExamJSON;
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

/**
 * Fetch an exam by its ID from your data source (DB, file, etc).
 * @param examId The exam's unique identifier
 * @returns The exam JSON object or null if not found
 */
export async function getExamById(examId: string) {

  if (!examId || examId.trim() === "") {
    throw new Error("Exam ID cannot be empty");
  }

  const pdfInfo = await getPDFInfo(examId);
  if (pdfInfo && pdfInfo.examInfo) {
    return { questions: pdfInfo.examInfo.questions, examId: examId } as ExamJSON;
  }

  console.warn(`Exam with ID ${examId} not found or has no exam info.`);

  return null;
}
