import type {
  AskPerplexityResult,
  SearchContextSize,
} from "./ask-perplexity.js";
import { streamPerplexity } from "./ask-perplexity.js";
import { getPerplexityApiKey } from "./config.js";
import { loadSystemPrompt } from "./load-system-prompt.js";
import {
  collectStreamToResult,
  formatSources,
  handleStreamingOutput,
} from "./stream-output.js";
import { stripThinkContent } from "./strip-think-content.js";

export type CliOptions = {
  model: string;
  json?: boolean;
  system?: string;
  systemText?: string;
  context?: SearchContextSize;
  showThinking?: boolean;
  stream?: boolean;
};

export type CliDependencies = {
  streamPerplexity: typeof streamPerplexity;
  loadSystemPrompt: typeof loadSystemPrompt;
  getApiKey: () => string | undefined;
  output: (message: string) => void;
  writeStream: (chunk: string) => void;
  errorOutput: (message: string) => void;
  exit: (code: number) => never;
};

const defaultDependencies: CliDependencies = {
  streamPerplexity,
  loadSystemPrompt,
  getApiKey: getPerplexityApiKey,
  output: (message) => {
    console.log(message);
  },
  writeStream: (chunk) => {
    process.stdout.write(chunk);
  },
  errorOutput: (message) => {
    console.error(message);
  },
  // eslint-disable-next-line unicorn/no-process-exit
  exit: (code) => process.exit(code),
};

type FormatOptions = {
  json: boolean;
  showThinking: boolean;
};

export function formatResult(
  result: AskPerplexityResult,
  options: FormatOptions,
): string {
  const text = options.showThinking
    ? result.text
    : stripThinkContent(result.text);

  if (options.json) {
    return JSON.stringify(
      {
        text,
        sources: result.sources,
        usage: result.usage,
        providerMetadata: result.providerMetadata,
      },
      undefined,
      2,
    );
  }

  return text.trim() + formatSources(result.sources);
}

export async function runCli(
  prompt: string,
  options: CliOptions,
  deps: CliDependencies = defaultDependencies,
): Promise<void> {
  const apiKey = deps.getApiKey();

  if (!apiKey) {
    deps.errorOutput(
      "Error: Perplexity API key is required\n" +
        "Set it with: export PERPLEXITY_API_KEY='your-api-key'\n" +
        "Or store it: askpplx config --set-api-key 'your-api-key'",
    );
    deps.exit(1);
  }

  const systemPrompt =
    options.systemText ?? (await deps.loadSystemPrompt(options.system));

  const stream = deps.streamPerplexity({
    apiKey,
    model: options.model,
    prompt,
    system: systemPrompt,
    searchContextSize: options.context,
  });

  const useStreaming = options.stream !== false && !options.json;

  if (useStreaming) {
    await handleStreamingOutput(
      stream,
      { showThinking: options.showThinking ?? false },
      deps,
    );
  } else {
    const result = await collectStreamToResult(stream);

    deps.output(
      formatResult(result, {
        json: options.json ?? false,
        showThinking: options.showThinking ?? false,
      }),
    );
  }
}
