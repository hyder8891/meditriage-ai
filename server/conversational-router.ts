/**
 * Conversational Assessment Router - HARDENED VERSION
 * 
 * tRPC endpoints for conversational AI symptom assessment with robust context handling
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  processConversationalAssessment,
  type ConversationMessage,
  type AssessmentResponse
} from "./conversational-assessment";

// ============================================================================
// Schemas - Allow nullable fields to prevent 400 Bad Request
// ============================================================================

const conversationContextSchema = z.object({
  // Arrays (Critical for memory)
  symptoms: z.array(z.string()).optional(),
  aggravatingFactors: z.array(z.string()).optional(),
  relievingFactors: z.array(z.string()).optional(),
  associatedSymptoms: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  ruledOut: z.array(z.string()).optional(),
  confirmedSymptoms: z.array(z.string()).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  })).optional(),
  
  // Counters (Critical for flow)
  stepCount: z.number().optional(),
  questionCount: z.number().optional(),
  
  // Strings (Allow nulls)
  duration: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  gender: z.string().nullable().optional()
}).optional().nullable(); // Allow the entire object to be null

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
        context: conversationContextSchema,
        language: z.enum(["en", "ar"]).optional().default("en")
      })
    )
    .mutation(async ({ input, ctx }): Promise<AssessmentResponse> => {
      console.log("[sendMessage] Received:", {
        message: input.message,
        hasContext: !!input.context,
        stepCount: input.context?.stepCount
      });

      // 🔧 FIX: Ensure we always pass a valid object to the engine
      // Even if context is null/undefined, we provide an empty object
      const safeContext = input.context || {};
      
      try {
        const response = await processConversationalAssessment(
          input.message,
          safeContext
        );

        console.log("[sendMessage] Response:", {
          stage: response.conversationStage,
          hasTriageResult: !!response.triageResult,
          newStepCount: response.context.stepCount
        });

        return response;
      } catch (error) {
        console.error("[sendMessage] Error:", error);
        
        // 🛡️ Last resort fallback - return safe response
        return {
          message: "I apologize, but I'm having trouble processing your message. Could you please rephrase that?",
          messageAr: "أعتذر، لكنني أواجه مشكلة في معالجة رسالتك. هل يمكنك إعادة صياغة ذلك؟",
          conversationStage: "gathering",
          context: safeContext as any
        };
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
      
      const message = language === "ar" 
        ? "مرحباً! أنا الدكتور ابن سينا، مساعدك الطبي الذكي. ما الذي يزعجك اليوم؟"
        : "Hello! I'm Dr. Avicenna, your AI medical assistant. What's bothering you today?";
      
      return {
        message,
        messageAr: language === "ar" ? message : "مرحباً! أنا الدكتور ابن سينا، مساعدك الطبي الذكي. ما الذي يزعجك اليوم؟",
        conversationStage: "greeting",
        context: {
          symptoms: [],
          stepCount: 0,
          questionCount: 0,
          aggravatingFactors: [],
          relievingFactors: [],
          associatedSymptoms: [],
          medicalHistory: [],
          medications: [],
          ruledOut: [],
          confirmedSymptoms: [],
          conversationHistory: []
        }
      };
    }),

  /**
   * Reset conversation session
   */
  resetSession: publicProcedure.mutation(async ({ ctx }) => {
    console.log("[resetSession] Session reset requested");
    return { 
      success: true,
      message: "Conversation reset successfully"
    };
  }),

  /**
   * Get conversation history for a user (placeholder)
   */
  getHistory: publicProcedure
    .query(async ({ ctx }) => {
      // In a real implementation, this would fetch from database
      // For now, return empty array (conversation history managed client-side)
      return [];
    })
});
