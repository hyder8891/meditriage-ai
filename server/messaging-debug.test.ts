import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { users, messages } from '../drizzle/schema';
import { eq, and, or, desc } from 'drizzle-orm';

describe('Messaging Debug Tests', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');
  });

  it('should list all users with messages', async () => {
    // Get all unique sender and recipient IDs from messages
    const allMessages = await db!
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(20);

    console.log('\n=== Recent Messages ===');
    for (const msg of allMessages) {
      console.log(`ID: ${msg.id}, From: ${msg.senderId}, To: ${msg.recipientId}, Read: ${msg.read}`);
      console.log(`  Content: ${msg.content?.substring(0, 50)}...`);
    }

    expect(allMessages).toBeDefined();
  });

  it('should get user details for message participants', async () => {
    // Get all unique user IDs from messages
    const allMessages = await db!
      .select({
        senderId: messages.senderId,
        recipientId: messages.recipientId,
      })
      .from(messages)
      .limit(100);

    const userIds = new Set<number>();
    for (const msg of allMessages) {
      userIds.add(msg.senderId);
      userIds.add(msg.recipientId);
    }

    console.log('\n=== Users with Messages ===');
    for (const userId of userIds) {
      const [user] = await db!
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        console.log(`User ${user.id}: ${user.name} (${user.role}) - ${user.email}`);
      } else {
        console.log(`User ${userId}: NOT FOUND IN DATABASE`);
      }
    }

    expect(userIds.size).toBeGreaterThan(0);
  });

  it('should test getConversations logic', async () => {
    // Simulate the getConversations query for a specific user
    // First, find a user who has messages
    const [firstMessage] = await db!
      .select()
      .from(messages)
      .limit(1);

    if (!firstMessage) {
      console.log('No messages found in database');
      return;
    }

    const testUserId = firstMessage.recipientId;
    console.log(`\n=== Testing getConversations for user ${testUserId} ===`);

    // Get all messages for this user (same logic as in b2b2c-router)
    const userMessages = await db!
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, testUserId),
          eq(messages.recipientId, testUserId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    console.log(`Found ${userMessages.length} messages for user ${testUserId}`);

    // Group by conversation
    const conversationsMap = new Map();
    
    for (const msg of userMessages) {
      const otherUserId = msg.senderId === testUserId 
        ? msg.recipientId 
        : msg.senderId;

      if (!conversationsMap.has(otherUserId)) {
        // Fetch the other user's details
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

        console.log(`Other user ${otherUserId}:`, otherUser ? `${otherUser.name} (${otherUser.role})` : 'NOT FOUND');

        conversationsMap.set(otherUserId, {
          otherUser,
          latestMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (msg.recipientId === testUserId && !msg.read) {
        const conv = conversationsMap.get(otherUserId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    }

    console.log(`\nTotal conversations: ${conversationsMap.size}`);
    for (const [userId, conv] of conversationsMap) {
      console.log(`  - With user ${userId}: ${conv.otherUser?.name || 'Unknown'}, unread: ${conv.unreadCount}`);
    }

    expect(conversationsMap.size).toBeGreaterThanOrEqual(0);
  });

  it('should check for orphaned messages (messages with non-existent users)', async () => {
    const allMessages = await db!
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
      })
      .from(messages);

    const orphanedMessages: { id: number; senderId: number; recipientId: number; issue: string }[] = [];

    for (const msg of allMessages) {
      const [sender] = await db!
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, msg.senderId))
        .limit(1);

      const [recipient] = await db!
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, msg.recipientId))
        .limit(1);

      if (!sender || !recipient) {
        orphanedMessages.push({
          ...msg,
          issue: !sender ? 'Sender not found' : 'Recipient not found',
        });
      }
    }

    console.log('\n=== Orphaned Messages ===');
    if (orphanedMessages.length === 0) {
      console.log('No orphaned messages found');
    } else {
      for (const msg of orphanedMessages) {
        console.log(`Message ${msg.id}: ${msg.issue} (sender: ${msg.senderId}, recipient: ${msg.recipientId})`);
      }
    }

    // This is informational, not a failure
    expect(true).toBe(true);
  });
});
