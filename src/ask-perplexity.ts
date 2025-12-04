import { createPerplexity } from "@ai-sdk/perplexity";
import { streamText } from "ai";

export type SearchContextSize = "low" | "medium" | "high";

type AskPerplexityOptions = {
  apiKey: string;
  model: string;
  prompt: string;
  system?: string;
  searchContextSize?: SearchContextSize;
};

export type StreamPerplexityResult = ReturnType<typeof streamText>;

export type AskPerplexityResult = {
  text: string;
  sources: Awaited<StreamPerplexityResult["sources"]>;
  usage: Awaited<StreamPerplexityResult["usage"]>;
  providerMetadata: Awaited<StreamPerplexityResult["providerMetadata"]>;
};

export function streamPerplexity(
  options: AskPerplexityOptions,
): StreamPerplexityResult {
  const perplexity = createPerplexity({ apiKey: options.apiKey });

  return streamText({
    model: perplexity(options.model),
    system: options.system,
    prompt: options.prompt,
    providerOptions: {
      perplexity: {
        web_search_options: {
          search_context_size: options.searchContextSize ?? "high",
        },
      },
    },
  });
}
