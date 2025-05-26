// lib/llm/OpenAiLLMProvider.ts
import OpenAI from "openai";
import { LLMProvider, ExamJSON } from "./LLMProvider";

export class OpenAiLLMProvider implements LLMProvider {
  private openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  private promptTemplate(text: string) {
    return `You are an exam-to-JSON converter. Given the following exam content (text, images as data URLs, or LaTeX formulas), extract all questions into JSON as:
{
  "questions": [
    {
      "question": string,
      "questionType": "openEnded" | "multipleChoice" | "other",
      "responses": [string],
      "correctResponse": string
    },...
  ]
}
Use only the provided content. Do not invent or lookup anything else.

Content:
${text}`;
  }

  async analyzeExam(pdfBase64: Buffer | string): Promise<ExamJSON> {
    let content: string;
    if (Buffer.isBuffer(pdfBase64)) {
      // encode PDF as base64 Data URL
      const base64 = pdfBase64.toString("base64");
      content = `data:application/pdf;base64,${base64}`;
    } else {
      content = pdfBase64;
    }

    const response = await this.openAI.responses.create({
      model: "gpt-3.5-turbo-0613",
      input: [
        { role: "system", content: "You are an exam-to-JSON converter." },
        { role: "user", content: this.promptTemplate(content) }
      ]
    });

    const jsonText = response.output_text

    return JSON.parse(jsonText) as ExamJSON;
  }
}
