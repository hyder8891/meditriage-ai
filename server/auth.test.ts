import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock context for testing
const createMockContext = (): TrpcContext => ({
  req: {
    headers: {},
  } as any,
  res: {
    clearCookie: () => {},
  } as any,
  user: null,
});

describe("Authentication System", () => {
  let testPatientEmail: string;
  let testClinicianEmail: string;
  let patientToken: string;
  let clinicianToken: string;

  beforeAll(() => {
    // Generate unique emails for this test run
    const timestamp = Date.now();
    testPatientEmail = `test-patient-${timestamp}@example.com`;
    testClinicianEmail = `test-clinician-${timestamp}@example.com`;
  });

  describe("Patient Registration", () => {
    it("should register a new patient successfully", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.auth.registerPatient({
        name: "Test Patient",
        email: testPatientEmail,
        password: "SecurePass123",
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testPatientEmail);
      expect(result.user.role).toBe("patient");

      patientToken = result.token;
    });

    it("should reject duplicate email registration", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.registerPatient({
          name: "Another Patient",
          email: testPatientEmail,
          password: "SecurePass123",
        })
      ).rejects.toThrow("Email already registered");
    });

    it("should reject weak passwords", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.registerPatient({
          name: "Test Patient",
          email: `weak-pass-${Date.now()}@example.com`,
          password: "weak",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid email format", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.registerPatient({
          name: "Test Patient",
          email: "invalid-email",
          password: "SecurePass123",
        })
      ).rejects.toThrow();
    });
  });

  describe("Clinician Registration", () => {
    it("should register a new clinician successfully", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.auth.registerClinician({
        name: "Dr. Test Clinician",
        email: testClinicianEmail,
        password: "SecurePass123",
        licenseNumber: "MED-12345",
        specialty: "General Medicine",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("review");
      expect(result.user.role).toBe("clinician");
      expect(result.user.verified).toBe(false);
    });

    it("should require all clinician fields", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.registerClinician({
          name: "Dr. Test",
          email: `clinician-${Date.now()}@example.com`,
          password: "SecurePass123",
          licenseNumber: "",
          specialty: "Cardiology",
        })
      ).rejects.toThrow();
    });
  });

  describe("Login", () => {
    it("should login patient with correct credentials", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.auth.login({
        email: testPatientEmail,
        password: "SecurePass123",
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.role).toBe("patient");
    });

    it("should reject login with wrong password", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.login({
          email: testPatientEmail,
          password: "WrongPassword123",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should reject login with non-existent email", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.login({
          email: "nonexistent@example.com",
          password: "SecurePass123",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should reject unverified clinician login", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.login({
          email: testClinicianEmail,
          password: "SecurePass123",
        })
      ).rejects.toThrow("pending admin verification");
    });
  });

  describe("Get Current User", () => {
    it("should return user data with valid token", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.auth.me({
        token: patientToken,
      });

      expect(result).toBeDefined();
      expect(result?.email).toBe(testPatientEmail);
      expect(result?.role).toBe("patient");
    });

    it("should reject invalid token", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.auth.me({
          token: "invalid-token",
        })
      ).rejects.toThrow();
    });
  });

  describe("Logout", () => {
    it("should logout successfully", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
      expect(result.message).toContain("Logged out");
    });
  });

  describe("Cleanup", () => {
    it("should clean up test users", async () => {
      const db = await getDb();

      // Delete test users
      await db!.delete(users).where(eq(users.email, testPatientEmail));
      await db!.delete(users).where(eq(users.email, testClinicianEmail));

      // Verify deletion
      const [patient] = await db!
        .select()
        .from(users)
        .where(eq(users.email, testPatientEmail))
        .limit(1);

      expect(patient).toBeUndefined();
    });
  });
});
