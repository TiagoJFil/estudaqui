import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { OpenEndedQuestion } from "@/app/types";
import { Bot, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import preprocessMathBlocks from './preprocess-math-blocks';
import { answerBoxBase, aiIconBase, aiAnswerTextBase } from "./exam-class-names";
import clsx from "clsx";

export default function OpenEnded({
  question,
  onAiAnswerRequest
}: {
  question: OpenEndedQuestion;
  onAiAnswerRequest: (question: OpenEndedQuestion) => void;
}) {
  const [answer, setAnswer] = useState("");

  console.debug("AI suggestion answer: ", question.suggestedAnswer);
  console.debug("AI Suggestion after sanitizing: ", preprocessMathBlocks(question.suggestedAnswer || ""));

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Write your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <Button
        variant="outline"
        onClick={() => onAiAnswerRequest(question)}
        disabled={question.isAiSuggestionLoading}
      >
        {question.isAiSuggestionLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Bot className="w-4 h-4 mr-2" />
        )}
        Ask AI for a possible answer
      </Button>

      {(question.isAiSuggestionLoading || question.suggestedAnswer || question.aiSuggestionError) && (
        <div className={answerBoxBase}>
          <Bot className={clsx(aiIconBase, question.aiSuggestionError ? "text-red-500" : "text-blue-500")} />
          <div className="max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-500 font-medium mb-1">AI Suggested Answer:</p>
            {question.aiSuggestionError ? (
              <p className="text-red-600 text-sm font-semibold">An error has occurred. Please try again.</p>
            ) : question.isAiSuggestionLoading ? (
              <p className="text-gray-500 text-sm italic">Loading...</p>
            ) : (
              <div className={aiAnswerTextBase}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {preprocessMathBlocks(question.suggestedAnswer || "")}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
