// services/examService.ts
import { llm } from "../lib/llm/LLMFacade";
import * as pdfjsLib from "pdfjs-dist/build/pdf";

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
 * Extracts text from a PDF file buffer using pdfjs-dist
 * @param arrayBuffer PDF file as ArrayBuffer
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Load PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Extract text items and join them with spaces
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n"; // Separate pages by newlines
  }

  return fullText;
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
  const result = await llm.analyzeExam(rawText);

  return result as ExamJSON;
}
