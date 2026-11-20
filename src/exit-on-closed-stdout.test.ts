import { spawn } from "node:child_process";

import { describe, expect, it } from "vitest";

const moduleUrl = new URL("exit-on-closed-stdout.ts", import.meta.url).href;

const writeUntilReaderCloses = `
import { exitOnClosedStdout } from ${JSON.stringify(moduleUrl)};
exitOnClosedStdout();
const writeLine = (error) => {
  if (!error) process.stdout.write("answer line\\n", writeLine);
};
writeLine();
`;

describe("exitOnClosedStdout", () => {
  it("exits with status 0 and nothing on stderr when the stdout reader closes", async () => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", writeUntilReaderCloses], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdout.once("data", () => {
      child.stdout.destroy();
    });

    const code = await new Promise<number | null>((resolve) => {
      child.on("close", resolve);
    });

    expect({ code, stderr }).toStrictEqual({ code: 0, stderr: "" });
  });
});
