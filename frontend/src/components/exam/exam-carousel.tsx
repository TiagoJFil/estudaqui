import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import QuestionCard from "./question-card";
import { OpenEndedQuestion, MultipleChoiceQuestion } from "@/app/types";
import { dotBase, arrowBase } from "./exam-class-names";

export interface ExamCarouselProps {
  questions: (MultipleChoiceQuestion | OpenEndedQuestion)[];
  onAiAnswerRequest: (question: OpenEndedQuestion) => void;
  isAiSuggestedAnswerLoading?: boolean;	
}

// Add a direction enum for clarity
enum Direction {
  Left = -1,
  Right = 1,
  None = 0,
}

function getInitialX(direction: Direction) {
  if (direction === Direction.Right) return 40;
  if (direction === Direction.Left) return -40;
  return 0;
}

function getExitX(direction: Direction) {
  if (direction === Direction.Right) return -40;
  if (direction === Direction.Left) return 40;
  return 0;
}

export function ExamCarousel({ props }: { props: ExamCarouselProps }) {
  const { questions, onAiAnswerRequest } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(Direction.None);

  function goToQuestion(index: number, dir: Direction) {
    setDirection(dir);
    setCurrentIndex(index);
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1, Direction.Left);
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1, Direction.Right);
    }
  }

  function handleDotClick(i: number) {
    if (i !== currentIndex) {
      goToQuestion(i, i > currentIndex ? Direction.Right : Direction.Left);
    }
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center w-full h-full flex-1">
        {/* Carousel */}
        <div className="relative flex-1 w-full h-full">
          <div className="relative overflow-x-hidden h-full w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: getInitialX(direction) }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: getExitX(direction) }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full h-full flex-1 shrink-0 px-2 absolute left-0 top-0"
              >
                <QuestionCard
                  question={questions[currentIndex]}
                  index={currentIndex + 1}
                  onAiAnswerRequest={onAiAnswerRequest}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls: Arrows and Pagination Dots together */}
        <div className="flex items-center justify-center w-full mt-4">
          {/* Left Arrow */}
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className={clsx("mr-2", arrowBase)}
            style={{ zIndex: 2 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={clsx(
                  dotBase,
                  i === currentIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to question ${i + 1}`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            className={clsx("ml-2", arrowBase)}
            style={{ zIndex: 2 }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
