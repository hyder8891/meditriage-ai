import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { processConversationalAssessment, startConversation } from "./conversational-assessment-integrated";

export const conversationalRouter = router({
  startConversation: protectedProcedure
    .input(z.object({
      language: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await startConversation(input.language || 'en');
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.any()).optional(),
      context: z.any().optional().nullable(),
      language: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Get user info for BRAIN + Avicenna-X
      const userInfo = ctx.user ? {
        age: 30, // TODO: Get from user profile
        gender: 'male' as const, // TODO: Get from user profile
        medicalHistory: [], // TODO: Get from medical history
        location: 'Iraq' // TODO: Get from user location
      } : undefined;
      
      return await processConversationalAssessment(
        input.message, 
        input.context || {},
        input.conversationHistory || [],
        input.language || 'en',
        ctx.user?.id,
        userInfo
      );
    }),

  resetSession: protectedProcedure.mutation(async () => {
    return { success: true };
  })
});
