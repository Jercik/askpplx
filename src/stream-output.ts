import type {
  AskPerplexityResult,
  StreamPerplexityResult,
} from "./ask-perplexity.js";

type StreamDependencies = {
  writeStream: (chunk: string) => void;
  output: (message: string) => void;
};

export function formatSources(sources: AskPerplexityResult["sources"]): string {
  if (sources.length === 0) {
    return "";
  }

  const lines: string[] = [];
  for (const [index, source] of sources.entries()) {
    if (source.sourceType === "url") {
      lines.push(`[${String(index + 1)}] ${source.url}`);
    }
  }

  if (lines.length === 0) {
    return "";
  }

  return `\n\nSources:\n${lines.join("\n")}`;
}

async function streamWithThinking(
  stream: StreamPerplexityResult,
  deps: Pick<StreamDependencies, "writeStream">,
): Promise<void> {
  for await (const chunk of stream.textStream) {
    deps.writeStream(chunk);
  }
}

async function streamWithoutThinking(
  stream: StreamPerplexityResult,
  deps: Pick<StreamDependencies, "writeStream">,
): Promise<void> {
  let buffer = "";
  let insideThink = false;
  let thinkEnded = false;

  for await (const chunk of stream.textStream) {
    if (thinkEnded) {
      deps.writeStream(chunk);
      continue;
    }

    buffer += chunk;

    if (!insideThink && buffer.includes("<think>")) {
      insideThink = true;
    }

    if (insideThink && buffer.includes("</think>")) {
      thinkEnded = true;
      const thinkEnd = buffer.lastIndexOf("</think>") + "</think>".length;
      const afterThink = buffer.slice(thinkEnd);
      if (afterThink) {
        deps.writeStream(afterThink);
      }
      buffer = "";
    } else if (!insideThink) {
      deps.writeStream(buffer);
      buffer = "";
    }
  }
}

export async function handleStreamingOutput(
  stream: StreamPerplexityResult,
  options: { showThinking: boolean },
  deps: StreamDependencies,
): Promise<void> {
  await (options.showThinking
    ? streamWithThinking(stream, deps)
    : streamWithoutThinking(stream, deps));

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
): Promise<AskPerplexityResult> {
  let text = "";
  for await (const chunk of stream.textStream) {
    text += chunk;
  }

  const [sources, usage, providerMetadata] = await Promise.all([
    stream.sources,
    stream.usage,
    stream.providerMetadata,
  ]);

  return { text, sources, usage, providerMetadata };
}
