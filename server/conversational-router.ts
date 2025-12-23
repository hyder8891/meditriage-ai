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
import { ConversationalContextVector, createContextVector } from "./conversational-context-vector";

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
  duration: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  aggravatingFactors: z.array(z.string()).optional(),
  relievingFactors: z.array(z.string()).optional(),
  associatedSymptoms: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  age: z.number().nullable().optional(),
  gender: z.string().nullable().optional()
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
      console.log("[sendMessage] Received input:", JSON.stringify(input, null, 2));
      const { message, conversationHistory, context, language } = input;

      // 🔧 FIX: Rehydrate the Context Vector Class
      // The context arrives as plain JSON, but we need a class instance with methods
      // Filter out null values to match ConversationalContextVector type expectations
      const sanitizedContext = context ? {
        symptoms: context.symptoms,
        duration: context.duration ?? undefined,
        severity: context.severity ?? undefined,
        location: context.location ?? undefined,
        aggravatingFactors: context.aggravatingFactors,
        relievingFactors: context.relievingFactors,
        associatedSymptoms: context.associatedSymptoms,
        medicalHistory: context.medicalHistory,
        medications: context.medications,
        age: context.age ?? undefined,
        gender: context.gender ?? undefined
      } : {};
      const hydratedContext = createContextVector(sanitizedContext);
      
      console.log("[sendMessage] Rehydrated context:", hydratedContext.getSummary());

      // Process the message through conversational flow engine
      try {
        const response = await processConversationalAssessment(
          message,
          conversationHistory,
          hydratedContext,
          language || "en"
        );

        return response;
      } catch (error) {
        console.error("[sendMessage] Error in processConversationalAssessment:", error);
        throw error;
      }
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
