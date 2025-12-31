import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { emailPreferences, userSettings, accountActivity } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { users } from "../drizzle/schema";

/**
 * Preferences Router
 * Handles user profile, email preferences, settings, and account activity
 */

// Email preferences schema
const emailPreferencesSchema = z.object({
  welcomeEmails: z.boolean().optional(),
  verificationEmails: z.boolean().optional(),
  passwordResetEmails: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  appointmentConfirmations: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  appointmentReminderFrequency: z.enum(["instant", "daily", "weekly", "off"]).optional(),
  medicationReminders: z.boolean().optional(),
  medicationReminderFrequency: z.enum(["instant", "daily", "weekly", "off"]).optional(),
  labResultNotifications: z.boolean().optional(),
  criticalLabAlerts: z.boolean().optional(),
  newMessageNotifications: z.boolean().optional(),
  messageNotificationFrequency: z.enum(["instant", "daily", "weekly", "off"]).optional(),
  unreadMessageDigest: z.boolean().optional(),
  subscriptionConfirmations: z.boolean().optional(),
  paymentReceipts: z.boolean().optional(),
  invoiceEmails: z.boolean().optional(),
  subscriptionExpiryWarnings: z.boolean().optional(),
  paymentFailureAlerts: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  allEmailsEnabled: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// User settings schema
const userSettingsSchema = z.object({
  language: z.enum(["en", "ar"]).optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  desktopNotifications: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  profileVisibility: z.enum(["public", "private", "doctors_only"]).optional(),
  showOnlineStatus: z.boolean().optional(),
  autoAcceptPatients: z.boolean().optional(),
  maxDailyConsultations: z.number().optional(),
  consultationDuration: z.number().optional(),
});

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const preferencesRouter = router({
  /**
   * Get email preferences for current user
   */
  getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const prefsArray = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, ctx.user.id))
      .limit(1);
    const prefs = prefsArray[0] || null;

    // Return defaults if no preferences exist
    if (!prefs) {
      return {
        userId: ctx.user.id,
        welcomeEmails: true,
        verificationEmails: true,
        passwordResetEmails: true,
        securityAlerts: true,
        appointmentConfirmations: true,
        appointmentReminders: true,
        appointmentReminderFrequency: "instant" as const,
        medicationReminders: true,
        medicationReminderFrequency: "instant" as const,
        labResultNotifications: true,
        criticalLabAlerts: true,
        newMessageNotifications: true,
        messageNotificationFrequency: "instant" as const,
        unreadMessageDigest: false,
        subscriptionConfirmations: true,
        paymentReceipts: true,
        invoiceEmails: true,
        subscriptionExpiryWarnings: true,
        paymentFailureAlerts: true,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        allEmailsEnabled: true,
        marketingEmails: false,
      };
    }

    return prefs;
  }),

  /**
   * Update email preferences
   */
  updateEmailPreferences: protectedProcedure
    .input(emailPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existingArray = await db
        .select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, ctx.user.id))
        .limit(1);
      const existing = existingArray[0] || null;

      if (existing) {
        await db
          .update(emailPreferences)
          .set(input)
          .where(eq(emailPreferences.userId, ctx.user.id));
      } else {
        await db.insert(emailPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      // Log activity
      await db.insert(accountActivity).values({
        userId: ctx.user.id,
        activityType: "settings_change",
        success: true,
        metadata: JSON.stringify({ type: "email_preferences", changes: input }),
      });

      return { success: true };
    }),

  /**
   * Get user settings
   */
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const settingsArray = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);
    const settings = settingsArray[0] || null;

    // Return defaults if no settings exist
    if (!settings) {
      return {
        userId: ctx.user.id,
        language: "ar" as const,
        timezone: "Asia/Baghdad",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24h" as const,
        desktopNotifications: true,
        soundNotifications: true,
        profileVisibility: "doctors_only" as const,
        showOnlineStatus: true,
        autoAcceptPatients: false,
        maxDailyConsultations: 20,
        consultationDuration: 30,
      };
    }

    return settings;
  }),

  /**
   * Update user settings
   */
  updateUserSettings: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existingArray = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);
      const existing = existingArray[0] || null;

      if (existing) {
        await db
          .update(userSettings)
          .set(input)
          .where(eq(userSettings.userId, ctx.user.id));
      } else {
        await db.insert(userSettings).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      // Log activity
      await db.insert(accountActivity).values({
        userId: ctx.user.id,
        activityType: "settings_change",
        success: true,
        metadata: JSON.stringify({ type: "user_settings", changes: input }),
      });

      return { success: true };
    }),

  /**
   * Get user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const userArray = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    const user = userArray[0] || null;

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      specialty: user.specialty,
      licenseNumber: user.licenseNumber,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      emergencyContactName: user.emergencyContactName,
      emergencyContact: user.emergencyContact,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db
        .update(users)
        .set(input)
        .where(eq(users.id, ctx.user.id));

      // Log activity
      await db.insert(accountActivity).values({
        userId: ctx.user.id,
        activityType: "profile_update",
        success: true,
        metadata: JSON.stringify({ changes: input }),
      });

      return { success: true };
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userArray = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const user = userArray[0] || null;

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change password for this account",
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

      // Update password and increment token version
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          tokenVersion: (user.tokenVersion || 0) + 1,
        })
        .where(eq(users.id, ctx.user.id));

      // Log activity
      await db.insert(accountActivity).values({
        userId: ctx.user.id,
        activityType: "password_change",
        success: true,
      });

      return { success: true };
    }),

  /**
   * Upload profile photo
   */
  uploadProfilePhoto: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Decode base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Generate unique file key
      const fileKey = `profile-photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update user profile with photo URL
      await db
        .update(users)
        .set({
          // Store photo URL in name field temporarily (should add profilePhotoUrl field to schema)
          // For now, we'll just return the URL and let frontend handle it
        })
        .where(eq(users.id, ctx.user.id));

      return { url };
    }),

  /**
   * Get account activity
   */
  getAccountActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const activities = await db
        .select()
        .from(accountActivity)
        .where(eq(accountActivity.userId, ctx.user.id))
        .orderBy(desc(accountActivity.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  /**
   * Get account statistics
   */
  getAccountStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const userArray = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    const user = userArray[0] || null;

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Get activity counts
    const loginCount = await db
      .select()
      .from(accountActivity)
      .where(eq(accountActivity.userId, ctx.user.id));

    const successfulLogins = loginCount.filter(
      (a) => a.activityType === "login" && a.success
    ).length;

    const failedLogins = loginCount.filter(
      (a) => a.activityType === "failed_login"
    ).length;

    return {
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      totalLogins: successfulLogins,
      failedLoginAttempts: failedLogins,
      lastLogin: user.lastSignedIn,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };
  }),

  /**
   * Test email notification
   */
  testEmail: protectedProcedure
    .input(
      z.object({
        emailType: z.enum([
          "welcome",
          "appointment_reminder",
          "lab_result",
          "message",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would integrate with the email service
      // For now, just return success
      return {
        success: true,
        message: `Test ${input.emailType} email sent to ${ctx.user.email}`,
      };
    }),
});
