import { describe, expect, it, vi } from "vitest";
import { getPerplexityApiKey, maskApiKey } from "./config.js";

// Mock conf before importing config.ts (lazy singleton instantiates on first use)
const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("conf", () => ({
  default: class MockConfig {
    get = getMock;
  },
}));

const originalApiKey = process.env.PERPLEXITY_API_KEY;

function withCleanConfigState(run: () => void): void {
  vi.resetAllMocks();
  delete process.env.PERPLEXITY_API_KEY;

  try {
    run();
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.PERPLEXITY_API_KEY;
    } else {
      process.env.PERPLEXITY_API_KEY = originalApiKey;
    }
  }
}

describe("config", () => {
  describe("getPerplexityApiKey", () => {
    it("returns stored key when env var is not set", () => {
      withCleanConfigState(() => {
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("stored-key");
        expect(getMock).toHaveBeenCalledWith("perplexityApiKey");
      });
    });

    it("env var takes precedence over stored key", () => {
      withCleanConfigState(() => {
        process.env.PERPLEXITY_API_KEY = "env-key";
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("env-key");
        expect(getMock).not.toHaveBeenCalled();
      });
    });

    it("returns undefined when neither env var nor stored key exists", () => {
      withCleanConfigState(() => {
        expect(getPerplexityApiKey()).toBeUndefined();
      });
    });

    it("empty env var takes precedence (explicit override)", () => {
      withCleanConfigState(() => {
        process.env.PERPLEXITY_API_KEY = "";
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("");
      });
    });
  });

  describe("maskApiKey", () => {
    it("returns undefined for undefined input", () => {
      withCleanConfigState(() => {
        expect(maskApiKey()).toBeUndefined();
      });
    });

    it("returns undefined for empty string", () => {
      withCleanConfigState(() => {
        expect(maskApiKey("")).toBeUndefined();
      });
    });

    it("returns **** for short keys (16 chars or less)", () => {
      withCleanConfigState(() => {
        expect(maskApiKey("short")).toBe("****");
        expect(maskApiKey("1234567890123456")).toBe("****");
      });
    });

    it("masks long keys showing first 4 and last 4", () => {
      withCleanConfigState(() => {
        expect(maskApiKey("pplx-1234567890abcdef")).toBe("pplx...cdef");
      });
    });
  });
});
