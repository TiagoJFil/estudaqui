export interface ExamQuestion {
  question: string;
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
  return 'responses' in question || 'correctResponse' in question;
}

export function isOpenEndedQuestion(question: ExamQuestion): question is OpenEndedQuestion {
  return 'suggestedAnswer' in question;
}