#!/usr/bin/env node

import { Command, Option } from "@commander-js/extra-typings";

import packageJson from "../package.json" with { type: "json" };
import {
  clearPerplexityApiKey,
  getConfigPath,
  getPerplexityApiKey,
  maskApiKey,
  setPerplexityApiKey,
} from "./config.js";
import { formatRequiresHelpText } from "./format-requires-help-text.js";
import type { CliOptions } from "./run-cli.js";
import { runCli } from "./run-cli.js";
import type { SearchContextSize } from "./ask-perplexity.js";
import { collectStdinText } from "./collect-stdin-text.js";
import { resolveCliPrompt } from "./resolve-cli-prompt.js";

const usageExamples = `
Examples:
  # Quick factual lookup in plain text
  askpplx "Node.js LTS version"

  # Summarize local text from stdin (filter style)
  cat article.txt | askpplx -S "Summarize this article"

  # Extract citation URLs for source auditing
  askpplx "Latest TypeScript release notes" --json | jq -r '.sources[].url' | sort -u

  # Capture only answer text for scripts
  askpplx "What changed in React 19?" --json | jq -r '.text'`;

const program = new Command()
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .showHelpAfterError("(add --help for additional information)")
  .showSuggestionAfterError()
  .argument("[prompt]", "The prompt to send to Perplexity Sonar")
  .option("-m, --model <model>", "Model to use", "sonar-reasoning-pro")
  .option("-s, --system <path>", "Path to custom system prompt file")
  .option("-S, --system-text <text>", "System prompt text (overrides -s)")
  .addOption(
    new Option("-c, --context <size>", "Search context size: low, medium, high")
      .choices(["low", "medium", "high"] as const)
      .default("high"),
  )
  .option("--json", "Output full API response as JSON (text, sources, usage)")
  .option("--show-thinking", "Show model thinking/reasoning blocks")
  .option("--no-stream", "Disable streaming output")
  .addOption(new Option("--no-streaming", "Alias for --no-stream").hideHelp())
  .addHelpText(
    "before",
    () => `${formatRequiresHelpText(getPerplexityApiKey())}\n`,
  )
  .addHelpText("after", usageExamples)
  .action(async (prompt, options) => {
    try {
      let stdinText: string | undefined;
      if (!prompt && !process.stdin.isTTY) {
        process.stdin.setEncoding("utf8");
        stdinText = await collectStdinText(
          process.stdin as AsyncIterable<string>,
        );
      }

      const effectivePrompt = resolveCliPrompt(prompt, stdinText);
      if (!effectivePrompt) {
        program.error(
          "Missing prompt.\n" +
            'Usage: askpplx <prompt> OR cat <file> | askpplx -S "Summarize this article"\n' +
            "(Note: use -S to provide an instruction with stdin input)",
          { exitCode: 1 },
        );
        return;
      }

      const cliOptions: CliOptions = {
        model: options.model,
        json: Boolean(options.json),
        system: options.system,
        systemText: options.systemText,
        context: options.context as SearchContextSize | undefined,
        showThinking: Boolean(options.showThinking),
        stream: options.stream && options.streaming,
      };

      await runCli(effectivePrompt, cliOptions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error(`Error: ${message}`);
      // eslint-disable-next-line require-atomic-updates -- False positive: no race condition in catch block
      process.exitCode = 1;
    }
  });

const configCommand = program
  .command("config")
  .description("Manage stored configuration")
  .option("--set-api-key <key>", "Store Perplexity API key")
  .option("--show-api-key", "Show stored API key (masked)")
  .option("--clear-api-key", "Remove stored API key")
  .option("--path", "Show config file path")
  .action(
    (options: {
      setApiKey?: string;
      showApiKey?: boolean;
      clearApiKey?: boolean;
      path?: boolean;
    }) => {
      try {
        if (options.setApiKey) {
          setPerplexityApiKey(options.setApiKey);
          console.error("API key stored successfully.");
        } else if (options.showApiKey) {
          const key = getPerplexityApiKey();
          const masked = maskApiKey(key);
          console.log(masked ? `API key: ${masked}` : "No API key configured.");
        } else if (options.clearApiKey) {
          clearPerplexityApiKey();
          console.error("API key cleared.");
        } else if (options.path) {
          console.log(getConfigPath());
        } else {
          configCommand.help({ error: true });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        console.error(`Error: ${message}`);
        process.exitCode = 1;
      }
    },
  );

await program.parseAsync();
