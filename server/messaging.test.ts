import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { users, messages } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';

describe('Messaging System', () => {
  let doctorId: number;
  let patientId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Find or create a doctor user
    const doctors = await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'doctor'), eq(users.role, 'clinician')))
      .limit(1);

    if (doctors.length > 0) {
      doctorId = doctors[0].id;
    } else {
      throw new Error('No doctor found in database');
    }

    // Find or create a patient user
    const patients = await db
      .select()
      .from(users)
      .where(eq(users.role, 'patient'))
      .limit(1);

    if (patients.length > 0) {
      patientId = patients[0].id;
    } else {
      throw new Error('No patient found in database');
    }
  });

  it('should allow sending messages between doctor and patient', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Send message from doctor to patient
    const [result] = await db.insert(messages).values({
      senderId: doctorId,
      recipientId: patientId,
      content: 'Test message from doctor to patient',
      read: false,
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);

    // Verify message was created
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, result.insertId))
      .limit(1);

    expect(message).toBeDefined();
    expect(message.senderId).toBe(doctorId);
    expect(message.recipientId).toBe(patientId);
    expect(message.content).toBe('Test message from doctor to patient');
    expect(message.read).toBe(false);
  });

  it('should allow sending messages from patient to doctor', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Send message from patient to doctor
    const [result] = await db.insert(messages).values({
      senderId: patientId,
      recipientId: doctorId,
      content: 'Test message from patient to doctor',
      read: false,
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);

    // Verify message was created
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, result.insertId))
      .limit(1);

    expect(message).toBeDefined();
    expect(message.senderId).toBe(patientId);
    expect(message.recipientId).toBe(doctorId);
    expect(message.content).toBe('Test message from patient to doctor');
    expect(message.read).toBe(false);
  });

  it('should retrieve conversation between doctor and patient', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get all messages between doctor and patient
    const conversation = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, doctorId),
            eq(messages.recipientId, patientId)
          ),
          and(
            eq(messages.senderId, patientId),
            eq(messages.recipientId, doctorId)
          )
        )
      );

    expect(conversation).toBeDefined();
    expect(conversation.length).toBeGreaterThan(0);
  });

  it('should mark messages as read', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Create a new message
    const [result] = await db.insert(messages).values({
      senderId: doctorId,
      recipientId: patientId,
      content: 'Test message for read status',
      read: false,
    });

    const messageId = result.insertId;

    // Mark as read
    await db
      .update(messages)
      .set({ read: true, readAt: new Date() })
      .where(eq(messages.id, messageId));

    // Verify message is marked as read
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    expect(message.read).toBe(true);
    expect(message.readAt).toBeDefined();
  });

  it('should count unread messages correctly', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get unread count for patient
    const unreadMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, patientId),
          eq(messages.read, false)
        )
      );

    expect(unreadMessages).toBeDefined();
    expect(Array.isArray(unreadMessages)).toBe(true);
  });
});
