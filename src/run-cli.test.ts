import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import type { AskPerplexityResult } from "./ask-perplexity.js";
import type { CliDependencies } from "./run-cli.js";
import { formatResult, runCli } from "./run-cli.js";

// Mock config module to avoid side effects (Conf instantiation)
vi.mock("./config.js", () => ({
  getPerplexityApiKey: vi.fn(),
}));

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

function createMockResult(overrides: Partial<AskPerplexityResult> = {}): AskPerplexityResult {
  return {
    text: "Test response",
    sources: [
      {
        type: "source",
        sourceType: "url",
        id: "test-id",
        url: "https://example.com",
      },
    ],
    usage: {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      inputTokenDetails: {
        noCacheTokens: undefined,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      },
      outputTokenDetails: {
        textTokens: undefined,
        reasoningTokens: undefined,
      },
    },
    providerMetadata: {
      perplexity: {
        images: [],
        usage: {
          citationTokens: 5,
          numSearchQueries: 1,
        },
      },
    },
    ...overrides,
  };
}

type MockPart =
  | { type: "text-delta"; text: string }
  | { type: "reasoning-start" }
  | { type: "reasoning-delta"; text: string }
  | { type: "reasoning-end" }
  | { type: "error"; error: unknown };

function textParts(chunks: string[]): MockPart[] {
  return chunks.map((text) => ({ type: "text-delta", text }));
}

function createMockStreamResult(parts: MockPart[] = textParts(["Streamed ", "response"])) {
  const mockResult = createMockResult();
  return {
    stream: {
      *[Symbol.asyncIterator]() {
        yield* parts;
      },
    },
    sources: Promise.resolve(mockResult.sources),
    usage: Promise.resolve(mockResult.usage),
    finalStep: Promise.resolve({ providerMetadata: mockResult.providerMetadata }),
  };
}

type MockCliDependencies = Omit<CliDependencies, "exit" | "output" | "writeStream"> & {
  exit: Mock<(code: number) => void>;
  output: Mock<(message: string) => void>;
  writeStream: Mock<(chunk: string) => void>;
};

function createMockDeps(
  overrides: Partial<
    Pick<CliDependencies, "streamPerplexity" | "loadSystemPrompt" | "getApiKey">
  > = {},
): MockCliDependencies {
  return {
    streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult()),
    loadSystemPrompt: vi.fn().mockResolvedValue(DEFAULT_SYSTEM_PROMPT),
    getApiKey: vi.fn().mockReturnValue("test-api-key"),
    output: vi.fn<(message: string) => void>(),
    writeStream: vi.fn<(chunk: string) => void>(),
    errorOutput: vi.fn<(message: string) => void>(),
    ...overrides,
    exit: vi.fn<(code: number) => void>(),
  };
}

describe("formatResult", () => {
  it("returns text with sources when json is false", () => {
    const result = createMockResult({ text: "Hello world" });

    const output = formatResult(result, { json: false });

    expect(output).toBe("Hello world\n\nSources:\n[1] https://example.com");
  });

  it("returns text without sources section when no sources", () => {
    const result = createMockResult({ text: "Hello world", sources: [] });

    const output = formatResult(result, { json: false });

    expect(output).toBe("Hello world");
  });

  it("returns JSON string when json is true", () => {
    const result = createMockResult({ text: "Hello world" });

    const output = formatResult(result, { json: true });

    expect(JSON.parse(output)).toStrictEqual({
      text: "Hello world",
      sources: [
        {
          type: "source",
          sourceType: "url",
          id: "test-id",
          url: "https://example.com",
        },
      ],
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        inputTokenDetails: {},
        outputTokenDetails: {},
      },
      providerMetadata: {
        perplexity: {
          images: [],
          usage: {
            citationTokens: 5,
            numSearchQueries: 1,
          },
        },
      },
    });
  });
});

