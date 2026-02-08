import { describe, expect, it } from "vitest";

import { formatRequiresHelpText } from "./format-requires-help-text.js";

describe("formatRequiresHelpText", () => {
  it("shows a missing-key guidance block when key is undefined", () => {
    expect(formatRequiresHelpText()).toBe(
      "Requires:\n" +
        "  - PERPLEXITY_API_KEY - MISSING! Set PERPLEXITY_API_KEY=<token> " +
        "or run: askpplx config --set-api-key <token>",
    );
  });

  it("shows last 4 characters when key is configured", () => {
    expect(formatRequiresHelpText("pplx-abcdefgh1234")).toBe(
      "Requires: PERPLEXITY_API_KEY (configured: last4=1234)",
    );
  });
});
