/**
 * Conversation History Router
 * Manages patient conversation sessions, messages, and results
 */

import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { 
  conversationSessions, 
  conversationMessages, 
  conversationResults,
  emergencyAlerts 
} from '../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

export const conversationHistoryRouter = router({
  /**
   * Get all conversation sessions for the current user
   */
  getConversationHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(conversationSessions.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(conversationSessions.status, input.status));
      }

      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(and(...conditions))
        .orderBy(desc(conversationSessions.lastActivityAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get results for completed sessions
      const sessionsWithResults = await Promise.all(
        sessions.map(async (session) => {
          if (session.status === 'completed') {
            const results = await db
              .select()
              .from(conversationResults)
              .where(eq(conversationResults.sessionId, session.id))
              .limit(1);

            return {
              ...session,
              result: results[0] || null,
            };
          }
          return {
            ...session,
            result: null,
          };
        })
      );

      return {
        sessions: sessionsWithResults,
        total: sessions.length,
      };
    }),

  /**
   * Get a specific conversation session with all messages
   */
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get session
      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(
          and(
            eq(conversationSessions.sessionId, input.sessionId),
            eq(conversationSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (sessions.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessions[0];

      // Get messages
      const messages = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.sessionId, session.id))
        .orderBy(conversationMessages.timestamp);

      // Get result if completed
      let result = null;
      if (session.status === 'completed') {
        const results = await db
          .select()
          .from(conversationResults)
          .where(eq(conversationResults.sessionId, session.id))
          .limit(1);
        result = results[0] || null;
      }

      return {
        session,
        messages,
        result,
      };
    }),

  /**
   * Resume an in-progress conversation
   */
  resumeSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify session belongs to user and is in progress
      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(
          and(
            eq(conversationSessions.sessionId, input.sessionId),
            eq(conversationSessions.userId, ctx.user.id),
            eq(conversationSessions.status, 'in_progress')
          )
        )
        .limit(1);

      if (sessions.length === 0) {
        throw new Error('Session not found or already completed');
      }

      const session = sessions[0];

      // Update last activity
      await db
        .update(conversationSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(conversationSessions.id, session.id));

      // Get conversation history
      const messages = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.sessionId, session.id))
        .orderBy(conversationMessages.timestamp);

      return {
        session,
        messages,
        contextVector: session.contextVector ? JSON.parse(session.contextVector) : null,
      };
    }),

  /**
   * Delete a conversation session
   */
  deleteSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify session belongs to user
      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(
          and(
            eq(conversationSessions.sessionId, input.sessionId),
            eq(conversationSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (sessions.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessions[0];

      // Delete messages
      await db
        .delete(conversationMessages)
        .where(eq(conversationMessages.sessionId, session.id));

      // Delete result if exists
      await db
        .delete(conversationResults)
        .where(eq(conversationResults.sessionId, session.id));

      // Delete session
      await db
        .delete(conversationSessions)
        .where(eq(conversationSessions.id, session.id));

      return { success: true };
    }),

  /**
   * Get emergency alerts for the current user
   */
  getEmergencyAlerts: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
      unacknowledgedOnly: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(emergencyAlerts.userId, ctx.user.id)];
      if (input.unacknowledgedOnly) {
        conditions.push(eq(emergencyAlerts.userAcknowledged, false));
      }

      const alerts = await db
        .select()
        .from(emergencyAlerts)
        .where(and(...conditions))
        .orderBy(desc(emergencyAlerts.createdAt))
        .limit(input.limit);

      return { alerts };
    }),

  /**
   * Acknowledge an emergency alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      userAction: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify alert belongs to user
      const alerts = await db
        .select()
        .from(emergencyAlerts)
        .where(
          and(
            eq(emergencyAlerts.id, input.alertId),
            eq(emergencyAlerts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (alerts.length === 0) {
        throw new Error('Alert not found');
      }

      // Update alert
      await db
        .update(emergencyAlerts)
        .set({
          userAcknowledged: true,
          acknowledgedAt: new Date(),
          userAction: input.userAction,
        })
        .where(eq(emergencyAlerts.id, input.alertId));

      return { success: true };
    }),
});
