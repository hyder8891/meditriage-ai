import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { 
  doctorPatientRelationships, 
  patientInvitations, 
  sharedRecords,
  subscriptions,
  usageTracking,
  users,
  cases,
  vitals,
  diagnoses,
  prescriptions,
  messages,
  appointments
} from "../drizzle/schema";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { emitNotificationToUser } from "./_core/socket-server";

/**
 * B2B2C Platform Router
 * Handles doctor-patient relationships, availability, messaging, and subscriptions
 */

export const b2b2cRouter = router({
  
  // ============================================
  // DOCTOR AVAILABILITY PROCEDURES
  // ============================================
  
  doctor: router({
    /**
     * Set doctor availability status
     */
    setAvailabilityStatus: protectedProcedure
      .input(z.object({
        status: z.enum(["available", "busy", "offline"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if user is a doctor/clinician/admin
        if (!["doctor", "clinician", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Only doctors and admins can set availability status. Your current role is: ${ctx.user.role}` 
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Update availability status
        await db.update(users)
          .set({ 
            availabilityStatus: input.status,
            lastStatusChange: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true, status: input.status };
      }),

    /**
     * Get current availability status
     */
    getAvailabilityStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        const [user] = await db
          .select({
            availabilityStatus: users.availabilityStatus,
            currentPatientCount: users.currentPatientCount,
            maxPatientsPerDay: users.maxPatientsPerDay,
            lastStatusChange: users.lastStatusChange,
          })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        return user || null;
      }),

    /**
     * Get all patients for the logged-in doctor
     */
    getMyPatients: protectedProcedure
      .input(z.object({
        status: z.enum(["active", "inactive", "pending", "terminated"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Build query conditions
        const conditions = [eq(doctorPatientRelationships.doctorId, ctx.user.id)];
        if (input.status) {
          conditions.push(eq(doctorPatientRelationships.status, input.status));
        }

        // Get relationships with patient info
        const relationships = await db
          .select({
            relationship: doctorPatientRelationships,
            patient: users,
          })
          .from(doctorPatientRelationships)
          .leftJoin(users, eq(doctorPatientRelationships.patientId, users.id))
          .where(and(...conditions))
          .orderBy(desc(doctorPatientRelationships.establishedAt))
          .limit(input.limit)
          .offset(input.offset);

        return relationships;
      }),

    /**
     * Get detailed patient profile
     */
    getPatientProfile: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Verify doctor-patient relationship
        const [relationship] = await db
          .select()
          .from(doctorPatientRelationships)
          .where(and(
            eq(doctorPatientRelationships.doctorId, ctx.user.id),
            eq(doctorPatientRelationships.patientId, input.patientId),
            eq(doctorPatientRelationships.status, "active")
          ))
          .limit(1);

        if (!relationship) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "No active relationship with this patient" 
          });
        }

        // Get patient info
        const [patient] = await db
          .select()
          .from(users)
          .where(eq(users.id, input.patientId))
          .limit(1);

        // Get patient's cases
        const patientCases = await db
          .select()
          .from(cases)
          .where(eq(cases.clinicianId, ctx.user.id))
          .orderBy(desc(cases.createdAt))
          .limit(10);

        // Get recent vitals
        const recentVitals = await db
          .select()
          .from(vitals)
          .where(inArray(vitals.caseId, patientCases.map(c => c.id)))
          .orderBy(desc(vitals.recordedAt))
          .limit(5);

        // Get active prescriptions
        const activePrescriptions = await db
          .select()
          .from(prescriptions)
          .where(and(
            eq(prescriptions.patientId, input.patientId),
            eq(prescriptions.clinicianId, ctx.user.id),
            eq(prescriptions.status, "active")
          ))
          .orderBy(desc(prescriptions.createdAt));

        return {
          patient,
          relationship,
          cases: patientCases,
          vitals: recentVitals,
          prescriptions: activePrescriptions,
        };
      }),
  }),

  // ============================================
  // PATIENT PROCEDURES
  // ============================================
  
  patient: router({
    /**
     * Search for available doctors
     */
    searchDoctors: publicProcedure
      .input(z.object({
        specialty: z.string().optional(),
        availabilityStatus: z.enum(["available", "busy", "offline", "all"]).default("all"),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Build conditions
        const conditions = [
          or(eq(users.role, "doctor"), eq(users.role, "clinician"))
        ];

        if (input.specialty) {
          conditions.push(eq(users.specialty, input.specialty));
        }

        if (input.availabilityStatus !== "all") {
          conditions.push(eq(users.availabilityStatus, input.availabilityStatus));
        }

        // Get doctors
        const doctors = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            specialty: users.specialty,
            licenseNumber: users.licenseNumber,
            verified: users.verified,
            availabilityStatus: users.availabilityStatus,
            currentPatientCount: users.currentPatientCount,
            lastStatusChange: users.lastStatusChange,
          })
          .from(users)
          .where(and(...conditions))
          .orderBy(
            // Available doctors first
            sql`CASE WHEN ${users.availabilityStatus} = 'available' THEN 0 
                     WHEN ${users.availabilityStatus} = 'busy' THEN 1 
                     ELSE 2 END`
          )
          .limit(input.limit)
          .offset(input.offset);

        return doctors;
      }),

    /**
     * Connect with an available doctor (instant connection)
     */
    connectWithDoctor: protectedProcedure
      .input(z.object({
        doctorId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Check if doctor is available
        const [doctor] = await db
          .select()
          .from(users)
          .where(eq(users.id, input.doctorId))
          .limit(1);

        if (!doctor) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Doctor not found" });
        }

        if (doctor.availabilityStatus !== "available") {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: `Doctor is currently ${doctor.availabilityStatus}` 
          });
        }

        // Check if relationship already exists
        const [existing] = await db
          .select()
          .from(doctorPatientRelationships)
          .where(and(
            eq(doctorPatientRelationships.doctorId, input.doctorId),
            eq(doctorPatientRelationships.patientId, ctx.user.id)
          ))
          .limit(1);

        if (existing) {
          // Reactivate if terminated
          if (existing.status === "terminated") {
            await db.update(doctorPatientRelationships)
              .set({ status: "active", establishedAt: new Date() })
              .where(eq(doctorPatientRelationships.id, existing.id));
          }
          return { success: true, relationshipId: existing.id, message: "Already connected" };
        }

        // Create new relationship (instant connection, no approval needed)
        const [result] = await db.insert(doctorPatientRelationships).values({
          doctorId: input.doctorId,
          patientId: ctx.user.id,
          relationshipType: "primary",
          status: "active", // Instant active status
          notes: input.reason,
          canViewRecords: true,
          canPrescribe: true,
          canMessage: true,
          canScheduleAppointments: true,
        });

        // Increment doctor's current patient count
        await db.update(users)
          .set({ 
            currentPatientCount: sql`${users.currentPatientCount} + 1`
          })
          .where(eq(users.id, input.doctorId));

        return { 
          success: true, 
          relationshipId: result.insertId,
          message: "Connected successfully" 
        };
      }),

    /**
     * Get all doctors connected to patient
     */
    getMyDoctors: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        const relationships = await db
          .select({
            relationship: doctorPatientRelationships,
            doctor: users,
          })
          .from(doctorPatientRelationships)
          .leftJoin(users, eq(doctorPatientRelationships.doctorId, users.id))
          .where(and(
            eq(doctorPatientRelationships.patientId, ctx.user.id),
            eq(doctorPatientRelationships.status, "active")
          ))
          .orderBy(desc(doctorPatientRelationships.establishedAt));

        return relationships;
      }),

    /**
     * Get shared medical records from doctors
     */
    getMyRecords: protectedProcedure
      .input(z.object({
        recordType: z.enum([
          "case", "vital", "diagnosis", "prescription", 
          "clinical_note", "transcription", "timeline_event", 
          "appointment", "consultation", "lab_result", "imaging"
        ]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        const conditions = [
          eq(sharedRecords.patientId, ctx.user.id),
          eq(sharedRecords.patientCanView, true),
          eq(sharedRecords.hideFromPatient, false),
        ];

        if (input.recordType) {
          conditions.push(eq(sharedRecords.recordType, input.recordType));
        }

        const records = await db
          .select({
            record: sharedRecords,
            doctor: users,
          })
          .from(sharedRecords)
          .leftJoin(users, eq(sharedRecords.doctorId, users.id))
          .where(and(...conditions))
          .orderBy(desc(sharedRecords.sharedAt))
          .limit(input.limit)
          .offset(input.offset);

        return records;
      }),
  }),

  // ============================================
  // MESSAGING PROCEDURES
  // ============================================
  
  messaging: router({
    /**
     * Send a message between doctor and patient
     */
    sendMessage: protectedProcedure
      .input(z.object({
        recipientId: z.number(),
        content: z.string().min(1),
        caseId: z.number().optional(),
        attachmentUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Verify recipient exists and is a valid user
        const [recipient] = await db
          .select()
          .from(users)
          .where(eq(users.id, input.recipientId))
          .limit(1);

        if (!recipient) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "Recipient not found" 
          });
        }

        // Basic validation: ensure users are not messaging themselves
        if (ctx.user.id === input.recipientId) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Cannot send messages to yourself" 
          });
        }

        // Create message
        const [result] = await db.insert(messages).values({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          content: input.content,
          caseId: input.caseId,
          attachments: input.attachmentUrl ? JSON.stringify([input.attachmentUrl]) : null,
          read: false,
        });

        // 🔴 REAL-TIME: Emit notification to recipient via Socket.IO
        try {
          emitNotificationToUser(input.recipientId, 'new-message', {
            messageId: result.insertId,
            senderId: ctx.user.id,
            senderName: ctx.user.name || 'User',
            content: input.content,
            timestamp: new Date().toISOString(),
          });
          console.log(`[Messaging] Real-time notification sent to user ${input.recipientId}`);
        } catch (socketError) {
          // Don't fail the message send if socket notification fails
          console.error('[Messaging] Failed to send real-time notification:', socketError);
        }

        return { 
          success: true, 
          messageId: result.insertId 
        };
      }),

    /**
     * Get conversation between doctor and patient
     */
    getConversation: protectedProcedure
      .input(z.object({
        otherUserId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Get messages between the two users
        const conversation = await db
          .select()
          .from(messages)
          .where(
            or(
              and(
                eq(messages.senderId, ctx.user.id),
                eq(messages.recipientId, input.otherUserId)
              ),
              and(
                eq(messages.senderId, input.otherUserId),
                eq(messages.recipientId, ctx.user.id)
              )
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return conversation.reverse(); // Oldest first
      }),

    /**
     * Get all conversations for current user
     */
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log('[getConversations] User ID:', ctx.user.id, 'Role:', ctx.user.role);

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Get all messages for current user
        const userMessages = await db
          .select()
          .from(messages)
          .where(
            or(
              eq(messages.senderId, ctx.user.id),
              eq(messages.recipientId, ctx.user.id)
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(100);

        console.log('[getConversations] Found', userMessages.length, 'messages for user', ctx.user.id);

        // Group by conversation and get latest message
        const conversationsMap = new Map();
        
        for (const msg of userMessages) {
          const otherUserId = msg.senderId === ctx.user.id 
            ? msg.recipientId 
            : msg.senderId;

          if (!conversationsMap.has(otherUserId)) {
            // Fetch the other user's details
            const [otherUser] = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phoneNumber: users.phoneNumber,
                role: users.role,
                specialty: users.specialty,
              })
              .from(users)
              .where(eq(users.id, otherUserId))
              .limit(1);

            // Create display name: use name if it's not generic, otherwise use phone or email
            let displayName = otherUser?.name || '';
            if (!displayName || displayName.startsWith('User ')) {
              displayName = otherUser?.phoneNumber || otherUser?.email || `User ${otherUserId}`;
            }

            conversationsMap.set(otherUserId, {
              otherUser: otherUser ? { ...otherUser, displayName } : null,
              latestMessage: msg,
              unreadCount: 0,
            });
          }

          // Count unread messages
          if (msg.recipientId === ctx.user.id && !msg.read) {
            const conv = conversationsMap.get(otherUserId);
            if (conv) {
              conv.unreadCount++;
            }
          }
        }

        const conversations = Array.from(conversationsMap.values());
        console.log('[getConversations] Returning', conversations.length, 'conversations');
        return conversations;
      }),

    /**
     * Mark messages as read
     */
    markAsRead: protectedProcedure
      .input(z.object({
        messageIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        await db.update(messages)
          .set({ read: true, readAt: new Date() })
          .where(
            and(
              inArray(messages.id, input.messageIds),
              eq(messages.recipientId, ctx.user.id)
            )
          );

        return { success: true };
      }),

    /**
     * Get unread message count
     */
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.recipientId, ctx.user.id),
              eq(messages.read, false)
            )
          );

        return result?.count || 0;
      }),
  }),

  // ============================================
  // SUBSCRIPTION PROCEDURES
  // ============================================
  
  subscription: router({
    /**
     * Get current user's subscription
     */
    getCurrent: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        const [subscription] = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, ctx.user.id),
              eq(subscriptions.status, "active")
            )
          )
          .orderBy(desc(subscriptions.createdAt))
          .limit(1);

        return subscription || null;
      }),

    /**
     * Get usage stats for current period
     */
    getUsageStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Get current subscription
        const [subscription] = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, ctx.user.id),
              eq(subscriptions.status, "active")
            )
          )
          .limit(1);

        if (!subscription) {
          return {
            plan: "free",
            consultationsUsed: 0,
            consultationsLimit: 3,
            patientsConnected: 0,
            patientsLimit: 0,
          };
        }

        // Get usage tracking
        const [usage] = await db
          .select()
          .from(usageTracking)
          .where(eq(usageTracking.userId, ctx.user.id))
          .orderBy(desc(usageTracking.periodStart))
          .limit(1);

        // Count connected patients (for doctors)
        let patientsConnected = 0;
        if (["doctor", "clinician"].includes(ctx.user.role)) {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(doctorPatientRelationships)
            .where(
              and(
                eq(doctorPatientRelationships.doctorId, ctx.user.id),
                eq(doctorPatientRelationships.status, "active")
              )
            );
          patientsConnected = result?.count || 0;
        }

        // Parse metadata for limits
        const metadata = subscription.metadata ? JSON.parse(subscription.metadata) : {};
        
        return {
          plan: subscription.planType,
          consultationsUsed: usage?.count || 0,
          consultationsLimit: metadata.consultationsLimit || 0,
          patientsConnected,
          patientsLimit: metadata.patientsLimit || 0,
        };
      }),

    /**
     * Create or upgrade subscription
     */
    createOrUpgrade: protectedProcedure
      .input(z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Define plan limits
        const plans: Record<string, { 
          price: number; 
          consultations: number; 
          patients: number;
          features: string[];
        }> = {
          "patient-free": { price: 0, consultations: 3, patients: 0, features: ["Basic symptom checker", "3 consultations/month"] },
          "patient-lite": { price: 2.99, consultations: 10, patients: 0, features: ["10 consultations/month", "Health records access"] },
          "patient-pro": { price: 5.99, consultations: -1, patients: 0, features: ["Unlimited consultations", "Priority support", "Advanced features"] },
          "doctor-basic": { price: 120, consultations: -1, patients: 100, features: ["Up to 100 patients", "Clinical AI tools", "Messaging"] },
          "doctor-premium": { price: 200, consultations: -1, patients: -1, features: ["Unlimited patients", "Priority listing", "Advanced analytics"] },
        };

        const plan = plans[input.planId];
        if (!plan) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan ID" });
        }

        // Calculate dates
        const now = new Date();
        const nextBillingDate = new Date(now);
        if (input.billingCycle === "monthly") {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }

        // Cancel existing active subscriptions
        await db.update(subscriptions)
          .set({ status: "cancelled", cancelledAt: now })
          .where(
            and(
              eq(subscriptions.userId, ctx.user.id),
              eq(subscriptions.status, "active")
            )
          );

        // Create new subscription
        const [result] = await db.insert(subscriptions).values({
          userId: ctx.user.id,
          planType: input.planId as any,
          status: "active",
          billingCycle: input.billingCycle,
          pricePerMonth: plan.price.toString(),
          currency: "USD",
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
          nextPaymentDate: nextBillingDate,
          nextPaymentAmount: plan.price.toString(),
          metadata: JSON.stringify({ 
            consultationsLimit: plan.consultations,
            patientsLimit: plan.patients,
            features: plan.features 
          }),
        });

        // Initialize usage tracking
        await db.insert(usageTracking).values({
          userId: ctx.user.id,
          feature: "consultations",
          count: 0,
          periodStart: now,
          periodEnd: nextBillingDate,
          limit: plan.consultations > 0 ? plan.consultations : null,
        });

        return { 
          success: true, 
          subscriptionId: result.insertId,
          message: "Subscription activated successfully" 
        };
      }),

    /**
     * Cancel subscription
     */
    cancel: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        await db.update(subscriptions)
          .set({ 
            status: "cancelled", 
            cancelledAt: new Date(),
            cancelAtPeriodEnd: true,
          })
          .where(
            and(
              eq(subscriptions.userId, ctx.user.id),
              eq(subscriptions.status, "active")
            )
          );

        return { success: true, message: "Subscription will be cancelled at period end" };
      }),
  }),
});
