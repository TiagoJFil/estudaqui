import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
    <Card className="mb-4">
      <CardHeader>
        <h2 className="text-lg font-semibold">Question {index}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cardBase}>
          {/* Question Title with Markdown+Math */}
          <div className={questionTitleBase}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {preprocessMathBlocks(String(question.question))}
            </ReactMarkdown>
          </div>
          {/* Supplemental Content with Markdown+Math */}
          {question.supplementalContent && (
            <div className={supplementalContentBase}>
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
      </CardContent>
    </Card>
  );
}
