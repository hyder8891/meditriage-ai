/**
 * Conversational Assessment Router
 * 
 * tRPC endpoints for conversational AI symptom assessment
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  processConversationalAssessment,
  type ConversationMessage,
  type AssessmentResponse
} from "./conversational-assessment";

// ============================================================================
// Schemas
// ============================================================================

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number()
});

const conversationContextSchema = z.object({
  symptoms: z.array(z.string()).optional(),
  duration: z.string().optional(),
  severity: z.string().optional(),
  location: z.string().optional(),
  aggravatingFactors: z.array(z.string()).optional(),
  relievingFactors: z.array(z.string()).optional(),
  associatedSymptoms: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  age: z.number().optional(),
  gender: z.string().optional()
});

// ============================================================================
// Router
// ============================================================================

export const conversationalRouter = router({
  /**
   * Process user message in conversational assessment
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        conversationHistory: z.array(conversationMessageSchema),
        context: conversationContextSchema.optional(),
        language: z.enum(["en", "ar"]).optional().default("en")
      })
    )
    .mutation(async ({ input, ctx }): Promise<AssessmentResponse> => {
      const { message, conversationHistory, context, language } = input;

      // Process the message through conversational flow engine
      const response = await processConversationalAssessment(
        message,
        conversationHistory,
        context || {},
        language || "en"
      );

      return response;
    }),

  /**
   * Start a new conversation
   */
  startConversation: publicProcedure
    .input(
      z.object({
        language: z.enum(["en", "ar"]).optional().default("en")
      })
    )
    .mutation(async ({ input, ctx }): Promise<AssessmentResponse> => {
      const { language } = input;
      // Return initial greeting based on language
      const message = language === "ar" 
        ? "مرحباً! أنا هنا لمساعدتك في تقييم أعراضك. ما الذي يجعلك تأتي اليوم؟"
        : "Hello! I'm here to help assess your symptoms. What brings you here today?";
      
      return {
        message,
        conversationStage: "greeting"
      };
    }),

  /**
   * Get conversation history for a user
   */
  getHistory: publicProcedure
    .query(async ({ ctx }) => {
      // In a real implementation, this would fetch from database
      // For now, return empty array (conversation history managed client-side)
      return [];
    })
});
