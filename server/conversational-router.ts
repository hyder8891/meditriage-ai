import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { processConversationalAssessment } from "./conversational-assessment";

export const conversationalRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
      // 🟢 THE FIX: Accept ANY object structure for memory
      // This prevents Zod from stripping 'stepCount' or 'symptoms'
      context: z.any().optional().nullable() 
    }))
    .mutation(async ({ input }) => {
      // Logic
      return await processConversationalAssessment(
        input.message, 
        input.context || {} // Ensure not null
      );
    }),

  resetSession: protectedProcedure.mutation(async () => {
    return { success: true };
  })
});
