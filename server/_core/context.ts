import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyToken, extractTokenFromHeader } from "./auth-utils";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // First try JWT token from Authorization header (custom auth)
    const authHeader = opts.req.headers.authorization;
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          // Get user from database
          const db = await getDb();
          if (db) {
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, decoded.userId))
              .limit(1);
            
            if (dbUser) {
              user = dbUser;
              console.log('[Context] Authenticated via JWT:', user.id, user.email, user.role);
            }
          }
        }
      }
    }
    
    // Fallback to Manus OAuth if JWT auth failed
    if (!user) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
