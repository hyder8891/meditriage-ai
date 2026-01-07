/**
 * Enhanced Conversational Router
 * 
 * API endpoints for the enhanced AI assessment system with:
 * - Strict language adherence
 * - Structured outcome display
 * - Intelligent clinic/hospital recommendations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  startEnhancedConversation, 
  processEnhancedAssessment 
} from "./enhanced-assessment";
import { getUserLocation } from "./geolocation";

export const enhancedConversationalRouter = router({
  /**
   * Start a new enhanced conversation
   */
  startConversation: publicProcedure
    .input(z.object({
      language: z.enum(['en', 'ar']).default('en')
    }))
    .mutation(async ({ input }) => {
      return await startEnhancedConversation(input.language);
    }),

  /**
   * Send a message and get response with structured outcome
   */
  sendMessage: publicProcedure
    .input(z.object({
      message: z.string(),
      context: z.any().optional().nullable(),
      language: z.enum(['en', 'ar']).default('en'),
      userLocation: z.object({
        governorate: z.string().optional(),
        city: z.string().optional()
      }).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Get user location from IP if not provided
      let location = input.userLocation;
      
      if (!location?.governorate) {
        try {
          const forwardedFor = ctx.req?.headers?.['x-forwarded-for'];
          const realIp = ctx.req?.headers?.['x-real-ip'];
          let clientIp = '127.0.0.1';
          
          if (typeof forwardedFor === 'string') {
            clientIp = forwardedFor.split(',')[0].trim();
          } else if (typeof realIp === 'string') {
            clientIp = realIp;
          } else if (ctx.req?.socket?.remoteAddress) {
            clientIp = ctx.req.socket.remoteAddress;
          }
          
          const detectedLocation = await getUserLocation(clientIp);
          if (detectedLocation?.governorate) {
            location = {
              governorate: detectedLocation.governorate,
              city: detectedLocation.city
            };
          }
        } catch (error) {
          console.error('[Enhanced Router] Location detection failed:', error);
        }
      }
      
      // Default to Baghdad if no location
      if (!location?.governorate) {
        location = { governorate: 'Baghdad', city: 'Baghdad' };
      }
      
      return await processEnhancedAssessment(
        input.message,
        input.context || {},
        input.language,
        ctx.user?.id,
        location
      );
    }),

  /**
   * Reset the conversation session
   */
  resetSession: publicProcedure.mutation(async () => {
    return { success: true };
  })
});
