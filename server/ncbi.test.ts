import { describe, it, expect } from "vitest";
import { validateNCBIApiKey, searchPubMed } from "./ncbi.js";

describe("NCBI E-utilities Integration", () => {
  it("should validate NCBI API key", async () => {
    const isValid = await validateNCBIApiKey();
    expect(isValid).toBe(true);
  }, 10000); // 10 second timeout for API call

  it("should search PubMed for articles", async () => {
    const result = await searchPubMed("diabetes", 5);
    
    expect(result).toBeDefined();
    expect(result.count).toBeDefined();
    expect(parseInt(result.count)).toBeGreaterThan(0);
    expect(result.idlist).toBeDefined();
    expect(Array.isArray(result.idlist)).toBe(true);
  }, 10000);
});
