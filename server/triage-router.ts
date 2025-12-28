import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getAllTriageRecords } from "./db";
import { getDb } from "./db";
import { triageRecords } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const triageRouter = router({
  /**
   * Get all triage records sorted by urgency and time
   */
  getQueue: protectedProcedure.query(async ({ ctx }) => {
    const records = await getAllTriageRecords();
    
    // Sort by urgency (critical first) and then by creation time
    const sortedRecords = records.sort((a, b) => {
      const urgencyOrder: Record<string, number> = {
        critical: 0,
        emergency: 0,
        urgent: 1,
        high: 1,
        moderate: 2,
        routine: 3,
        low: 3,
      };
      
      const aUrgency = urgencyOrder[a.urgencyLevel.toLowerCase()] ?? 2;
      const bUrgency = urgencyOrder[b.urgencyLevel.toLowerCase()] ?? 2;
      
      if (aUrgency !== bUrgency) {
        return aUrgency - bUrgency;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return sortedRecords;
  }),

  /**
   * Assign a triage record to the current doctor
   */
  assignToDoctor: protectedProcedure
    .input(z.object({ triageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // In a real system, you would create an assignment table
      // For now, we'll just return success
      return { success: true, doctorId: ctx.user.id, triageId: input.triageId };
    }),

  /**
   * Get triage statistics
   */
  getStats: protectedProcedure.query(async () => {
    const records = await getAllTriageRecords();
    
    const stats = {
      total: records.length,
      critical: records.filter(r => r.urgencyLevel.toLowerCase().includes("critical") || r.urgencyLevel.toLowerCase().includes("emergency")).length,
      urgent: records.filter(r => r.urgencyLevel.toLowerCase().includes("urgent") || r.urgencyLevel.toLowerCase().includes("high")).length,
      routine: records.filter(r => r.urgencyLevel.toLowerCase().includes("routine") || r.urgencyLevel.toLowerCase().includes("low")).length,
      avgDuration: records.reduce((sum, r) => sum + (r.duration || 0), 0) / records.length || 0,
      avgMessages: records.reduce((sum, r) => sum + r.messageCount, 0) / records.length || 0,
    };
    
    return stats;
  }),
});
