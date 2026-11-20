import type { AskPerplexityResult, StreamPerplexityResult } from "./ask-perplexity.js";

interface StreamDependencies {
  writeStream: (chunk: string) => void;
  output: (message: string) => void;
}

export function formatSources(sources: AskPerplexityResult["sources"]): string {
  if (sources.length === 0) {
    return "";
  }

  // Answers cite search results as [web:<resultId>]. Fetched pages and annotations carry no
  // result id, so they are listed unnumbered after the numbered ones.
  const numbered: string[] = [];
  const unnumbered: string[] = [];
  for (const source of sources) {
    if (source.sourceType !== "url") {
      continue;
    }
    const resultId = source.providerMetadata?.perplexity?.resultId;
    if (typeof resultId === "number") {
      numbered.push(`[${String(resultId)}] ${source.url}`);
    } else {
      unnumbered.push(`- ${source.url}`);
    }
  }

  const lines = [...numbered, ...unnumbered];
  if (lines.length === 0) {
    return "";
  }

  return `\n\nSources:\n${lines.join("\n")}`;
}

async function* answerChunks(
  stream: StreamPerplexityResult,
  showThinking: boolean,
): AsyncGenerator<string> {
  for await (const part of stream.stream) {
    if (part.type === "text-delta") {
      yield part.text;
    } else if (part.type === "reasoning-start" && showThinking) {
      yield "<think>";
    } else if (part.type === "reasoning-delta" && showThinking) {
      yield part.text;
    } else if (part.type === "reasoning-end" && showThinking) {
      yield "</think>";
    } else if (part.type === "error") {
      throw part.error instanceof Error ? part.error : new Error(String(part.error));
    }
  }
}

export async function handleStreamingOutput(
  stream: StreamPerplexityResult,
  options: { showThinking: boolean },
  deps: StreamDependencies,
): Promise<void> {
  for await (const chunk of answerChunks(stream, options.showThinking)) {
    deps.writeStream(chunk);
  }

  const sources = await stream.sources;
  const sourcesOutput = formatSources(sources);
  if (sourcesOutput) {
    deps.output(sourcesOutput);
  } else {
    deps.writeStream("\n");
  }
}

export async function collectStreamToResult(
  stream: StreamPerplexityResult,
  options: { showThinking: boolean },
): Promise<AskPerplexityResult> {
  let text = "";
  for await (const chunk of answerChunks(stream, options.showThinking)) {
    text += chunk;
  }

  const [sources, usage, finalStep] = await Promise.all([
    stream.sources,
    stream.usage,
    stream.finalStep,
  ]);
  const { providerMetadata } = finalStep;

  return { text, sources, usage, providerMetadata };
}
