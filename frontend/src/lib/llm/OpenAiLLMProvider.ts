import OpenAI from "openai";
import { LLMProvider, ExamJSON } from "./LLMProvider";
import { SUGGESTED_ANSWER_SYSTEM_PROMPT, EXAM_PARSER_SYSTEM_PROMPT } from "./prompts";

export class OpenAiLLMProvider implements LLMProvider {
  private openAI = new OpenAI();

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
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: EXAM_PARSER_SYSTEM_PROMPT },
        { role: "user", content: `Exam Content: ${content}` }
      ],
      temperature: 0.2
    });

    let jsonText = response.output_text
    console.log("LLM response:", jsonText);
    
    if (jsonText.startsWith("```json") && jsonText.endsWith("```")) {
      jsonText = jsonText.slice(7, -3).trim();
    } 

    return JSON.parse(jsonText) as ExamJSON;
  }


  async getSuggestedAnswer(question: string, additionalInformation: string | null): Promise<string> {
      const response = await this.openAI.responses.create({
        model: "gpt-4o",
        input: [
          { role: "system", content: SUGGESTED_ANSWER_SYSTEM_PROMPT },
          { role: "user", content: `Question: "${question}" ${additionalInformation ? `Additional Context:\n"${additionalInformation}` : ""}"` }
        ],
        temperature: 0.2 // Lower temperature for more focused responses
      });
    return response.output_text.trim();
  }

}
