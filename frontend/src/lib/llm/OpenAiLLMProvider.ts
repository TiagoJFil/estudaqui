// lib/llm/OpenAiLLMProvider.ts
import OpenAI from "openai";
import { LLMProvider, ExamJSON } from "./LLMProvider";

export class OpenAiLLMProvider implements LLMProvider {
  private openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  private promptTemplate(text: string) {
    return `
You are a professional exam parser.

Your task is to extract all questions from the **provided document only**. Do not use any external knowledge or make assumptions beyond the content shown.

Return the results in **strict JSON format** with the following structure:

{
  "questions": [
    {
      "question": "string",
      "supplementalContent": "string",
      "questionType": "openEnded" | "multipleChoice" | "other",
      "responses": [ "string", ... ] | null,
      "correctResponse": "string" | null
    }
  ]
}

### Rules:

1. Use **only** the content from the input document. Do not infer or invent information.
2. For each question:
   - Set the \`question\` field to the **exact question text** as written.
   - Set the \`supplementalContent\` to include **all directly attached content necessary to understand the question**, such as:
     - Code snippets
     - Text excerpts
     - Definitions
     - Instructions
   - Do **not** reference external content (e.g., don’t write *"Leia o excerto..."*). **If an excerpt is present or anything that the user needs for context, copy it in full**.
3. Use \`questionType\` as follows:
   - \`"openEnded"\`: requires a free-text response
   - \`"multipleChoice"\`: includes predefined options
   - \`"other"\`: any other format
4. If the question has no listed response options, set \`responses: null\`.
5. Only include \`correctResponse\` if the correct answer is **explicitly stated**. Otherwise, use \`null\`.
6. Escape all necessary characters to ensure valid JSON.
7. Preserve original wording, formatting, and order exactly as shown.
8. **Do not include explanations, commentary, or additional output**—return only the JSON.

### Output:

Return **only the JSON object** as described above. Do not include any other text or commentary.

### Document content to analyze:
${text}
`.trim();
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
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You are an exam-to-JSON converter." },
        { role: "user", content: this.promptTemplate(content) }
      ]
    });

    let jsonText = response.output_text
    console.log("LLM response:", jsonText);
    
    if (jsonText.startsWith("```json") && jsonText.endsWith("```")) {
      jsonText = jsonText.slice(7, -3).trim();
    } 

    return JSON.parse(jsonText) as ExamJSON;
  }
}
