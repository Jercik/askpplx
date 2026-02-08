function getApiKeySuffix(apiKey: string): string {
  return apiKey.slice(-4);
}

export function formatRequiresHelpText(apiKey?: string): string {
  if (!apiKey) {
    return (
      "Requires:\n" +
      "  - PERPLEXITY_API_KEY - MISSING! Set PERPLEXITY_API_KEY=<token> " +
      "or run: askpplx config --set-api-key <token>"
    );
  }

  return `Requires: PERPLEXITY_API_KEY (configured: last4=${getApiKeySuffix(apiKey)})`;
}
