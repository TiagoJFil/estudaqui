import { ExamJSON } from "@/services/examService";

export interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface LLMProvider {
  /**
   * Analyzes exam content (text or visual) and returns structured JSON.
   * @param inputBuffer Buffer for PDF or extracted text string
   */
  analyzeExam(input: Buffer | string): Promise<ExamJSON>;
}
