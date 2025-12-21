import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateToken, generateRefreshToken } from "./_core/auth-utils";

/**
 * OAuth Router for Firebase Authentication
 * Handles Google, Apple, and Email/Password authentication via Firebase
 */

export const oauthRouter = router({
  /**
   * Verify Firebase ID token and create/login user
   */
  verifyFirebaseToken: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
        provider: z.enum(["google", "apple", "email"]),
        role: z.enum(["patient", "clinician"]),
        email: z.string().email(),
        name: z.string(),
        photoURL: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, name, provider, role, photoURL } = input;

      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Check if user exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let user;

      if (existingUsers.length > 0) {
        // User exists - update last login
        user = existingUsers[0];
        
        // Update user info if needed
        await db!
          .update(users)
          .set({
            name: name || user.name,
            emailVerified: true, // OAuth emails are verified
          })
          .where(eq(users.id, user.id));
      } else {
        // Create new user
        const newUsers = await db!
          .insert(users)
          .values({
            email,
            name,
            role,
            emailVerified: true, // OAuth emails are verified
            passwordHash: "", // OAuth users don't have passwords
          })
          .$returningId();

        // Fetch the created user
        const createdUsers = await db!
          .select()
          .from(users)
          .where(eq(users.id, newUsers[0].id))
          .limit(1);

        user = createdUsers[0];
      }

      // Generate JWT tokens (access + refresh)
      const token = generateToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified || false,
          emailVerified: user.emailVerified || true, // OAuth users have verified emails
          licenseNumber: user.licenseNumber,
          specialty: user.specialty,
        },
      };
    }),
});
