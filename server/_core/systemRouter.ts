import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./trpc";
import { emitNotificationToUser } from "./socket-server";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // Test endpoint to verify real-time notifications work with Redis
  testNotification: protectedProcedure
    .input(
      z.object({
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const testMessage = input.message || `Test notification sent at ${new Date().toLocaleTimeString()}`;
      
      // Emit notification to the current user via Socket.IO + Redis
      emitNotificationToUser(userId, 'new-message', {
        messageId: Date.now(),
        senderId: 0, // System message
        content: testMessage,
        subject: 'Redis Test Notification',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Notification sent via Redis to user room',
        userId,
      };
    }),
});
