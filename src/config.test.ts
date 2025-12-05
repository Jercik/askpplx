import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  clearPerplexityApiKey,
  getConfigPath,
  getPerplexityApiKey,
  maskApiKey,
  setPerplexityApiKey,
} from "./config.js";

describe("config", () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnvironment };
    delete process.env["PERPLEXITY_API_KEY"];
  });

  afterEach(() => {
    process.env = originalEnvironment;
  });

  describe("getPerplexityApiKey", () => {
    it("returns env var when set", () => {
      process.env["PERPLEXITY_API_KEY"] = "env-key";
      getMock.mockReturnValue("stored-key");

      expect(getPerplexityApiKey()).toBe("env-key");
    });

    it("returns stored key when env var is not set", () => {
      getMock.mockReturnValue("stored-key");

      expect(getPerplexityApiKey()).toBe("stored-key");
      expect(getMock).toHaveBeenCalledWith("perplexityApiKey");
    });

    it("env var takes precedence over stored key", () => {
      process.env["PERPLEXITY_API_KEY"] = "env-key";
      getMock.mockReturnValue("stored-key");

      expect(getPerplexityApiKey()).toBe("env-key");
      expect(getMock).not.toHaveBeenCalled();
    });

    it("returns undefined when neither env var nor stored key exists", () => {
      expect(getPerplexityApiKey()).toBeUndefined();
    });

    it("empty env var takes precedence (explicit override)", () => {
      // This tests the ?? behavior: empty string is not nullish,
      // so it's treated as an explicit "use this value" override
      process.env["PERPLEXITY_API_KEY"] = "";
      getMock.mockReturnValue("stored-key");

      expect(getPerplexityApiKey()).toBe("");
    });
  });

  describe("setPerplexityApiKey", () => {
    it("stores API key in config", () => {
      setPerplexityApiKey("new-key");

      expect(setMock).toHaveBeenCalledWith("perplexityApiKey", "new-key");
    });
  });

  describe("clearPerplexityApiKey", () => {
    it("removes API key from config", () => {
      clearPerplexityApiKey();

      expect(deleteMock).toHaveBeenCalledWith("perplexityApiKey");
    });
  });

  describe("getConfigPath", () => {
    it("returns config file path", () => {
      expect(getConfigPath()).toBe("/mock/path/config.json");
    });
  });

  describe("maskApiKey", () => {
    it("returns undefined for undefined input", () => {
      expect(maskApiKey()).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(maskApiKey("")).toBeUndefined();
    });

    it("returns **** for short keys (12 chars or less)", () => {
      expect(maskApiKey("short")).toBe("****");
      expect(maskApiKey("123456789012")).toBe("****");
    });

    it("masks long keys showing first 4 and last 4", () => {
      expect(maskApiKey("pplx-1234567890abcdef")).toBe("pplx...cdef");
    });
  });
});
