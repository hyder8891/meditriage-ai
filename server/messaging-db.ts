import { getDb } from "./db";
import { messages, users } from "../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { emitNotificationToUser } from "./_core/socket-server";
import { sendMessageNotification } from "./services/email";

export async function sendMessage(data: {
  senderId: number;
  recipientId: number;
  subject?: string;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [message] = await db.insert(messages).values({
    senderId: data.senderId,
    recipientId: data.recipientId,
    subject: data.subject,
    content: data.content,
    read: false,
  });
  
  // Emit real-time notification to recipient
  try {
    emitNotificationToUser(data.recipientId, 'new-message', {
      messageId: message.insertId,
      senderId: data.senderId,
      content: data.content,
      subject: data.subject,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to emit message notification:', error);
  }
  
  // Send email notification to recipient
  try {
    // Get sender and recipient details
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.senderId))
      .limit(1);
    
    const [recipient] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.recipientId))
      .limit(1);
    
    if (sender && recipient && recipient.email) {
      // Truncate message preview to 100 characters
      const messagePreview = data.content.length > 100 
        ? data.content.substring(0, 100) + "..."
        : data.content;
      
      const conversationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://app.manus.space"}/messages/${data.senderId}`;
      
      sendMessageNotification({
        recipientName: recipient.name || "User",
        recipientEmail: recipient.email,
        senderName: sender.name || "User",
        messagePreview,
        conversationUrl,
        language: "ar",
      }).catch(err => console.error("[Messaging] Failed to send email notification:", err));
    }
  } catch (error) {
    console.error('[Messaging] Error sending email notification:', error);
  }
  
  return message;
}

export async function getMessagesBetweenUsers(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
      )
    )
    .orderBy(desc(messages.createdAt));
}

export async function getMessagesByRecipient(recipientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return db
    .select()
    .from(messages)
    .where(eq(messages.recipientId, recipientId))
    .orderBy(desc(messages.createdAt));
}

export async function getMessagesBySender(senderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return db
    .select()
    .from(messages)
    .where(eq(messages.senderId, senderId))
    .orderBy(desc(messages.createdAt));
}

export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db
    .update(messages)
    .set({ read: true, readAt: new Date() })
    .where(eq(messages.id, messageId));
}

export async function getUnreadMessageCount(recipientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const unreadMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.recipientId, recipientId), eq(messages.read, false)));
  return unreadMessages.length;
}

export async function deleteMessage(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.delete(messages).where(eq(messages.id, messageId));
}
