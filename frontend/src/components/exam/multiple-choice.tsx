import { MultipleChoiceQuestion } from "@/lib/frontend/types";
import { Check, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { cardBase } from "./exam-class-names";

export default function MultipleChoice({ question }: { question: MultipleChoiceQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className={clsx("space-y-2", cardBase)}>
      {question.responses?.map((response, idx) => {
        const isSelected = selected === response;
        const isCorrect = question.correctResponses?.includes(response);
        const showFeedback = selected !== null;
        const bgColor =
          showFeedback && isSelected
            ? isCorrect
              ? "bg-green-100 border-green-500"
              : "bg-red-100 border-red-500"
            : "bg-white";

        return (
          <div
            key={idx}
            onClick={() => setSelected(response)}
            className={clsx("cursor-pointer border p-3 rounded transition-all", bgColor)}
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
              />
              <span>{response}</span>
              {showFeedback && isSelected && (
                isCorrect ? <Check className="text-green-600" /> : <X className="text-red-600" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
