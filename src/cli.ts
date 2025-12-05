#!/usr/bin/env node

import { Command } from "commander";

import packageJson from "../package.json" with { type: "json" };
import {
  clearPerplexityApiKey,
  getConfigPath,
  getPerplexityApiKey,
  maskApiKey,
  setPerplexityApiKey,
} from "./config.js";
import type { CliOptions } from "./run-cli.js";
import { runCli } from "./run-cli.js";

const usageExamples = `
Models:
  sonar               Fast, lightweight for quick searches (128K context)
  sonar-pro           Advanced multi-step research queries
  sonar-reasoning-pro Deep reasoning with R1-1776 backend (default)

JSON output (--json):
  Returns { text, sources[], usage, providerMetadata } - not structured AI output.
  Use jq to extract fields: --json | jq -r '.text' or '.sources[].url'

System prompt:
  Default prompt is optimized for technical/coding questions.
  Use -s <file> or -S <text> to customize. Use -S "" to disable.

Examples:
  askpplx "What is the capital of France?" -S ""
  askpplx "Explain quantum computing" --model sonar-pro
  askpplx "Latest news on AI" -c medium
  askpplx "$(cat article.txt)" -s ./summarize.md
  askpplx "$(cat article.txt)" -S "Summarize this article"
  askpplx "Node.js LTS version" --json | jq -r '.text'
  askpplx "Show reasoning" --show-thinking`;

const program = new Command()
  .name("askpplx")
  .description(packageJson.description)
  .version(packageJson.version)
  .argument("[prompt]", "The prompt to send to Perplexity Sonar")
  .option("-m, --model <model>", "Model to use", "sonar-reasoning-pro")
  .option("-s, --system <path>", "Path to custom system prompt file")
  .option("-S, --system-text <text>", "System prompt text (overrides -s)")
  .option(
    "-c, --context <size>",
    "Search context size: low, medium, high",
    "high",
  )
  .option("--json", "Output full API response as JSON (text, sources, usage)")
  .option("--show-thinking", "Show model thinking/reasoning blocks")
  .option("--no-stream, --no-streaming", "Disable streaming output")
  .addHelpText("after", usageExamples)
  .action(async (prompt: string | undefined, options: CliOptions) => {
    if (!prompt) {
      program.help();
      return;
    }
    try {
      await runCli(prompt, options);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error(`Error: ${message}`);
      process.exitCode = 1;
    }
  });

program
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
          console.log("API key stored successfully.");
        } else if (options.showApiKey) {
          const key = getPerplexityApiKey();
          const masked = maskApiKey(key);
          console.log(masked ? `API key: ${masked}` : "No API key configured.");
        } else if (options.clearApiKey) {
          clearPerplexityApiKey();
          console.log("API key cleared.");
        } else if (options.path) {
          console.log(getConfigPath());
        } else {
          const configCmd = program.commands.find((c) => c.name() === "config");
          configCmd?.help();
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

program.parse();
