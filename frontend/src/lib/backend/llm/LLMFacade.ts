import { LLMProvider } from "./LLMProvider";
import { OpenAiLLMProvider } from "./OpenAiLLMProvider";
import { OllamaLLMProvider } from "./OllamaLLMProvider";

let provider: LLMProvider;

switch (process.env.LLM_PROVIDER) {
  case "ollama":
    provider = new OllamaLLMProvider();
    break;
  case "openai":
  default:
    provider = new OpenAiLLMProvider();
    break;
}

export const llm = provider;
