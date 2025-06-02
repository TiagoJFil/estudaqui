import { LLMProvider, ExamJSON } from "./LLMProvider";

export class OllamaLLMProvider implements LLMProvider {
  
  private endpoint = process.env.OLLAMA_API_URL || "http://localhost:11434/api/chat";

  async analyzeExam(input: Buffer | string): Promise<ExamJSON> {
    throw new Error("Method not implemented.");
    }

  async getSuggestedAnswer(question: string, additionalContent: string | null): Promise<string> {
    throw new Error("Method not implemented.");
  }

}