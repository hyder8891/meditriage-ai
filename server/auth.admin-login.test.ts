import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Admin Login Authentication", () => {
  let mockContext: Context;

  beforeAll(() => {
    // Mock context with request and response objects
    mockContext = {
      req: {} as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
      user: null,
    };
  });

  it("should seed admin user successfully", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const result = await caller.seedAdmin.seedAdmin({ force: false });
    
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });

  it("should login with admin/admin credentials", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // First ensure admin exists
    await caller.seedAdmin.seedAdmin({ force: true });
    
    // Try to login
    const result = await caller.auth.login({
      email: "admin",
      password: "admin",
    });
    
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("admin");
    expect(result.user.role).toBe("admin");
  });

  it("should reject invalid credentials", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    await expect(
      caller.auth.login({
        email: "admin",
        password: "wrongpassword",
      })
    ).rejects.toThrow();
  });

  it("should reject non-existent user", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "password",
      })
    ).rejects.toThrow();
  });
});
