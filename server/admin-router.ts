import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { users, triageRecords, consultations } from "../drizzle/schema";
import { eq, gte, count, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Get all users
  getAllUsers: adminProcedure.query(async () => {
    const db = await getDb();
    return await db!.select().from(users);
  }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const db = await getDb();
    
    // Total users
    const [totalUsersResult] = await db!.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult.count;

    // New users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const [newUsersResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, firstDayOfMonth));
    const newUsersThisMonth = newUsersResult.count;

    // Verified clinicians
    const [verifiedCliniciansResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'clinician'), eq(users.verified, true)));
    const verifiedClinicians = verifiedCliniciansResult.count;

    // Pending clinicians
    const [pendingCliniciansResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'clinician'), eq(users.verified, false)));
    const pendingClinicians = pendingCliniciansResult.count;

    // Total triage sessions
    const [totalTriageResult] = await db!.select({ count: count() }).from(triageRecords);
    const totalTriageSessions = totalTriageResult.count;

    // Triage sessions today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const [triageTodayResult] = await db!
      .select({ count: count() })
      .from(triageRecords)
      .where(gte(triageRecords.createdAt, startOfToday));
    const triageSessionsToday = triageTodayResult.count;

    // Total consultations
    const [totalConsultationsResult] = await db!.select({ count: count() }).from(consultations);
    const totalConsultations = totalConsultationsResult.count;

    // Consultations today
    const [consultationsTodayResult] = await db!
      .select({ count: count() })
      .from(consultations)
      .where(gte(consultations.createdAt, startOfToday));
    const consultationsToday = consultationsTodayResult.count;

    return {
      totalUsers,
      newUsersThisMonth,
      verifiedClinicians,
      pendingClinicians,
      totalTriageSessions,
      triageSessionsToday,
      totalConsultations,
      consultationsToday,
      recentActivity: [], // Placeholder for activity log
    };
  }),

  // Verify clinician
  verifyClinician: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(users)
        .set({ verified: true })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['patient', 'clinician', 'admin']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Delete user
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Prevent deleting yourself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      await db!.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
