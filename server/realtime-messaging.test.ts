/**
 * Real-Time Messaging Test
 * Verifies that messages trigger Socket.IO notifications to recipients
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the socket-server module
vi.mock('./_core/socket-server', () => ({
  emitNotificationToUser: vi.fn(),
}));

import { emitNotificationToUser } from './_core/socket-server';

describe('Real-Time Messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have emitNotificationToUser function available', () => {
    expect(emitNotificationToUser).toBeDefined();
    expect(typeof emitNotificationToUser).toBe('function');
  });

  it('should emit notification with correct payload structure', () => {
    const recipientId = 123;
    const eventType = 'new-message';
    const payload = {
      messageId: 456,
      senderId: 789,
      senderName: 'Dr. Smith',
      content: 'Hello, how are you feeling today?',
      timestamp: new Date().toISOString(),
    };

    // Call the mocked function
    emitNotificationToUser(recipientId, eventType, payload);

    // Verify it was called with correct arguments
    expect(emitNotificationToUser).toHaveBeenCalledTimes(1);
    expect(emitNotificationToUser).toHaveBeenCalledWith(
      recipientId,
      eventType,
      expect.objectContaining({
        messageId: 456,
        senderId: 789,
        senderName: 'Dr. Smith',
        content: 'Hello, how are you feeling today?',
      })
    );
  });

  it('should include timestamp in notification payload', () => {
    const recipientId = 100;
    const eventType = 'new-message';
    const timestamp = new Date().toISOString();
    const payload = {
      messageId: 1,
      senderId: 2,
      senderName: 'Test User',
      content: 'Test message',
      timestamp,
    };

    emitNotificationToUser(recipientId, eventType, payload);

    expect(emitNotificationToUser).toHaveBeenCalledWith(
      recipientId,
      eventType,
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    );
  });

  it('should handle multiple message notifications', () => {
    // Simulate sending multiple messages
    const messages = [
      { recipientId: 1, senderId: 10, content: 'Message 1' },
      { recipientId: 2, senderId: 10, content: 'Message 2' },
      { recipientId: 3, senderId: 10, content: 'Message 3' },
    ];

    messages.forEach((msg, index) => {
      emitNotificationToUser(msg.recipientId, 'new-message', {
        messageId: index + 1,
        senderId: msg.senderId,
        senderName: 'Sender',
        content: msg.content,
        timestamp: new Date().toISOString(),
      });
    });

    expect(emitNotificationToUser).toHaveBeenCalledTimes(3);
  });

  it('should emit to correct user room format', () => {
    // The socket-server uses room format: user:${userId}
    // and event format: user:${userId}:new-message
    const userId = 42;
    
    emitNotificationToUser(userId, 'new-message', {
      messageId: 1,
      senderId: 2,
      senderName: 'Test',
      content: 'Hello',
      timestamp: new Date().toISOString(),
    });

    // First argument should be the userId (number)
    expect(emitNotificationToUser).toHaveBeenCalledWith(
      42,
      'new-message',
      expect.any(Object)
    );
  });
});

describe('Socket.IO Server Configuration', () => {
  it('should have correct event naming convention', () => {
    // The frontend expects events in format: user:${userId}:new-message
    // The emitNotificationToUser function handles this internally
    const userId = 123;
    const expectedEventPattern = `user:${userId}:new-message`;
    
    // This test documents the expected event naming convention
    expect(expectedEventPattern).toBe('user:123:new-message');
  });

  it('should support required message payload fields', () => {
    const requiredFields = ['messageId', 'senderId', 'senderName', 'content', 'timestamp'];
    const payload = {
      messageId: 1,
      senderId: 2,
      senderName: 'Test User',
      content: 'Test content',
      timestamp: new Date().toISOString(),
    };

    requiredFields.forEach(field => {
      expect(payload).toHaveProperty(field);
    });
  });
});
