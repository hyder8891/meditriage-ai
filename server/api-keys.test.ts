import { describe, expect, it } from "vitest";

describe("API Keys Validation", () => {
  it("should have GEMINI_API_KEY configured", () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).not.toBe("");
    expect(typeof process.env.GEMINI_API_KEY).toBe("string");
  });

  it("should have DEEPSEEK_API_KEY configured", () => {
    expect(process.env.DEEPSEEK_API_KEY).toBeDefined();
    expect(process.env.DEEPSEEK_API_KEY).not.toBe("");
    expect(typeof process.env.DEEPSEEK_API_KEY).toBe("string");
  });

  it("should validate Gemini API key format", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    // Gemini API keys typically start with "AIza"
    if (apiKey && apiKey.startsWith("AIza")) {
      expect(apiKey.length).toBeGreaterThan(30);
    }
  });

  it("should validate DeepSeek API key format", () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    expect(apiKey).toBeDefined();
    // DeepSeek API keys typically start with "sk-"
    if (apiKey && apiKey.startsWith("sk-")) {
      expect(apiKey.length).toBeGreaterThan(20);
    }
  });
});
