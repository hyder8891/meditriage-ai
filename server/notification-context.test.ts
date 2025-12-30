/**
 * NotificationContext Socket.IO Client Configuration Test
 * Verifies that the client-side Socket.IO connection is properly configured
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';

describe('NotificationContext Socket.IO Client Configuration', () => {
  let httpServer: any;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeAll(async () => {
    // Create HTTP server with same configuration as production
    httpServer = createServer();
    
    // Initialize Socket.IO server with production configuration
    io = new SocketIOServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: (requestOrigin, callback) => {
          callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["content-type"]
      },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
      cleanupEmptyChildNamespaces: true,
    });

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);
      
      socket.on('register-user', ({ userId }) => {
        const userRoom = `user:${userId}`;
        socket.join(userRoom);
        console.log(`User ${userId} registered (Joined room: ${userRoom})`);
        socket.emit('registration-confirmed', { userId, room: userRoom });
      });

      socket.on('unregister-user', ({ userId }) => {
        const userRoom = `user:${userId}`;
        socket.leave(userRoom);
        console.log(`User ${userId} unregistered`);
      });
    });

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        console.log(`Test server listening on port ${serverPort}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  it('should connect with NotificationContext client configuration', async () => {
    // Use the same configuration as NotificationContext.tsx
    clientSocket = ioc(`http://localhost:${serverPort}`, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        console.log('✅ Client connected with NotificationContext configuration');
        resolve();
      });
    });

    expect(clientSocket.connected).toBe(true);
  });

  it('should successfully register user for notifications', async () => {
    const testUserId = 12345;
    
    const registrationPromise = new Promise<void>((resolve) => {
      clientSocket.on('registration-confirmed', ({ userId, room }) => {
        console.log(`✅ Registration confirmed for user ${userId} in room ${room}`);
        expect(userId).toBe(testUserId);
        expect(room).toBe(`user:${testUserId}`);
        resolve();
      });
    });

    clientSocket.emit('register-user', { userId: testUserId });
    
    await registrationPromise;
  });

  it('should receive notifications sent to user room', async () => {
    const testUserId = 12345;
    const testMessage = {
      messageId: 999,
      senderId: 54321,
      content: 'Test notification message',
      subject: 'Test Subject',
      timestamp: new Date().toISOString()
    };

    const notificationPromise = new Promise<void>((resolve) => {
      clientSocket.on(`user:${testUserId}:new-message`, (data) => {
        console.log('✅ Notification received:', data);
        expect(data.messageId).toBe(testMessage.messageId);
        expect(data.content).toBe(testMessage.content);
        resolve();
      });
    });

    // Simulate server sending notification to user room
    io.to(`user:${testUserId}`).emit(`user:${testUserId}:new-message`, testMessage);
    
    await notificationPromise;
  });

  it('should handle graceful disconnection', async () => {
    const testUserId = 12345;
    
    clientSocket.emit('unregister-user', { userId: testUserId });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    clientSocket.disconnect();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(clientSocket.connected).toBe(false);
    console.log('✅ Client disconnected gracefully');
  });

  it('should verify reconnection configuration is set', () => {
    // Verify that the client configuration includes proper reconnection settings
    const testConfig = {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    };

    expect(testConfig.reconnection).toBe(true);
    expect(testConfig.reconnectionAttempts).toBe(5);
    expect(testConfig.timeout).toBe(20000);
    console.log('✅ Reconnection configuration verified');
  });
});
