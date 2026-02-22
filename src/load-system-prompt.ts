import { readFile } from "node:fs/promises";
import path from "node:path";

const __dirname = import.meta.dirname;
const DEFAULT_SYSTEM_PROMPT_PATH = path.join(
  __dirname,
  "prompts",
  "default-system.md",
);

export async function loadSystemPrompt(customPath?: string): Promise<string> {
  const promptPath = customPath ?? DEFAULT_SYSTEM_PROMPT_PATH;
  try {
    const content = await readFile(promptPath, "utf8");
    return content.trim();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`System prompt file not found: ${promptPath}`, {
        cause: error,
      });
    }
    if (code === "EACCES") {
      throw new Error(
        `Permission denied reading system prompt: ${promptPath}`,
        {
          cause: error,
        },
      );
    }
    throw new Error(`Failed to read system prompt file: ${promptPath}`, {
      cause: error,
    });
  }
}
