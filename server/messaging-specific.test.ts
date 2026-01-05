import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { users, messages } from '../drizzle/schema';
import { eq, and, or, desc } from 'drizzle-orm';

describe('Specific Messaging Test - Hhwaljanabi and Wen', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  const DOCTOR_ID = 900067; // Hhwaljanabi
  const PATIENT_ID = 3630002; // Wen

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');
  });

  it('should find both users', async () => {
    const [doctor] = await db!
      .select()
      .from(users)
      .where(eq(users.id, DOCTOR_ID))
      .limit(1);

    const [patient] = await db!
      .select()
      .from(users)
      .where(eq(users.id, PATIENT_ID))
      .limit(1);

    console.log('Doctor:', doctor ? `${doctor.name} (${doctor.role})` : 'NOT FOUND');
    console.log('Patient:', patient ? `${patient.name} (${patient.role})` : 'NOT FOUND');

    expect(doctor).toBeDefined();
    expect(patient).toBeDefined();
  });

  it('should find messages between them', async () => {
    const conversation = await db!
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, DOCTOR_ID),
            eq(messages.recipientId, PATIENT_ID)
          ),
          and(
            eq(messages.senderId, PATIENT_ID),
            eq(messages.recipientId, DOCTOR_ID)
          )
        )
      )
      .orderBy(desc(messages.createdAt));

    console.log(`\nFound ${conversation.length} messages between doctor and patient:`);
    for (const msg of conversation) {
      const direction = msg.senderId === DOCTOR_ID ? 'Doctor -> Patient' : 'Patient -> Doctor';
      console.log(`  [${msg.id}] ${direction}: "${msg.content?.substring(0, 50)}..." (read: ${msg.read})`);
    }

    expect(conversation.length).toBeGreaterThan(0);
  });

  it('should simulate getConversations for doctor', async () => {
    console.log(`\n=== Simulating getConversations for Doctor (${DOCTOR_ID}) ===`);
    
    // Get all messages for doctor
    const userMessages = await db!
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, DOCTOR_ID),
          eq(messages.recipientId, DOCTOR_ID)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    console.log(`Found ${userMessages.length} total messages for doctor`);

    // Group by conversation
    const conversationsMap = new Map();
    
    for (const msg of userMessages) {
      const otherUserId = msg.senderId === DOCTOR_ID 
        ? msg.recipientId 
        : msg.senderId;

      if (!conversationsMap.has(otherUserId)) {
        const [otherUser] = await db!
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phoneNumber: users.phoneNumber,
            role: users.role,
            specialty: users.specialty,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        // Create display name
        let displayName = otherUser?.name || '';
        if (!displayName || displayName.startsWith('User ')) {
          displayName = otherUser?.phoneNumber || otherUser?.email || `User ${otherUserId}`;
        }

        conversationsMap.set(otherUserId, {
          otherUser: otherUser ? { ...otherUser, displayName } : null,
          latestMessage: msg,
          unreadCount: 0,
        });

        console.log(`  Conversation with ${otherUserId}: ${otherUser ? displayName : 'USER NOT FOUND'}`);
      }

      // Count unread messages
      if (msg.recipientId === DOCTOR_ID && !msg.read) {
        const conv = conversationsMap.get(otherUserId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    }

    console.log(`\nTotal conversations for doctor: ${conversationsMap.size}`);
    
    // Check if patient conversation exists
    const patientConv = conversationsMap.get(PATIENT_ID);
    console.log(`\nPatient (${PATIENT_ID}) conversation:`, patientConv ? {
      otherUser: patientConv.otherUser?.displayName,
      latestMessage: patientConv.latestMessage?.content?.substring(0, 50),
      unreadCount: patientConv.unreadCount,
    } : 'NOT FOUND');

    // The issue: if otherUser is null, the conversation won't show
    for (const [userId, conv] of conversationsMap) {
      if (!conv.otherUser) {
        console.log(`\n⚠️ WARNING: Conversation with user ${userId} has NULL otherUser - this won't display!`);
      }
    }

    expect(conversationsMap.size).toBeGreaterThan(0);
  });

  it('should simulate getConversations for patient', async () => {
    console.log(`\n=== Simulating getConversations for Patient (${PATIENT_ID}) ===`);
    
    // Get all messages for patient
    const userMessages = await db!
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, PATIENT_ID),
          eq(messages.recipientId, PATIENT_ID)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    console.log(`Found ${userMessages.length} total messages for patient`);

    // Group by conversation
    const conversationsMap = new Map();
    
    for (const msg of userMessages) {
      const otherUserId = msg.senderId === PATIENT_ID 
        ? msg.recipientId 
        : msg.senderId;

      if (!conversationsMap.has(otherUserId)) {
        const [otherUser] = await db!
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phoneNumber: users.phoneNumber,
            role: users.role,
            specialty: users.specialty,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        // Create display name
        let displayName = otherUser?.name || '';
        if (!displayName || displayName.startsWith('User ')) {
          displayName = otherUser?.phoneNumber || otherUser?.email || `User ${otherUserId}`;
        }

        conversationsMap.set(otherUserId, {
          otherUser: otherUser ? { ...otherUser, displayName } : null,
          latestMessage: msg,
          unreadCount: 0,
        });

        console.log(`  Conversation with ${otherUserId}: ${otherUser ? displayName : 'USER NOT FOUND'}`);
      }

      // Count unread messages
      if (msg.recipientId === PATIENT_ID && !msg.read) {
        const conv = conversationsMap.get(otherUserId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    }

    console.log(`\nTotal conversations for patient: ${conversationsMap.size}`);
    
    // Check if doctor conversation exists
    const doctorConv = conversationsMap.get(DOCTOR_ID);
    console.log(`\nDoctor (${DOCTOR_ID}) conversation:`, doctorConv ? {
      otherUser: doctorConv.otherUser?.displayName,
      latestMessage: doctorConv.latestMessage?.content?.substring(0, 50),
      unreadCount: doctorConv.unreadCount,
    } : 'NOT FOUND');

    expect(conversationsMap.size).toBeGreaterThan(0);
  });
});
