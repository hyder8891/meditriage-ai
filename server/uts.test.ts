import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("UTS API Key Validation", () => {
  it("should successfully authenticate with UTS API", async () => {
    const apiKey = ENV.utsApiKey;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();

    // Test authentication by fetching a simple concept
    // Using the CUI (Concept Unique Identifier) for "Aspirin" as a test
    const testCUI = "C0004057";
    const response = await fetch(
      `https://uts-ws.nlm.nih.gov/rest/content/current/CUI/${testCUI}?apiKey=${apiKey}`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    // Verify we got valid data back
    expect(data).toBeDefined();
    expect(data.result).toBeDefined();
    expect(data.result.ui).toBe(testCUI);
    expect(data.result.name).toBeTruthy();
  }, 10000); // 10 second timeout for API call
});
