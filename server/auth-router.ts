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
  isValidEmail,
  isValidPassword,
  generateRandomToken,
  generateTokenExpiry,
} from "./_core/auth-utils";

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
      });

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

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
      });

      return {
        success: true,
        token,
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
   * Logout (client-side token removal, but we can track it server-side if needed)
   */
  logout: publicProcedure.mutation(async () => {
    return {
      success: true,
      message: "Logged out successfully",
    };
  }),
});
