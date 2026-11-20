import { describe, expect, it } from "vitest";

import { resolveCliPrompt } from "./resolve-cli-prompt.js";

const noStdin = async (): Promise<string | undefined> => undefined;
const unreadableStdin = async (): Promise<string | undefined> => {
  throw new Error("stdin must not be read");
};

describe("resolveCliPrompt", () => {
  it("prefers prompt argument over stdin", async () => {
    await expect(resolveCliPrompt("arg prompt", unreadableStdin)).resolves.toBe("arg prompt");
  });

  it("uses stdin text when prompt argument is missing", async () => {
    await expect(resolveCliPrompt(undefined, async () => "stdin prompt\n")).resolves.toBe(
      "stdin prompt",
    );
  });

  it("returns undefined for whitespace-only prompt", async () => {
    await expect(resolveCliPrompt("   ", noStdin)).resolves.toBeUndefined();
  });

  it("treats an empty argument as a missing prompt without reading stdin", async () => {
    await expect(resolveCliPrompt("", unreadableStdin)).resolves.toBeUndefined();
  });

  it("preserves leading whitespace when meaningful", async () => {
    await expect(resolveCliPrompt("  hi", noStdin)).resolves.toBe("  hi");
  });
});
