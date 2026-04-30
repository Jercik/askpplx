import { describe, expect, it, vi } from "vitest";
import {
  clearPerplexityApiKey,
  getConfigPath,
  getPerplexityApiKey,
  maskApiKey,
  setPerplexityApiKey,
} from "./config.js";

// Mock conf before importing config.ts (lazy singleton instantiates on first use)
const { getMock, setMock, deleteMock, pathMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  deleteMock: vi.fn(),
  pathMock: "/mock/path/config.json",
}));

vi.mock("conf", () => ({
  default: class MockConfig {
    get = getMock;
    set = setMock;
    delete = deleteMock;
    path = pathMock;
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
    it("returns env var when set", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        process.env.PERPLEXITY_API_KEY = "env-key";
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("env-key");
      });
    });

    it("returns stored key when env var is not set", () => {
      expect.assertions(2);

      withCleanConfigState(() => {
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("stored-key");
        expect(getMock).toHaveBeenCalledWith("perplexityApiKey");
      });
    });

    it("env var takes precedence over stored key", () => {
      expect.assertions(2);

      withCleanConfigState(() => {
        process.env.PERPLEXITY_API_KEY = "env-key";
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("env-key");
        expect(getMock).not.toHaveBeenCalled();
      });
    });

    it("returns undefined when neither env var nor stored key exists", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        expect(getPerplexityApiKey()).toBeUndefined();
      });
    });

    it("empty env var takes precedence (explicit override)", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        process.env.PERPLEXITY_API_KEY = "";
        getMock.mockReturnValue("stored-key");

        expect(getPerplexityApiKey()).toBe("");
      });
    });
  });

  describe("setPerplexityApiKey", () => {
    it("stores API key in config", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        setPerplexityApiKey("new-key");

        expect(setMock).toHaveBeenCalledWith("perplexityApiKey", "new-key");
      });
    });
  });

  describe("clearPerplexityApiKey", () => {
    it("removes API key from config", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        clearPerplexityApiKey();

        expect(deleteMock).toHaveBeenCalledWith("perplexityApiKey");
      });
    });
  });

  describe("getConfigPath", () => {
    it("returns config file path", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        expect(getConfigPath()).toBe("/mock/path/config.json");
      });
    });
  });

  describe("maskApiKey", () => {
    it("returns undefined for undefined input", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        expect(maskApiKey()).toBeUndefined();
      });
    });

    it("returns undefined for empty string", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        expect(maskApiKey("")).toBeUndefined();
      });
    });

    it("returns **** for short keys (16 chars or less)", () => {
      expect.assertions(2);

      withCleanConfigState(() => {
        expect(maskApiKey("short")).toBe("****");
        expect(maskApiKey("1234567890123456")).toBe("****");
      });
    });

    it("masks long keys showing first 4 and last 4", () => {
      expect.assertions(1);

      withCleanConfigState(() => {
        expect(maskApiKey("pplx-1234567890abcdef")).toBe("pplx...cdef");
      });
    });
  });
});
