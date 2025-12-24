import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Onboarding tour router
 * Manages user onboarding tour state
 */
export const onboardingRouter = router({
  /**
   * Get onboarding status for current user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const user = await db
      .select({
        onboardingCompleted: users.onboardingCompleted,
        onboardingCompletedAt: users.onboardingCompletedAt,
        onboardingSkipped: users.onboardingSkipped,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.length) {
      return {
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        onboardingSkipped: false,
        shouldShowTour: true,
      };
    }

    return {
      ...user[0],
      shouldShowTour: !user[0].onboardingCompleted && !user[0].onboardingSkipped,
    };
  }),

  /**
   * Mark onboarding as completed
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  /**
   * Mark onboarding as skipped
   */
  skipOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    await db
      .update(users)
      .set({
        onboardingSkipped: true,
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  /**
   * Reset onboarding (allow user to restart tour)
   */
  resetOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    await db
      .update(users)
      .set({
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        onboardingSkipped: false,
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),
});
