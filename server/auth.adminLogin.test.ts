import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import bcrypt from "bcrypt";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("auth.adminLogin", () => {
  let testUserId: number;
  const testEmail = "test-admin@meditriage.test";
  const testPassword = "TestPassword123!";

  beforeAll(async () => {
    // Create a test admin user
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Clean up any existing test user
    await db.delete(users).where(eq(users.email, testEmail));
    
    // Insert test user
    const result = await db.insert(users).values({
      email: testEmail,
      passwordHash: passwordHash,
      role: "admin",
      loginMethod: "email",
      name: "Test Admin",
      openId: `test_${Date.now()}`,
      lastSignedIn: new Date(),
    });
    
    testUserId = Number(result[0].insertId);
  });

  it("should successfully login with correct credentials", async () => {
    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
        hostname: "test.local",
      } as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
      user: null,
    };

    const caller = appRouter.createCaller(mockContext);
    const result = await caller.auth.adminLogin({
      username: testEmail,
      password: testPassword,
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
    expect(result.user?.role).toBe("admin");
  });

  it("should fail with incorrect password", async () => {
    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
        hostname: "test.local",
      } as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
      user: null,
    };

    const caller = appRouter.createCaller(mockContext);
    const result = await caller.auth.adminLogin({
      username: testEmail,
      password: "wrongpassword",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid credentials");
  });

  it("should fail with non-existent email", async () => {
    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
        hostname: "test.local",
      } as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
      user: null,
    };

    const caller = appRouter.createCaller(mockContext);
    const result = await caller.auth.adminLogin({
      username: "nonexistent@test.com",
      password: "anypassword",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid credentials");
  });
});
