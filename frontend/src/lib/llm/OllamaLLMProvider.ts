import { ExamJSON } from "@/services/examService";
import { LLMProvider} from "./LLMProvider";

export class OllamaLLMProvider implements LLMProvider {
  //private endpoint = process.env.OLLAMA_API_URL || "http://localhost:11434/api/chat";

  async analyzeExam(input: Buffer | string): Promise<ExamJSON> {
        return new Promise<ExamJSON>(async (resolve, reject) => {
            input
            return {
                questions: [
                    {
                    question: "What is the capital of France?",
                    questionType: "openEnded",
                    responses: ["Paris"],
                    correctResponse: "Paris"
                    },
                    {
                    question: "What is 2 + 2?",
                    questionType: "openEnded",
                    responses: ["4"],
                    correctResponse: "4"
                    }
                ]
            }
        })
    }

}