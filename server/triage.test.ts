import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'user' | 'admin' = 'user'): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
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

describe("triage.chat", () => {
  it("should accept chat messages and return AI response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.chat({
      messages: [
        { role: 'user', content: 'I have a headache' },
      ],
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(typeof result.content).toBe('string');
  });

  it("should support Arabic language", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.chat({
      messages: [
        { role: 'user', content: 'أعاني من صداع' },
      ],
      language: 'ar',
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });
});

describe("triage.generateAdvice", () => {
  it("should generate structured medical advice", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversationHistory = JSON.stringify([
      { role: 'user', content: 'I have a severe headache with blurred vision' },
      { role: 'assistant', content: 'How long have you had these symptoms?' },
      { role: 'user', content: 'For about 3 hours' },
    ]);

    const result = await caller.triage.generateAdvice({
      conversationHistory,
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.urgencyLevel).toBeDefined();
    expect(['EMERGENCY', 'URGENT', 'SEMI-URGENT', 'NON-URGENT', 'ROUTINE']).toContain(result.urgencyLevel);
    expect(result.chiefComplaint).toBeDefined();
    expect(Array.isArray(result.symptoms)).toBe(true);
    expect(result.assessment).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.redFlags)).toBe(true);
    expect(result.disclaimer).toBeDefined();
  }, 15000);
});

describe("triage.save", () => {
  it("should save triage record successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.save({
      language: 'en',
      conversationHistory: JSON.stringify([]),
      urgencyLevel: 'SEMI-URGENT',
      chiefComplaint: 'Headache with visual disturbances',
      symptoms: ['Headache', 'Blurred vision', 'Nausea'],
      assessment: 'Possible migraine',
      recommendations: 'Seek medical attention within 24 hours',
      redFlags: ['Sudden severe headache', 'Loss of consciousness'],
      duration: 300,
      messageCount: 8,
    });

    expect(result.success).toBe(true);
  });
});

describe("triage.history", () => {
  it("should retrieve user triage history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.history();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("triage.adminGetAll", () => {
  it("should allow admin to view all records", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.triage.adminGetAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-admin access", async () => {
    const { ctx } = createAuthContext('user');
    const caller = appRouter.createCaller(ctx);

    await expect(caller.triage.adminGetAll()).rejects.toThrow('Unauthorized');
  });
});

describe("auth.me", () => {
  it("should return current user info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("user");
  });
});
