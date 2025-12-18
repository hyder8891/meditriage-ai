import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Arabic Localization", () => {
  it("should respond in pure Arabic with no English words", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const response = await caller.triage.chatDeepSeek({
      messages: [
        { role: "user", content: "أعاني من صداع شديد منذ يومين" }
      ],
      language: "ar"
    });

    // Check that response contains Arabic text
    expect(response.content).toMatch(/[\u0600-\u06FF]/); // Arabic Unicode range
    
    // Check that response does NOT contain common English words (except OPTIONS keyword which may appear)
    const englishWords = ['Hello', 'Option 1', 'Option 2', 'Option 3', 'Yes', 'No', 'Unsure', 'Mild', 'Severe'];
    for (const word of englishWords) {
      expect(response.content).not.toContain(word);
    }

    console.log("Arabic Response:", response.content);
  }, 15000);

  it("should provide contextual short Arabic options", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const response = await caller.triage.chatDeepSeek({
      messages: [
        { role: "user", content: "أشعر بألم في البطن" }
      ],
      language: "ar"
    });

    // Check that response contains options in Arabic format
    const hasArabicOptions = response.content.includes('[خيارات:') || response.content.includes('[OPTIONS:');
    expect(hasArabicOptions).toBe(true);
    
    // Extract options if present
    const optionsMatch = response.content.match(/\[(.*?)\]/);
    if (optionsMatch) {
      const optionsText = optionsMatch[1];
      console.log("Extracted options:", optionsText);
      
      // Options should be in Arabic
      expect(optionsText).toMatch(/[\u0600-\u06FF]/);
      
      // Options should not contain "Option 1, Option 2" pattern
      expect(optionsText).not.toMatch(/Option \d/);
    }

    console.log("Full Response:", response.content);
  }, 15000);

  it("should maintain Arabic throughout conversation", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First message
    const response1 = await caller.triage.chatDeepSeek({
      messages: [
        { role: "user", content: "لدي حمى" }
      ],
      language: "ar"
    });

    expect(response1.content).toMatch(/[\u0600-\u06FF]/);
    expect(response1.content).not.toContain("Hello");

    // Follow-up message
    const response2 = await caller.triage.chatDeepSeek({
      messages: [
        { role: "user", content: "لدي حمى" },
        { role: "assistant", content: response1.content },
        { role: "user", content: "نعم منذ ثلاثة أيام" }
      ],
      language: "ar"
    });

    expect(response2.content).toMatch(/[\u0600-\u06FF]/);
    expect(response2.content).not.toContain("Hello");
    expect(response2.content).not.toMatch(/Option \d/);

    console.log("Conversation Response 2:", response2.content);
  }, 20000);
});
