import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, consultations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Consultation Notification Tests', () => {
  let testPatientId: number;
  let testDoctorId: number;
  let testConsultationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const timestamp = Date.now();
    
    // Create test patient
    const [patient] = await db.insert(users).values({
      name: "Test Patient",
      email: `patient${timestamp}@test.com`,
      phoneNumber: `+96477011${timestamp.toString().slice(-5)}`,
      role: "patient",
    });
    testPatientId = patient.insertId;

    // Create test doctor
    const [doctor] = await db.insert(users).values({
      name: "Dr. Test Doctor",
      email: `doctor${timestamp}@test.com`,
      phoneNumber: `+96477022${timestamp.toString().slice(-5)}`,
      role: "clinician",
      specialty: "Cardiology",
    });
    testDoctorId = doctor.insertId;

    // Create test consultation
    const [consultation] = await db.insert(consultations).values({
      patientId: testPatientId,
      clinicianId: testDoctorId,
      scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
      status: "scheduled",
      roomId: `test-room-${timestamp}`,
    });
    testConsultationId = consultation.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    await db.delete(consultations).where(eq(consultations.id, testConsultationId));
    await db.delete(users).where(eq(users.id, testPatientId));
    await db.delete(users).where(eq(users.id, testDoctorId));
  });

  it('should have consultation with scheduled status', async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, testConsultationId))
      .limit(1);

    expect(consultation).toBeDefined();
    expect(consultation.status).toBe('scheduled');
    expect(consultation.patientId).toBe(testPatientId);
    expect(consultation.clinicianId).toBe(testDoctorId);
  });

  it('should have valid patient and doctor records', async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, testPatientId))
      .limit(1);

    const [doctor] = await db
      .select()
      .from(users)
      .where(eq(users.id, testDoctorId))
      .limit(1);

    expect(patient).toBeDefined();
    expect(patient.role).toBe('patient');
    expect(doctor).toBeDefined();
    expect(doctor.role).toBe('clinician');
  });

  it('should update consultation status to in_progress', async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Update status to in_progress (simulating doctor joining)
    await db
      .update(consultations)
      .set({ 
        status: 'in_progress',
        startTime: new Date(),
      })
      .where(eq(consultations.id, testConsultationId));

    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, testConsultationId))
      .limit(1);

    expect(consultation.status).toBe('in_progress');
    expect(consultation.startTime).toBeDefined();
  });

  it('should allow patient to join consultation with in_progress status', async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, testConsultationId))
      .limit(1);

    // Verify consultation is joinable (status is scheduled, waiting, or in_progress)
    const joinableStatuses = ['scheduled', 'waiting', 'in_progress'];
    expect(joinableStatuses).toContain(consultation.status);
    expect(consultation.roomId).toBeDefined();
  });
});
