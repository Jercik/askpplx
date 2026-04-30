import { describe, expect, it } from "vitest";

import { resolveCliPrompt } from "./resolve-cli-prompt.js";

describe("resolveCliPrompt", () => {
  it("prefers prompt argument over stdin", () => {
    expect.assertions(1);

    expect(resolveCliPrompt("arg prompt", "stdin prompt")).toBe("arg prompt");
  });

  it("uses stdin text when prompt argument is missing", () => {
    expect.assertions(1);

    expect(resolveCliPrompt(undefined, "stdin prompt\n")).toBe("stdin prompt");
  });

  it("returns undefined for whitespace-only prompt", () => {
    expect.assertions(1);

    expect(resolveCliPrompt("   ")).toBeUndefined();
  });

  it("preserves leading whitespace when meaningful", () => {
    expect.assertions(1);

    expect(resolveCliPrompt("  hi")).toBe("  hi");
  });
});
