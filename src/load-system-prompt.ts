import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
      throw new Error(`System prompt file not found: ${promptPath}`);
    }
    if (code === "EACCES") {
      throw new Error(`Permission denied reading system prompt: ${promptPath}`);
    }
    throw new Error(`Failed to read system prompt file: ${promptPath}`);
  }
}
