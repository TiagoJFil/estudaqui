// services/examService.ts
import { FileService, UploadService, UserService } from "@/lib/backend/data/data-service";
import pdfParse from "pdf-parse";
import { hashTextSHA256 } from "@/lib/utils";
import preprocessMathBlocks from "@/components/exam/preprocess-math-blocks";
import fs from "fs";
import path from "path";
import { llm } from "./LLMFacade";
import { ExamJSON } from "./types";
import { InvalidFileTypeError, EmptyPDFError, ExistingUploadError, InsufficientCreditsError } from "@/lib/backend/exceptions";
import { Users } from "lucide-react";

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
export async function upload(pdfFile: File,rawText: string,pdfTextHash: string, userID: string): Promise<ExamJSON> {
  const savedPdfInfo = await FileService.savePDF(pdfFile, userID, pdfTextHash);
  if (!savedPdfInfo.examInfo) {
    const result = await llm.analyzeExam(rawText);
    savedPdfInfo.examInfo = result;
    await FileService.addExamInfo(pdfTextHash, result);
  }
  // Track this upload for the user
  await UploadService.addUserUpload(userID, pdfTextHash, pdfFile.name);
  return { questions: savedPdfInfo.examInfo.questions, examId: pdfTextHash } as ExamJSON;
}

export async function getPDFTextContent(pdfFile: File): Promise<string> {
  if (!pdfFile || !(pdfFile instanceof File)) {
    throw new Error("Invalid file provided");
  }
  if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File must be a PDF");
  }
  const arrayBuffer = await pdfFile.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Invalid PDF file");
  }
  const rawText = await extractTextFromPDF(arrayBuffer);
  return rawText.trim();
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

  const pdfInfo = await FileService.getPDFInfo(examId);
  if (pdfInfo && pdfInfo.examInfo) {
    return { questions: pdfInfo.examInfo.questions, examId: examId } as ExamJSON;
  }

  console.warn(`Exam with ID ${examId} not found or has no exam info.`);

  return null;
}

export async function getExamByIdWithUser(examID: string, userID: string): Promise<ExamJSON | null> {
  if (!examID || examID.trim() === "") {
    throw new Error("Exam ID cannot be empty");
  }
  if (!userID || userID.trim() === "") {
    throw new Error("User ID cannot be empty");
  }
  const pdfInfo = await FileService.getPDFInfo(examID);
  if (pdfInfo && pdfInfo.examInfo) {
    // Check if the user is the owner of this exam
      
    const existingUserUploads = await UploadService.getUserUploads(userID);
    const isOwner = existingUserUploads.some(upload => upload.id === examID);
    if (!isOwner) {
      return null; // User does not own this exam
    }

    return { questions: pdfInfo.examInfo.questions, examId: examID } as ExamJSON;
  }
  return null; // Exam not found or has no exam info
}

/**
 * Processes an exam upload: validates file, checks for existing upload, enforces credits, or throws specific exceptions.
 */
export async function processExamUpload(pdfFile: File, userID: string, userCredits: number): Promise<ExamJSON> {
  if (!pdfFile || pdfFile.type !== "application/pdf") {
    throw new InvalidFileTypeError();
  }
  const arrayBuffer = await pdfFile.arrayBuffer();
  const rawText = await extractTextFromPDF(arrayBuffer);
  if (!rawText || rawText.trim().length === 0) {
    throw new EmptyPDFError();
  }
  const pdfTextHash = await hashTextSHA256(rawText);
  // Check if user already uploaded this exam
  const existingUploads = await UploadService.getUserUploads(userID);
  const isExisting = Array.isArray(existingUploads) && existingUploads.some(u => u.id === pdfTextHash);
  if (isExisting) {
    const pdfInfo = await getExamById(pdfTextHash);
    if (pdfInfo) {
      throw new ExistingUploadError(pdfInfo);
    }
  }
  if (userCredits < 1) {
    throw new InsufficientCreditsError();
  }
  // Proceed with actual upload and analysis
  const res = await upload(pdfFile,rawText,pdfTextHash, userID);
  return res;
}
