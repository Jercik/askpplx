import { describe, expect, it } from "vitest";

import { collectStdinText } from "./collect-stdin-text.js";

function chunks(parts: string[]): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        next(): Promise<IteratorResult<string>> {
          if (index >= parts.length) {
            return Promise.resolve({ done: true, value: undefined });
          }
          const value = parts[index];
          if (value === undefined) {
            return Promise.resolve({ done: true, value: undefined });
          }
          index += 1;
          return Promise.resolve({ done: false, value });
        },
      };
    },
  };
}

describe("collectStdinText", () => {
  it("concatenates all chunks", async () => {
    const text = await collectStdinText(chunks(["hello ", "world"]));
    expect(text).toBe("hello world");
  });

  it("returns empty string for empty input", async () => {
    const text = await collectStdinText(chunks([]));
    expect(text).toBe("");
  });

  it("allows input exactly at maxBytes", async () => {
    const text = await collectStdinText(chunks(["hi"]), 2);
    expect(text).toBe("hi");
  });

  it("throws when input exceeds maxBytes", async () => {
    await expect(collectStdinText(chunks(["hello"]), 4)).rejects.toThrow(
      "Input too large",
    );
  });
});
