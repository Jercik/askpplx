import { maskApiKey } from "./config.js";

export function formatRequiresHelpText(apiKey?: string): string {
  const maskedApiKey = maskApiKey(apiKey);
  if (!maskedApiKey) {
    return (
      "Requires:\n" +
      "  - PERPLEXITY_API_KEY - MISSING! Set PERPLEXITY_API_KEY=<token> " +
      "or run: askpplx config --set-api-key <token>"
    );
  }

  return `Requires: PERPLEXITY_API_KEY (configured: ${maskedApiKey})`;
}
