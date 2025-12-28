import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./_core/auth-utils";

export const seedAdminRouter = router({
  /**
   * Seed admin user - creates admin/admin if it doesn't exist
   */
  seedAdmin: publicProcedure
    .input(z.object({
      force: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Check if admin user already exists
      const existingAdmin = await db!
        .select()
        .from(users)
        .where(eq(users.email, "admin"))
        .limit(1);
      
      if (existingAdmin.length > 0 && !input.force) {
        return {
          success: true,
          message: "Admin user already exists",
          existed: true,
        };
      }
      
      // Hash the password
      const passwordHash = await hashPassword("admin");
      
      if (existingAdmin.length > 0) {
        // Update existing admin
        await db!
          .update(users)
          .set({
            passwordHash,
            role: "admin",
            verified: true,
            emailVerified: true,
          })
          .where(eq(users.email, "admin"));
        
        return {
          success: true,
          message: "Admin user updated successfully",
          existed: true,
        };
      } else {
        // Create new admin user
        await db!.insert(users).values({
          name: "Admin User",
          email: "admin",
          passwordHash,
          role: "admin",
          loginMethod: "email",
          verified: true,
          emailVerified: true,
          tokenVersion: 0,
        });
        
        return {
          success: true,
          message: "Admin user created successfully",
          existed: false,
        };
      }
    }),
});
