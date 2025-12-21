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
    console.log('[Context] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'null');
    
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      console.log('[Context] Extracted token:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (token) {
        const decoded = verifyToken(token);
        console.log('[Context] Decoded token:', decoded);
        
        if (decoded) {
          // Get user from database
          const db = await getDb();
          if (db) {
            console.log('[Context] Looking up user with ID:', decoded.userId);
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, decoded.userId))
              .limit(1);
            
            console.log('[Context] DB user found:', dbUser ? `${dbUser.id} - ${dbUser.email}` : 'null');
            
            if (dbUser) {
              // Validate tokenVersion to allow immediate revocation
              const currentTokenVersion = dbUser.tokenVersion || 0;
              const tokenVersionInJWT = decoded.tokenVersion || 0;
              
              if (tokenVersionInJWT !== currentTokenVersion) {
                console.log(
                  `[Context] ❌ Token revoked: JWT version ${tokenVersionInJWT} != DB version ${currentTokenVersion}`
                );
                // Token is stale (password changed or logout-all triggered)
                user = null;
              } else {
                user = dbUser;
                console.log('[Context] ✅ Authenticated via JWT:', user.id, user.email, user.role);
              }
            }
          } else {
            console.log('[Context] ❌ Failed to get database connection');
          }
        } else {
          console.log('[Context] ❌ Token verification failed');
        }
      }
    } else {
      console.log('[Context] No Authorization header found');
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
