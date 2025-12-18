import { describe, it, expect } from 'vitest';

describe('Gemini API Key Validation', () => {
  it('should have GEMINI_API_KEY configured', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).not.toBe('');
  });

  it('should successfully call Gemini API with valid key', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Simple test request to validate API key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Say hello in one word' },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.candidates).toBeDefined();
    expect(data.candidates.length).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call
});
