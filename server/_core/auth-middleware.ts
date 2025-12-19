import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create();
import { verifyToken } from "./auth-utils";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware to verify JWT token and attach user to context
 */
export const authMiddleware = t.middleware(async ({ ctx, next }: any) => {
  // Extract token from Authorization header
  const authHeader = ctx.req.headers.authorization;
  
  if (!authHeader) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No authorization token provided",
    });
  }

  // Extract token (supports "Bearer <token>" format)
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  // Get user from database
  const db = await getDb();
  const [user] = await db!
    .select()
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  // Attach user to context
  return next({
    ctx: {
      ...ctx,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        emailVerified: user.emailVerified,
        licenseNumber: user.licenseNumber,
        specialty: user.specialty,
      },
    },
  });
});

/**
 * Middleware to check if user is a patient
 */
export const patientMiddleware = authMiddleware.unstable_pipe(async ({ ctx, next }: any) => {
  if (ctx.user.role !== "patient") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Patient role required.",
    });
  }

  return next({ ctx });
});

/**
 * Middleware to check if user is a clinician
 */
export const clinicianMiddleware = authMiddleware.unstable_pipe(async ({ ctx, next }: any) => {
  if (ctx.user.role !== "clinician") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Clinician role required.",
    });
  }

  if (!ctx.user.verified) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your clinician account is pending verification.",
    });
  }

  return next({ ctx });
});

/**
 * Middleware to check if user is an admin
 */
export const adminMiddleware = authMiddleware.unstable_pipe(async ({ ctx, next }: any) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Admin role required.",
    });
  }

  return next({ ctx });
});
