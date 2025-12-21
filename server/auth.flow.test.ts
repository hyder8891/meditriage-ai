import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword, generateToken, verifyToken } from "./_core/auth-utils";

describe("Authentication Flow", () => {
  let testToken: string;
  const testUserId = 12345;
  const testEmail = "doctor.test@meditriage.com";
  const testRole = "clinician";

  describe("Password Hashing", () => {
    it("should hash and verify password correctly", async () => {
      const password = "Test@1234";
      const hash = await hashPassword(password);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT Token Generation and Verification", () => {
    it("should generate valid JWT token", () => {
      testToken = generateToken({
        userId: testUserId,
        email: testEmail,
        role: testRole,
      });
      
      expect(testToken).toBeTruthy();
      expect(typeof testToken).toBe("string");
    });

    it("should verify and decode JWT token correctly", () => {
      const decoded = verifyToken(testToken);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
      expect(decoded?.role).toBe(testRole);
    });

    it("should reject invalid token", () => {
      const invalidToken = "invalid.token.here";
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe("Token Persistence", () => {
    it("should maintain token structure for localStorage", () => {
      // Simulate what happens in the frontend
      const authState = {
        token: testToken,
        user: {
          id: testUserId,
          email: testEmail,
          role: testRole,
        },
        isAuthenticated: true,
      };
      
      // Serialize to localStorage format
      const serialized = JSON.stringify(authState);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.token).toBe(testToken);
      expect(deserialized.user.id).toBe(testUserId);
      expect(deserialized.isAuthenticated).toBe(true);
      
      // Verify the token still works after serialization
      const decoded = verifyToken(deserialized.token);
      expect(decoded?.userId).toBe(testUserId);
    });
  });
});
