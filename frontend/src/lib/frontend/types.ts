"use client"

import {PackInfo} from "@/lib/backend/data/data-interfaces";

//export packinfo as PackType
export type PackType = PackInfo 

export type ExamJson = {
    examId: string;
    questions: Array<OpenEndedQuestion | MultipleChoiceQuestion>;
};

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