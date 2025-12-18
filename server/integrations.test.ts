import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'user' | 'admin' = 'user'): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-integration",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("DeepSeek Integration", () => {
  it("should process chat with DeepSeek backend", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.chatDeepSeek({
      messages: [
        { role: 'user', content: 'I have a headache and fever' },
      ],
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(typeof result.content).toBe('string');
    expect(result.usage).toBeDefined();
  }, 15000);

  it("should support Arabic with DeepSeek", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.chatDeepSeek({
      messages: [
        { role: 'user', content: 'أعاني من صداع وحمى' },
      ],
      language: 'ar',
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  }, 15000);
});

describe("Gemini X-Ray Analysis", () => {
  it.skip("should analyze X-ray image (mock base64)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Simple 1x1 pixel PNG base64
    const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.imaging.analyzeXRay({
      imageBase64: mockImageBase64,
      mimeType: "image/png",
      clinicalContext: "Patient with chest pain",
      language: "en",
    });

    expect(result).toBeDefined();
    expect(result.findings).toBeDefined();
    expect(typeof result.findings).toBe('string');
  }, 20000);
});

describe("Training Data Storage", () => {
  it("should store training material (admin only)", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.training.addMaterial({
      title: "Test Medical Article",
      category: "cardiology",
      source: "Test Source",
      content: "This is a test medical article about cardiac conditions.",
    });

    expect(result.success).toBe(true);
  }, 20000);

  it("should reject non-admin from adding training material", async () => {
    const { ctx } = createAuthContext('user');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.training.addMaterial({
        title: "Test",
        category: "test",
        source: "test",
        content: "test",
      })
    ).rejects.toThrow('Unauthorized');
  });

  it("should retrieve all training materials (admin only)", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.training.getAllMaterials();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should retrieve all training data (admin only)", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.training.getAllTriageData();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Cloud Storage Integration", () => {
  it("should save triage with cloud storage references", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.save({
      language: 'en',
      conversationHistory: JSON.stringify([
        { role: 'user', content: 'Test question' },
        { role: 'assistant', content: 'Test answer' },
      ]),
      urgencyLevel: 'NON-URGENT',
      chiefComplaint: 'Test complaint',
      symptoms: ['symptom1', 'symptom2'],
      assessment: 'Test assessment',
      recommendations: 'Test recommendations',
      redFlags: [],
      duration: 120,
      messageCount: 2,
      attachedFiles: ['https://s3.example.com/file1.pdf'],
      xrayImages: ['https://s3.example.com/xray1.jpg'],
    });

    expect(result.success).toBe(true);
    expect(result.triageId).toBeDefined();
  });
});
