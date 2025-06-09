export interface ExamQuestion {
  question: string;
  questionType: "openEnded" | "multipleChoice" | "other";
  supplementalContent: string | null; // Optional field for additional context
}

export interface MultipleChoiceQuestion extends ExamQuestion {
  responses?: string[] | null;
  correctResponse?: string | null;
}

export interface OpenEndedQuestion extends ExamQuestion {
  suggestedAnswer?: string | null;
  isAiSuggestionLoading?: boolean;
  aiSuggestionError?: boolean;
}

// Type guard functions
export function isMultipleChoiceQuestion(question: ExamQuestion): question is MultipleChoiceQuestion {
  return question.questionType === "multipleChoice";
}

export function isOpenEndedQuestion(question: ExamQuestion): question is OpenEndedQuestion {
  return question.questionType === "openEnded"; 
}