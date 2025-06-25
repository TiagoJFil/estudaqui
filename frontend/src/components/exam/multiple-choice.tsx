import { MultipleChoiceQuestion } from "@/lib/frontend/types";
import { Check, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { cardBase } from "./exam-class-names";

export default function MultipleChoice({ question }: { question: MultipleChoiceQuestion }) {
  // State holds selected responses; supports single or multi-select
  const [selected, setSelected] = useState<string[]>([]);

  // Determine if multiple answers allowed
  const maxSelections = question.correctResponses?.length ?? 1;
  const isMulti = maxSelections > 1;

  // Toggle response selection within allowed limit
  const toggleSelection = (response: string) => {
    if (selected.includes(response)) {
      setSelected(selected.filter((r) => r !== response));
    } else if (selected.length < maxSelections) {
      setSelected([...selected, response]);
    }
  };

  return (
    <div className={clsx("space-y-2", cardBase)}>
      {question.responses?.map((response, idx) => {
        const isSelected = selected.includes(response);
        const isCorrect = question.correctResponses?.includes(response);
        // Show feedback once at least one selection made
        const showFeedback = selected.length > 0;
        const bgColor =
          showFeedback && isSelected
            ? isCorrect
              ? "bg-green-100 border-green-500"
              : "bg-red-100 border-red-500"
            : "bg-white";

        return (
          <div
            key={idx}
            onClick={() => toggleSelection(response)}
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
