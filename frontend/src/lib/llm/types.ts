
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
