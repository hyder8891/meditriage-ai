import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, doctorPatientRelationships, messages } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("B2B2C Messaging System", () => {
  let testPatientId: number;
  let testDoctorId: number;
  let relationshipId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test patient
    const [patientResult] = await db.insert(users).values({
      name: "Test Patient",
      email: `test-patient-${Date.now()}@example.com`,
      role: "patient",
      phoneNumber: `+964770${Date.now().toString().slice(-7)}`,
      phoneVerified: true,
      loginMethod: "phone",
    });
    testPatientId = Number(patientResult.insertId);

    // Create test doctor
    const [doctorResult] = await db.insert(users).values({
      name: "Test Doctor",
      email: `test-doctor-${Date.now()}@example.com`,
      role: "clinician",
      specialty: "General Practice",
      availabilityStatus: "available",
      phoneNumber: `+964770${Date.now().toString().slice(-7)}1`,
      phoneVerified: true,
      loginMethod: "phone",
    });
    testDoctorId = Number(doctorResult.insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (relationshipId) {
      await db.delete(doctorPatientRelationships).where(eq(doctorPatientRelationships.id, relationshipId));
    }
    if (testPatientId) {
      await db.delete(messages).where(eq(messages.senderId, testPatientId));
      await db.delete(messages).where(eq(messages.recipientId, testPatientId));
      await db.delete(users).where(eq(users.id, testPatientId));
    }
    if (testDoctorId) {
      await db.delete(messages).where(eq(messages.senderId, testDoctorId));
      await db.delete(messages).where(eq(messages.recipientId, testDoctorId));
      await db.delete(users).where(eq(users.id, testDoctorId));
    }
  });

  it("should create doctor-patient relationship", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create relationship
    const [result] = await db.insert(doctorPatientRelationships).values({
      doctorId: testDoctorId,
      patientId: testPatientId,
      relationshipType: "primary",
      status: "active",
      canViewRecords: true,
      canPrescribe: true,
      canMessage: true,
      canScheduleAppointments: true,
    });

    relationshipId = Number(result.insertId);
    expect(relationshipId).toBeGreaterThan(0);

    // Verify relationship exists
    const [relationship] = await db
      .select()
      .from(doctorPatientRelationships)
      .where(eq(doctorPatientRelationships.id, relationshipId))
      .limit(1);

    expect(relationship).toBeDefined();
    expect(relationship.doctorId).toBe(testDoctorId);
    expect(relationship.patientId).toBe(testPatientId);
    expect(relationship.status).toBe("active");
    expect(relationship.canMessage).toBe(true);
  });

  it("should allow messaging after relationship is created", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Verify relationship exists and is active
    const [relationship] = await db
      .select()
      .from(doctorPatientRelationships)
      .where(
        and(
          eq(doctorPatientRelationships.patientId, testPatientId),
          eq(doctorPatientRelationships.doctorId, testDoctorId)
        )
      )
      .limit(1);

    expect(relationship).toBeDefined();
    expect(relationship.status).toBe("active");
    expect(relationship.canMessage).toBe(true);

    // Send message from patient to doctor
    const [messageResult] = await db.insert(messages).values({
      senderId: testPatientId,
      recipientId: testDoctorId,
      content: "Hello Doctor, I need help with my symptoms",
      read: false,
    });

    const messageId = Number(messageResult.insertId);
    expect(messageId).toBeGreaterThan(0);

    // Verify message was created
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    expect(message).toBeDefined();
    expect(message.senderId).toBe(testPatientId);
    expect(message.recipientId).toBe(testDoctorId);
    expect(message.content).toBe("Hello Doctor, I need help with my symptoms");
    expect(message.read).toBe(false);
  });

  it("should retrieve conversation between doctor and patient", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get all messages between patient and doctor
    const conversation = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, testPatientId),
          eq(messages.recipientId, testDoctorId)
        )
      );

    expect(conversation.length).toBeGreaterThan(0);
    expect(conversation[0].senderId).toBe(testPatientId);
    expect(conversation[0].recipientId).toBe(testDoctorId);
  });
});
