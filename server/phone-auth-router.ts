/**
 * Phone Authentication Router
 * Handles WhatsApp/SMS OTP login
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPhoneVerification, verifyPhoneCode, formatPhoneNumber, isValidPhoneNumber } from "./services/phoneVerification";
import { hashPassword, generateToken as generateJWT } from "./_core/auth-utils";

export const phoneAuthRouter = router({
  /**
   * Step 1: Send OTP code to phone number
   */
  sendOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10, "Phone number too short"),
        countryCode: z.string().default("+964"),
        // SMS only - no channel selection needed
      })
    )
    .mutation(async ({ input }) => {
      const { phoneNumber, countryCode } = input;

      // Format and validate phone number
      // Handle empty or null phone numbers gracefully
      if (!phoneNumber || phoneNumber.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Phone number is required",
        });
      }
      
      const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid phone number format. Please enter a valid phone number with at least 10 digits.",
        });
      }

      try {
        // Send OTP via SMS
        const result = await sendPhoneVerification(formattedPhone);
        
        return {
          success: true,
          phoneNumber: formattedPhone,
          code: result.code, // Only in development
          message: "Verification code sent via SMS",
        };
      } catch (error: any) {
        console.error("[Phone Auth] Error sending OTP:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to send verification code",
        });
      }
    }),

  /**
   * Step 2: Verify OTP code and login/register user
   */
  verifyOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        countryCode: z.string().default("+964"),
        code: z.string().length(6, "Verification code must be 6 digits"),
        name: z.string().optional(), // For new user registration
        role: z.enum(["patient", "clinician"]).default("patient"),
      })
    )
    .mutation(async ({ input }) => {
      const { phoneNumber, countryCode, code, name, role } = input;

      // Format phone number
      const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);

      try {
        // Verify OTP code
        const verification = await verifyPhoneCode(formattedPhone, code);

        if (!verification.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification code",
          });
        }

        // Check if user exists with this phone number
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }
        
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, formattedPhone))
          .limit(1);

        let user;

        if (existingUsers.length > 0) {
          // User exists - login
          user = existingUsers[0];
          
          // Update phone_verified and last sign in
          await db
            .update(users)
            .set({
              phoneVerified: true,
              lastSignedIn: new Date(),
            })
            .where(eq(users.id, user.id));
          
          console.log(`[Phone Auth] Existing user logged in: ${user.id}`);
        } else {
          // New user - register
          if (!name || name.trim().length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Name is required for new user registration",
            });
          }

          const insertResult = await db.insert(users).values({
            phoneNumber: formattedPhone,
            countryCode: countryCode,
            phoneVerified: true,
            name: name.trim(),
            role: role,
            loginMethod: "phone",
            emailVerified: false,
            verified: role === "patient", // Patients auto-verified, clinicians need admin approval
            lastSignedIn: new Date(),
          });

          // Fetch the newly created user
          const newUsers = await db
            .select()
            .from(users)
            .where(eq(users.phoneNumber, formattedPhone))
            .limit(1);

          user = newUsers[0];
          console.log(`[Phone Auth] New user registered: ${user.id}`);
        }

        // Generate JWT token
        const token = generateJWT({
          userId: user.id,
          email: user.email || "",
          role: user.role,
          tokenVersion: user.tokenVersion || 0,
        });

        return {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            verified: user.verified,
            phoneVerified: user.phoneVerified,
          },
          isNewUser: existingUsers.length === 0,
        };
      } catch (error: any) {
        console.error("[Phone Auth] Error verifying OTP:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to verify code",
        });
      }
    }),

  /**
   * Link phone number to existing account (for users who already have email login)
   */
  linkPhoneToAccount: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        phoneNumber: z.string(),
        countryCode: z.string().default("+964"),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, phoneNumber, countryCode, code } = input;

      // Format phone number
      const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);

      try {
        // Verify OTP code
        const verification = await verifyPhoneCode(formattedPhone, code);

        if (!verification.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification code",
          });
        }

        // Check if phone number is already used by another account
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }
        
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, formattedPhone))
          .limit(1);

        if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Phone number already linked to another account",
          });
        }

        // Link phone number to account
        await db
          .update(users)
          .set({
            phoneNumber: formattedPhone,
            countryCode: countryCode,
            phoneVerified: true,
          })
          .where(eq(users.id, userId));

        console.log(`[Phone Auth] Phone number linked to user: ${userId}`);

        return {
          success: true,
          message: "Phone number linked successfully",
        };
      } catch (error: any) {
        console.error("[Phone Auth] Error linking phone:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to link phone number",
        });
      }
    }),
});