describe("runCli", () => {
  describe("non-streaming mode", () => {
    it("calls streamPerplexity with correct parameters", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "low", stream: false }, deps);

      expect(deps.streamPerplexity).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        model: "low",
        prompt: "test prompt",
        system: DEFAULT_SYSTEM_PROMPT,
        searchContextSize: undefined,
      });
    });

    it("passes searchContextSize when context option provided", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "fast", context: "low", stream: false }, deps);

      expect(deps.streamPerplexity).toHaveBeenCalledWith(
        expect.objectContaining({ searchContextSize: "low" }),
      );
    });

    it("outputs text with sources", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi
          .fn()
          .mockReturnValue(createMockStreamResult(textParts(["API response"]))),
      });

      await runCli("test prompt", { model: "fast", stream: false }, deps);

      expect(deps.output).toHaveBeenCalledWith("API response\n\nSources:\n[1] https://example.com");
    });
  });

  describe("reasoning", () => {
    const reasoningParts: MockPart[] = [
      { type: "reasoning-start" },
      { type: "reasoning-delta", text: "pondering" },
      { type: "reasoning-end" },
      ...textParts(["Answer"]),
    ];

    it("omits reasoning parts by default when streaming", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult(reasoningParts)),
      });

      await runCli("test prompt", { model: "fast" }, deps);

      const written = deps.writeStream.mock.calls.map(([chunk]) => chunk).join("");
      expect(written).toBe("Answer");
    });

    it("writes reasoning inside think tags with showThinking when streaming", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult(reasoningParts)),
      });

      await runCli("test prompt", { model: "fast", showThinking: true }, deps);

      const written = deps.writeStream.mock.calls.map(([chunk]) => chunk).join("");
      expect(written).toBe("<think>pondering</think>Answer");
    });

    it("omits reasoning from JSON text by default", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult(reasoningParts)),
      });

      await runCli("test prompt", { model: "fast", json: true }, deps);

      const [output] = deps.output.mock.calls[0] ?? [];
      expect(JSON.parse(output ?? "")).toMatchObject({ text: "Answer" });
    });

    it("includes think-tagged reasoning in JSON text with showThinking", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult(reasoningParts)),
      });

      await runCli("test prompt", { model: "fast", json: true, showThinking: true }, deps);

      const [output] = deps.output.mock.calls[0] ?? [];
      expect(JSON.parse(output ?? "")).toMatchObject({ text: "<think>pondering</think>Answer" });
    });

    it("rejects when the stream reports an error", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi
          .fn()
          .mockReturnValue(
            createMockStreamResult([{ type: "error", error: new Error("upstream failed") }]),
          ),
      });

      await expect(runCli("test prompt", { model: "fast" }, deps)).rejects.toThrow(
        "upstream failed",
      );
    });
  });

  describe("streaming mode", () => {
    it("writes streamed chunks to output", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "fast" }, deps);

      expect(deps.writeStream).toHaveBeenCalledWith("Streamed ");
      expect(deps.writeStream).toHaveBeenCalledWith("response");
    });

    it("outputs sources after streaming completes", async () => {
      const deps = createMockDeps();
      const written: string[] = [];
      deps.writeStream.mockImplementation((chunk) => {
        written.push(chunk);
      });
      deps.output.mockImplementation((message) => {
        written.push(message);
      });

      await runCli("test prompt", { model: "fast" }, deps);

      expect(written).toStrictEqual([
        "Streamed ",
        "response",
        "\n\nSources:\n[1] https://example.com",
      ]);
    });
  });

  describe("common behavior", () => {
    it("loads default system prompt when no custom path provided", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "fast", stream: false }, deps);

      expect(deps.loadSystemPrompt).toHaveBeenCalledWith(undefined);
    });

    it("loads custom system prompt when path provided", async () => {
      const customPrompt = "Custom system prompt";
      const deps = createMockDeps({
        loadSystemPrompt: vi.fn().mockResolvedValue(customPrompt),
      });

      await runCli(
        "test prompt",
        { model: "fast", system: "/path/to/prompt.md", stream: false },
        deps,
      );

      expect(deps.loadSystemPrompt).toHaveBeenCalledWith("/path/to/prompt.md");
      expect(deps.streamPerplexity).toHaveBeenCalledWith(
        expect.objectContaining({ system: customPrompt }),
      );
    });

    it("exits with error when API key is missing", async () => {
      const deps = createMockDeps({
        getApiKey: vi.fn(),
      });

      await runCli("test prompt", { model: "fast" }, deps);

      expect(deps.errorOutput).toHaveBeenCalledWith(
        "Error: Perplexity API key is required\n" +
          "Set it with: export PERPLEXITY_API_KEY='your-api-key'\n" +
          "Or store it: askpplx config --set-api-key 'your-api-key'",
      );
      expect(deps.exit).toHaveBeenCalledWith(1);
    });
  });
});
