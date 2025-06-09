import React from "react";
import { OpenEndedQuestion, MultipleChoiceQuestion, isMultipleChoiceQuestion, isOpenEndedQuestion } from "@/app/types";
import MultipleChoice from "./multiple-choice";
import OpenEnded from "./open-ended";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import preprocessMathBlocks from './preprocess-math-blocks';
import { cardBase, questionTitleBase, supplementalContentBase } from "./exam-class-names";

export default function QuestionCard({ question, index, onAiAnswerRequest, isAiSuggestedAnswerLoading, aiSuggestionError }: 
    { question: MultipleChoiceQuestion | OpenEndedQuestion, index: number, onAiAnswerRequest: (question: OpenEndedQuestion) => void, isAiSuggestedAnswerLoading?: boolean, aiSuggestionError?: boolean }) {
  const isOpenEnded = isOpenEndedQuestion(question);
  const isMultipleChoice = isMultipleChoiceQuestion(question);

  console.debug("Rendering QuestionCard for question:", question.question, "at index:", index);
  console.debug("isOpenEnded:", isOpenEnded, "isMultipleChoice:", isMultipleChoice);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-0 sm:p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Question {index}</h2>
      </div>
      {/* Question Title with Markdown+Math */}
      <div className={questionTitleBase + " text-base sm:text-lg font-semibold text-gray-800 mb-2 leading-relaxed"}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {preprocessMathBlocks(String(question.question))}
        </ReactMarkdown>
      </div>
      {/* Supplemental Content with Markdown+Math */}
      {question.supplementalContent && (
        <div className={supplementalContentBase + " bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-600 text-sm mb-2"}>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {preprocessMathBlocks(String(question.supplementalContent))}
          </ReactMarkdown>
        </div>
      )}
      {/* Render based on the type of question using type guards */}
      {isOpenEnded && <OpenEnded question={question} onAiAnswerRequest={onAiAnswerRequest} />}
      {isMultipleChoice && <MultipleChoice question={question} />}
      {!isOpenEnded && !isMultipleChoice && <div>Other question type</div>}
    </div>
  );
}
