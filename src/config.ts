import Conf from "conf";

import packageJson from "../package.json" with { type: "json" };

interface ConfigSchema {
  perplexityApiKey: string;
}

const schema = {
  perplexityApiKey: {
    type: "string" as const,
  },
} as const;

let configInstance: Conf<ConfigSchema> | undefined;

function getConfig(): Conf<ConfigSchema> {
  if (!configInstance) {
    configInstance = new Conf<ConfigSchema>({
      projectName: packageJson.name,
      projectVersion: packageJson.version,
      projectSuffix: "",
      schema,
    });
  }
  return configInstance;
}

/**
 * Get API key: env var takes precedence over stored config.
 * Note: An empty PERPLEXITY_API_KEY="" explicitly disables stored config.
 */
export function getPerplexityApiKey(): string | undefined {
  return (
    process.env["PERPLEXITY_API_KEY"] ?? getConfig().get("perplexityApiKey")
  );
}

/** Store API key in persistent config. */
export function setPerplexityApiKey(apiKey: string): void {
  getConfig().set("perplexityApiKey", apiKey);
}

/** Remove stored API key from config. */
export function clearPerplexityApiKey(): void {
  getConfig().delete("perplexityApiKey");
}

/** Get path to config file. */
export function getConfigPath(): string {
  return getConfig().path;
}

/**
 * Mask API key for display: shows first 4 and last 4 characters for keys longer than 16 chars.
 * For keys of length 16 or less, returns "****".
 * Returns undefined if key is undefined or empty.
 */
export function maskApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 16) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
