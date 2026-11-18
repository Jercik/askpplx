import { createPerplexity } from "@ai-sdk/perplexity";
import type { PerplexityLanguageModelOptions } from "@ai-sdk/perplexity";
import { streamText } from "ai";

export type SearchContextSize = "low" | "medium" | "high";

interface AskPerplexityOptions {
  apiKey: string;
  model: string;
  prompt: string;
  system?: string;
  searchContextSize?: SearchContextSize;
}

export type StreamPerplexityResult = ReturnType<typeof streamText>;

export interface AskPerplexityResult {
  text: string;
  sources: Awaited<StreamPerplexityResult["sources"]>;
  usage: Awaited<StreamPerplexityResult["usage"]>;
  providerMetadata: Awaited<StreamPerplexityResult["providerMetadata"]>;
}

export function streamPerplexity(options: AskPerplexityOptions): StreamPerplexityResult {
  const perplexity = createPerplexity({ apiKey: options.apiKey });

  return streamText({
    model: perplexity(options.model),
    instructions: options.system,
    prompt: options.prompt,
    onError: () => {},
    providerOptions: {
      perplexity: {
        tools: [
          {
            type: "web_search",
            search_context_size: options.searchContextSize ?? "high",
          },
        ],
      } satisfies PerplexityLanguageModelOptions,
    },
  });
}
