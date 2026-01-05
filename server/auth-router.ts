// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  isValidEmail,
  isValidPassword,
  generateRandomToken,
  generateTokenExpiry,
} from "./_core/auth-utils";
import { rateLimit } from "./_core/rate-limit";
import { sendWelcomeEmail, sendEmailVerification } from "./services/email";

export const authRouter = router({
  /**
   * Patient registration
   */
  registerPatient: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      // Rate limit: 3 registration attempts per 10 minutes per email
      await rateLimit(input.email, "register", 3, 600);

      const db = await getDb();

      // Validate email format
      if (!isValidEmail(input.email)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email format",
        });
      }

      // Validate password strength
      const passwordValidation = isValidPassword(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.message || "Invalid password",
        });
      }

      // Check if user already exists
      const existingUser = await db!
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Generate verification token
      const verificationToken = generateRandomToken();
      const verificationTokenExpiry = generateTokenExpiry(24); // 24 hours

      // Create user
      const [newUser] = await db!.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: "patient",
        loginMethod: "email",
        emailVerified: false, // Will be true after email verification
        verificationToken,
        verificationTokenExpiry,
        verified: true, // Patient accounts are auto-verified
      });

      // Generate JWT token
      const token = generateToken({
        userId: newUser.insertId,
        email: input.email,
        role: "patient",
        tokenVersion: 0, // New user starts with version 0
      });

      // Send welcome email (async, don't wait)
      sendWelcomeEmail({
        userName: input.name,
        userEmail: input.email,
        userRole: "patient",
        language: "ar", // Default to Arabic for Iraqi users
      }).catch(err => console.error("[Auth] Failed to send welcome email:", err));

      // Send email verification (async, don't wait)
      const verificationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://app.manus.space"}/verify-email?token=${verificationToken}`;
      sendEmailVerification({
        userName: input.name,
        userEmail: input.email,
        verificationToken,
        verificationUrl,
        language: "ar",
      }).catch(err => console.error("[Auth] Failed to send verification email:", err));

      return {
        success: true,
        token,
        user: {
          id: newUser.insertId,
          name: input.name,
          email: input.email,
          role: "patient",
        },
      };
    }),

  /**
   * Clinician registration
   */
  registerClinician: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        licenseNumber: z.string().min(3, "License number is required"),
        specialty: z.string().min(2, "Specialty is required"),
      })
    )
    .mutation(async ({ input }) => {
      // Rate limit: 3 registration attempts per 10 minutes per email
      await rateLimit(input.email, "register", 3, 600);

      const db = await getDb();

      // Validate email format
      if (!isValidEmail(input.email)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email format",
        });
      }

      // Validate password strength
      const passwordValidation = isValidPassword(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.message || "Invalid password",
        });
      }

      // Check if user already exists
      const existingUser = await db!
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Generate verification token
      const verificationToken = generateRandomToken();
      const verificationTokenExpiry = generateTokenExpiry(24); // 24 hours

      // Create clinician user (requires admin verification)
      const [newUser] = await db!.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: "clinician",
        loginMethod: "email",
        licenseNumber: input.licenseNumber,
        specialty: input.specialty,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
        verified: false, // Clinicians require admin verification
      });

      // Send welcome email (async, don't wait)
      sendWelcomeEmail({
        userName: input.name,
        userEmail: input.email,
        userRole: "clinician",
        language: "ar", // Default to Arabic for Iraqi users
      }).catch(err => console.error("[Auth] Failed to send welcome email:", err));

      // Send email verification (async, don't wait)
      const verificationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://app.manus.space"}/verify-email?token=${verificationToken}`;
      sendEmailVerification({
        userName: input.name,
        userEmail: input.email,
        verificationToken,
        verificationUrl,
        language: "ar",
      }).catch(err => console.error("[Auth] Failed to send verification email:", err));

      return {
        success: true,
        message: "Registration submitted. Your account will be reviewed by an administrator.",
        user: {
          id: newUser.insertId,
          name: input.name,
          email: input.email,
          role: "clinician",
          verified: false,
        },
      };
    }),

  /**
   * Login (unified for all user types)
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      // Rate limit: 5 login attempts per 10 minutes per email
      await rateLimit(input.email, "login", 5, 600);

      const db = await getDb();

      // Find user by email
      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if clinician is verified
      if (user.role === "clinician" && !user.verified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is pending admin verification. Please check back later.",
        });
      }

      // Update last signed in
      await db!
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT tokens (access + refresh)
      const token = generateToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });

      return {
        success: true,
        token,
        refreshToken, // Return refresh token to frontend
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: user.verified,
          emailVerified: user.emailVerified,
        },
      };
    }),

  /**
   * Get current user from token
   */
  me: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Verify token
      const decoded = await import("./_core/auth-utils").then(m => m.verifyToken(input.token));

      if (!decoded) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
      }

      // Get user from database
      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

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
        role: user.role,
        verified: user.verified,
        emailVerified: user.emailVerified,
        licenseNumber: user.licenseNumber,
        specialty: user.specialty,
      };
    }),

  /**
   * Refresh access token using refresh token
   * Called automatically by frontend when access token expires
   */
  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Verify refresh token
      const payload = verifyRefreshToken(input.refreshToken);

      if (!payload) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
        });
      }

      // Check if user exists and tokenVersion matches
      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if tokenVersion matches (for revocation)
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token has been revoked",
        });
      }

      // Generate new access token
      const newToken = generateToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });

      return {
        success: true,
        token: newToken,
      };
    }),

  /**
   * Logout (client-side token removal)
   */
  logout: publicProcedure.mutation(async () => {
    return {
      success: true,
      message: "Logged out successfully",
    };
  }),
  
  /**
   * Revoke all tokens for a user (logout from all devices)
   * Increments tokenVersion to invalidate all existing JWTs
   */
  revokeAllTokens: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        token: z.string(), // Current valid token required for authorization
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Verify the current token
      const decoded = verifyToken(input.token);
      
      if (!decoded || decoded.userId !== input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid token or unauthorized",
        });
      }
      
      // Increment tokenVersion to revoke all tokens
      await db!
        .update(users)
        .set({ 
          tokenVersion: (decoded.tokenVersion || 0) + 1 
        })
        .where(eq(users.id, input.userId));
      
      console.log(
        `[Auth] Revoked all tokens for user ${input.userId} (version: ${decoded.tokenVersion} -> ${decoded.tokenVersion + 1})`
      );
      
      return {
        success: true,
        message: "All tokens revoked successfully. Please log in again.",
      };
    }),
});
