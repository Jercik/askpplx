import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";

let homeDirectory: string | undefined;

afterEach(() => {
  if (homeDirectory !== undefined) {
    rmSync(homeDirectory, { recursive: true, force: true });
    homeDirectory = undefined;
  }
});

const configModuleUrl = new URL("config.ts", import.meta.url).href;

function runWithFreshHome(script: string, env: NodeJS.ProcessEnv = {}): string {
  homeDirectory = mkdtempSync(path.join(tmpdir(), "askpplx-home-"));
  return execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
      HOME: homeDirectory,
      XDG_CONFIG_HOME: path.join(homeDirectory, ".config"),
    },
  });
}

test("stores the API key in a file only its owner can read", () => {
  const configPath = runWithFreshHome(`
    process.umask(0o022);
    const { setPerplexityApiKey, getConfigPath } = await import(${JSON.stringify(configModuleUrl)});
    setPerplexityApiKey("pplx-test-key-0123456789");
    process.stdout.write(getConfigPath());
  `);

  expect(statSync(configPath).mode.toString(8)).toBe("100600");
});

test("reads the stored API key even when PERPLEXITY_API_KEY is set", () => {
  const storedKey = runWithFreshHome(
    `
    const { setPerplexityApiKey, getStoredPerplexityApiKey } = await import(${JSON.stringify(configModuleUrl)});
    setPerplexityApiKey("pplx-stored-key-0123456789");
    process.stdout.write(getStoredPerplexityApiKey());
  `,
    { PERPLEXITY_API_KEY: "pplx-env-key-0123456789" },
  );

  expect(storedKey).toBe("pplx-stored-key-0123456789");
});

test("clearing the API key leaves no stored key", () => {
  const storedKey = runWithFreshHome(`
    const { setPerplexityApiKey, clearPerplexityApiKey, getStoredPerplexityApiKey } = await import(${JSON.stringify(configModuleUrl)});
    setPerplexityApiKey("pplx-stored-key-0123456789");
    clearPerplexityApiKey();
    process.stdout.write(String(getStoredPerplexityApiKey()));
  `);

  expect(storedKey).toBe("undefined");
});
