import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, consultations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Consultation System", () => {
  // Increase timeout for database operations
  const hookTimeout = 30000;
  let patientId: number;
  let clinicianId: number;
  let consultationId: number;
  let patientCaller: any;
  let clinicianCaller: any;

  beforeAll(async () => {
    const db = await getDb();

    // Create test patient
    const [patient] = await db!
      .insert(users)
      .values({
        openId: "test-patient-consultation",
        name: "Test Patient",
        email: "patient-consultation@test.com",
        role: "patient",
      })
      .$returningId();
    patientId = patient.id;

    // Create test clinician
    const [clinician] = await db!
      .insert(users)
      .values({
        openId: "test-clinician-consultation",
        name: "Dr. Test",
        email: "clinician-consultation@test.com",
        role: "clinician",
      })
      .$returningId();
    clinicianId = clinician.id;

    // Create callers with authenticated contexts
    const patientUser: AuthenticatedUser = {
      id: patientId,
      openId: "test-patient-consultation",
      name: "Test Patient",
      email: "patient-consultation@test.com",
      role: "patient",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const clinicianUser: AuthenticatedUser = {
      id: clinicianId,
      openId: "test-clinician-consultation",
      name: "Dr. Test",
      email: "clinician-consultation@test.com",
      role: "clinician",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    patientCaller = appRouter.createCaller(createTestContext(patientUser));
    clinicianCaller = appRouter.createCaller(createTestContext(clinicianUser));
  }, hookTimeout);

  afterAll(async () => {
    const db = await getDb();

    // Clean up test data
    if (consultationId) {
      await db!.delete(consultations).where(eq(consultations.id, consultationId));
    }
    await db!.delete(users).where(eq(users.id, patientId));
    await db!.delete(users).where(eq(users.id, clinicianId));
  }, hookTimeout);

  describe("Booking Consultations", () => {
    it("should allow patient to book a consultation", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const result = await patientCaller.consultation.book({
        doctorId: clinicianId,
        scheduledAt,
        consultationType: "video",
        reason: "Test consultation booking",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.patientId).toBe(patientId);
      expect(result.clinicianId).toBe(clinicianId);
      expect(result.status).toBe("scheduled");

      consultationId = result.id;
    });

    it("should allow clinician to create a consultation", async () => {
      const scheduledTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now

      const result = await clinicianCaller.consultation.create({
        patientId,
        clinicianId,
        scheduledTime: scheduledTime.toISOString(),
        chiefComplaint: "Follow-up consultation",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe("scheduled");
    });
  });

  describe("Consultation Retrieval", () => {
    it("should allow patient to get their consultations", async () => {
      const result = await patientCaller.consultation.getMy();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const consultation = result.find((c: any) => c.id === consultationId);
      expect(consultation).toBeDefined();
      expect(consultation?.patientId).toBe(patientId);
    });

    it("should allow clinician to get their consultations", async () => {
      const result = await clinicianCaller.consultation.getMy();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const consultation = result.find((c: any) => c.id === consultationId);
      expect(consultation).toBeDefined();
      expect(consultation?.clinicianId).toBe(clinicianId);
    });

    it("should allow authorized user to get consultation by ID", async () => {
      const result = await patientCaller.consultation.getById({
        id: consultationId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(consultationId);
      expect(result.patientId).toBe(patientId);
    });

    it("should prevent unauthorized access to consultation", async () => {
      // Create another patient
      const db = await getDb();
      const [otherPatient] = await db!
        .insert(users)
        .values({
          openId: "test-other-patient",
          name: "Other Patient",
          email: "other-patient@test.com",
          role: "patient",
        })
        .$returningId();

      const otherPatientUser: AuthenticatedUser = {
        id: otherPatient.id,
        openId: "test-other-patient",
        name: "Other Patient",
        email: "other-patient@test.com",
        role: "patient",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const otherPatientCaller = appRouter.createCaller(createTestContext(otherPatientUser));

      await expect(
        otherPatientCaller.consultation.getById({ id: consultationId })
      ).rejects.toThrow();

      // Clean up
      await db!.delete(users).where(eq(users.id, otherPatient.id));
    });
  });

  describe("Consultation Lifecycle", () => {
    it("should allow starting a consultation", async () => {
      const result = await clinicianCaller.consultation.start({
        id: consultationId,
      });

      expect(result.success).toBe(true);

      // Verify status changed
      const consultation = await patientCaller.consultation.getById({
        id: consultationId,
      });
      expect(consultation.status).toBe("in-progress");
    });

    it("should allow clinician to save notes during consultation", async () => {
      const result = await clinicianCaller.consultation.saveNotes({
        id: consultationId,
        notes: "Patient presents with test symptoms. Recommended test treatment.",
      });

      expect(result.success).toBe(true);

      // Verify notes were saved
      const consultation = await clinicianCaller.consultation.getById({
        id: consultationId,
      });
      expect(consultation.notes).toContain("test symptoms");
    });

    it("should allow clinician to end consultation", async () => {
      const result = await clinicianCaller.consultation.end({
        id: consultationId,
        notes: "Consultation completed successfully",
        diagnosis: "Test diagnosis",
        prescriptionGenerated: false,
      });

      expect(result.success).toBe(true);

      // Verify status changed
      const consultation = await patientCaller.consultation.getById({
        id: consultationId,
      });
      expect(consultation.status).toBe("completed");
      expect(consultation.diagnosis).toBe("Test diagnosis");
    });

    it("should allow patient to rate completed consultation", async () => {
      const result = await patientCaller.consultation.rate({
        id: consultationId,
        rating: 5,
        feedback: "Excellent consultation, very helpful!",
      });

      expect(result.success).toBe(true);

      // Verify rating was saved
      const consultation = await patientCaller.consultation.getById({
        id: consultationId,
      });
      expect(consultation.patientRating).toBe(5);
      expect(consultation.patientFeedback).toBe("Excellent consultation, very helpful!");
    });
  });

  describe("Consultation Cancellation", () => {
    it("should allow patient to cancel their consultation", async () => {
      // Create a new consultation to cancel
      const scheduledAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days from now

      const newConsultation = await patientCaller.consultation.book({
        doctorId: clinicianId,
        scheduledAt,
        consultationType: "video",
        reason: "Test cancellation",
      });

      const cancelResult = await patientCaller.consultation.cancel({
        consultationId: newConsultation.id,
      });

      expect(cancelResult.success).toBe(true);

      // Verify status changed
      const consultation = await patientCaller.consultation.getById({
        id: newConsultation.id,
      });
      expect(consultation.status).toBe("cancelled");

      // Clean up
      const db = await getDb();
      await db!.delete(consultations).where(eq(consultations.id, newConsultation.id));
    });

    it("should allow clinician to cancel consultation", async () => {
      // Create a new consultation to cancel
      const scheduledTime = new Date(Date.now() + 96 * 60 * 60 * 1000); // 4 days from now

      const newConsultation = await clinicianCaller.consultation.create({
        patientId,
        clinicianId,
        scheduledTime: scheduledTime.toISOString(),
        chiefComplaint: "Test clinician cancellation",
      });

      const cancelResult = await clinicianCaller.consultation.cancel({
        consultationId: newConsultation.id,
      });

      expect(cancelResult.success).toBe(true);

      // Verify status changed
      const consultation = await clinicianCaller.consultation.getById({
        id: newConsultation.id,
      });
      expect(consultation.status).toBe("cancelled");

      // Clean up
      const db = await getDb();
      await db!.delete(consultations).where(eq(consultations.id, newConsultation.id));
    });
  });

  describe("Consultation Status Management", () => {
    it("should allow updating consultation status", async () => {
      // Create a new consultation
      const scheduledTime = new Date(Date.now() + 120 * 60 * 60 * 1000); // 5 days from now

      const newConsultation = await clinicianCaller.consultation.create({
        patientId,
        clinicianId,
        scheduledTime: scheduledTime.toISOString(),
        chiefComplaint: "Test status update",
      });

      const updateResult = await clinicianCaller.consultation.updateStatus({
        id: newConsultation.id,
        status: "waiting",
      });

      expect(updateResult.success).toBe(true);

      // Verify status changed
      const consultation = await clinicianCaller.consultation.getById({
        id: newConsultation.id,
      });
      expect(consultation.status).toBe("waiting");

      // Clean up
      const db = await getDb();
      await db!.delete(consultations).where(eq(consultations.id, newConsultation.id));
    });
  });

  describe("Chat Transcript", () => {
    it("should allow saving chat transcript", async () => {
      const messages = [
        { sender: "patient", message: "Hello doctor", timestamp: new Date() },
        { sender: "clinician", message: "Hello, how can I help?", timestamp: new Date() },
      ];

      const result = await patientCaller.consultation.saveChatTranscript({
        id: consultationId,
        messages,
      });

      expect(result.success).toBe(true);

      // Verify transcript was saved
      const consultation = await patientCaller.consultation.getById({
        id: consultationId,
      });
      expect(consultation.chatTranscript).toBeDefined();
    });
  });
});
