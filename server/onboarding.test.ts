import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Onboarding Tour API", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        name: "Test User",
        email: `test-onboarding-${Date.now()}@example.com`,
        role: "patient",
      })
      .$returningId();

    testUserId = user.id;

    // Create tRPC caller with test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        name: "Test User",
        email: `test-onboarding-${Date.now()}@example.com`,
        role: "patient",
      },
    });
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (db && testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should get initial onboarding status for new user", async () => {
    const status = await caller.onboarding.getStatus();

    expect(status).toBeDefined();
    expect(status.onboardingCompleted).toBe(false);
    expect(status.onboardingSkipped).toBe(false);
    expect(status.shouldShowTour).toBe(true);
    expect(status.onboardingCompletedAt).toBeNull();
  });

  it("should mark onboarding as completed", async () => {
    const result = await caller.onboarding.completeOnboarding();
    expect(result.success).toBe(true);

    const status = await caller.onboarding.getStatus();
    expect(status.onboardingCompleted).toBe(true);
    expect(status.shouldShowTour).toBe(false);
    expect(status.onboardingCompletedAt).toBeDefined();
  });

  it("should mark onboarding as skipped", async () => {
    // Reset first
    await caller.onboarding.resetOnboarding();

    const result = await caller.onboarding.skipOnboarding();
    expect(result.success).toBe(true);

    const status = await caller.onboarding.getStatus();
    expect(status.onboardingSkipped).toBe(true);
    expect(status.shouldShowTour).toBe(false);
  });

  it("should reset onboarding status", async () => {
    // First complete it
    await caller.onboarding.completeOnboarding();

    // Then reset
    const result = await caller.onboarding.resetOnboarding();
    expect(result.success).toBe(true);

    const status = await caller.onboarding.getStatus();
    expect(status.onboardingCompleted).toBe(false);
    expect(status.onboardingSkipped).toBe(false);
    expect(status.shouldShowTour).toBe(true);
    expect(status.onboardingCompletedAt).toBeNull();
  });

  it("should not show tour if already completed", async () => {
    await caller.onboarding.completeOnboarding();

    const status = await caller.onboarding.getStatus();
    expect(status.shouldShowTour).toBe(false);
  });

  it("should not show tour if skipped", async () => {
    await caller.onboarding.resetOnboarding();
    await caller.onboarding.skipOnboarding();

    const status = await caller.onboarding.getStatus();
    expect(status.shouldShowTour).toBe(false);
  });

  it("should handle multiple resets correctly", async () => {
    // Complete
    await caller.onboarding.completeOnboarding();
    let status = await caller.onboarding.getStatus();
    expect(status.onboardingCompleted).toBe(true);

    // Reset
    await caller.onboarding.resetOnboarding();
    status = await caller.onboarding.getStatus();
    expect(status.onboardingCompleted).toBe(false);
    expect(status.shouldShowTour).toBe(true);

    // Skip
    await caller.onboarding.skipOnboarding();
    status = await caller.onboarding.getStatus();
    expect(status.onboardingSkipped).toBe(true);
    expect(status.shouldShowTour).toBe(false);

    // Reset again
    await caller.onboarding.resetOnboarding();
    status = await caller.onboarding.getStatus();
    expect(status.onboardingCompleted).toBe(false);
    expect(status.onboardingSkipped).toBe(false);
    expect(status.shouldShowTour).toBe(true);
  });
});
