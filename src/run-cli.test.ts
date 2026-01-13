import { describe, expect, it, vi } from "vitest";

import type { AskPerplexityResult } from "./ask-perplexity.js";
import type { CliDependencies } from "./run-cli.js";
import { formatResult, runCli } from "./run-cli.js";

// Mock config module to avoid side effects (Conf instantiation)
vi.mock("./config.js", () => ({
  getPerplexityApiKey: vi.fn(),
}));

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

function createMockResult(
  overrides: Partial<AskPerplexityResult> = {},
): AskPerplexityResult {
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

function createMockStreamResult(chunks: string[] = ["Streamed ", "response"]) {
  const mockResult = createMockResult({ text: chunks.join("") });
  return {
    textStream: {
      *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    },
    sources: Promise.resolve(mockResult.sources),
    usage: Promise.resolve(mockResult.usage),
    providerMetadata: Promise.resolve(mockResult.providerMetadata),
  };
}

function createMockDeps(
  overrides: Partial<CliDependencies> = {},
): CliDependencies {
  return {
    streamPerplexity: vi.fn().mockReturnValue(createMockStreamResult()),
    loadSystemPrompt: vi.fn().mockResolvedValue(DEFAULT_SYSTEM_PROMPT),
    getApiKey: vi.fn().mockReturnValue("test-api-key"),
    output: vi.fn(),
    writeStream: vi.fn(),
    errorOutput: vi.fn(),
    exit: vi.fn() as unknown as (code: number) => never,
    ...overrides,
  };
}

describe("formatResult", () => {
  it("returns text with sources when json is false", () => {
    const result = createMockResult({ text: "Hello world" });

    const output = formatResult(result, { json: false, showThinking: false });

    expect(output).toBe("Hello world\n\nSources:\n[1] https://example.com");
  });

  it("returns text without sources section when no sources", () => {
    const result = createMockResult({ text: "Hello world", sources: [] });

    const output = formatResult(result, { json: false, showThinking: false });

    expect(output).toBe("Hello world");
  });

  it("returns JSON string when json is true", () => {
    const result = createMockResult({ text: "Hello world" });

    const output = formatResult(result, { json: true, showThinking: false });
    const parsed = JSON.parse(output) as AskPerplexityResult;

    expect(parsed.text).toBe("Hello world");
    expect(parsed.sources).toEqual(result.sources);
    expect(parsed.usage).toEqual(result.usage);
    expect(parsed.providerMetadata).toEqual(result.providerMetadata);
  });

  it("strips think blocks by default", () => {
    const result = createMockResult({
      text: "<think>reasoning here</think>Hello world",
    });

    const output = formatResult(result, { json: false, showThinking: false });

    expect(output).toBe("Hello world\n\nSources:\n[1] https://example.com");
  });

  it("preserves think blocks when showThinking is true", () => {
    const result = createMockResult({
      text: "<think>reasoning here</think>Hello world",
    });

    const output = formatResult(result, { json: false, showThinking: true });

    expect(output).toBe(
      "<think>reasoning here</think>Hello world\n\nSources:\n[1] https://example.com",
    );
  });
});

describe("runCli", () => {
  describe("non-streaming mode", () => {
    it("calls streamPerplexity with correct parameters", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "sonar-pro", stream: false }, deps);

      expect(deps.streamPerplexity).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        model: "sonar-pro",
        prompt: "test prompt",
        system: DEFAULT_SYSTEM_PROMPT,
        searchContextSize: undefined,
      });
    });

    it("passes searchContextSize when context option provided", async () => {
      const deps = createMockDeps();

      await runCli(
        "test prompt",
        { model: "sonar", context: "low", stream: false },
        deps,
      );

      expect(deps.streamPerplexity).toHaveBeenCalledWith(
        expect.objectContaining({ searchContextSize: "low" }),
      );
    });

    it("outputs text with sources", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi
          .fn()
          .mockReturnValue(createMockStreamResult(["API response"])),
      });

      await runCli("test prompt", { model: "sonar", stream: false }, deps);

      expect(deps.output).toHaveBeenCalledWith(
        "API response\n\nSources:\n[1] https://example.com",
      );
    });

    it("outputs JSON when json option is true", async () => {
      const deps = createMockDeps({
        streamPerplexity: vi
          .fn()
          .mockReturnValue(createMockStreamResult(["API response"])),
      });

      await runCli("test prompt", { model: "sonar", json: true }, deps);

      const outputCall = vi.mocked(deps.output).mock.calls[0]?.[0];
      expect(outputCall).toBeDefined();
      const parsed = JSON.parse(outputCall as string) as AskPerplexityResult;
      expect(parsed.text).toBe("API response");
    });
  });

  describe("streaming mode", () => {
    it("uses streaming by default", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "sonar" }, deps);

      expect(deps.streamPerplexity).toHaveBeenCalled();
      expect(deps.writeStream).toHaveBeenCalled();
    });

    it("writes streamed chunks to output", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "sonar" }, deps);

      expect(deps.writeStream).toHaveBeenCalledWith("Streamed ");
      expect(deps.writeStream).toHaveBeenCalledWith("response");
    });

    it("outputs sources after streaming completes", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "sonar" }, deps);

      expect(deps.output).toHaveBeenCalledWith(
        "\n\nSources:\n[1] https://example.com",
      );
    });
  });

  describe("common behavior", () => {
    it("loads default system prompt when no custom path provided", async () => {
      const deps = createMockDeps();

      await runCli("test prompt", { model: "sonar", stream: false }, deps);

      expect(deps.loadSystemPrompt).toHaveBeenCalledWith(undefined);
    });

    it("loads custom system prompt when path provided", async () => {
      const customPrompt = "Custom system prompt";
      const deps = createMockDeps({
        loadSystemPrompt: vi.fn().mockResolvedValue(customPrompt),
      });

      await runCli(
        "test prompt",
        { model: "sonar", system: "/path/to/prompt.md", stream: false },
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

      await runCli("test prompt", { model: "sonar" }, deps);

      expect(deps.errorOutput).toHaveBeenCalledWith(
        "Error: Perplexity API key is required\n" +
          "Set it with: export PERPLEXITY_API_KEY='your-api-key'\n" +
          "Or store it: askpplx config --set-api-key 'your-api-key'",
      );
      expect(deps.exit).toHaveBeenCalledWith(1);
    });
  });
});
