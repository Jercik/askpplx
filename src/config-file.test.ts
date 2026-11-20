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

test("stores the API key in a file only its owner can read", () => {
  homeDirectory = mkdtempSync(path.join(tmpdir(), "askpplx-home-"));
  const configModuleUrl = new URL("config.ts", import.meta.url).href;
  const script = `
    process.umask(0o022);
    const { setPerplexityApiKey, getConfigPath } = await import(${JSON.stringify(configModuleUrl)});
    setPerplexityApiKey("pplx-test-key-0123456789");
    process.stdout.write(getConfigPath());
  `;

  const configPath = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: homeDirectory,
      XDG_CONFIG_HOME: path.join(homeDirectory, ".config"),
    },
  });

  expect(statSync(configPath).mode.toString(8)).toBe("100600");
});
