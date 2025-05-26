export interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface ExamQuestion {
  question: string;
  questionType: "openEnded" | "multipleChoice" | "other";
  responses?: string[];
  correctResponse?: string;
}

export interface ExamJSON {
  questions: ExamQuestion[];
}

export interface LLMProvider {
  /**
   * Analyzes exam content (text or visual) and returns structured JSON.
   * @param inputBuffer Buffer for PDF or extracted text string
   */
  analyzeExam(input: Buffer | string): Promise<ExamJSON>;
}
