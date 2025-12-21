/**
 * Socket.IO Redis Adapter Integration Test
 * Verifies that Socket.IO is using Redis adapter for scalable messaging
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';

describe('Socket.IO Redis Adapter', () => {
  let httpServer: any;
  let io: SocketIOServer;
  let pubClient: Redis;
  let subClient: Redis;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeAll(async () => {
    // Verify REDIS_URL is configured
    expect(process.env.REDIS_URL).toBeDefined();

    // Create test server
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: { origin: "*" }
    });

    // Configure Redis adapter
    pubClient = new Redis(process.env.REDIS_URL!, {
      tls: { rejectUnauthorized: false }
    });
    subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as any).port;
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
      httpServer.close();
    }
    if (pubClient) {
      await pubClient.quit();
    }
    if (subClient) {
      await subClient.quit();
    }
  });

  it('should connect client to Socket.IO server with Redis adapter', async () => {
    return new Promise<void>((resolve, reject) => {
      clientSocket = ioc(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        console.log('✅ Client connected to Socket.IO with Redis adapter');
        resolve();
      });

      clientSocket.on('connect_error', (error) => {
        reject(error);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  }, 10000);

  it('should handle room-based messaging through Redis', async () => {
    return new Promise<void>((resolve, reject) => {
      const testRoom = `test-room-${Date.now()}`;
      const testMessage = 'Hello from Redis!';

      io.on('connection', (socket) => {
        socket.on('join-test-room', ({ roomId }) => {
          socket.join(roomId);
          socket.emit('joined-room', { roomId });
        });

        socket.on('send-test-message', ({ roomId, message }) => {
          io.to(roomId).emit('test-message', { message });
        });
      });

      clientSocket.emit('join-test-room', { roomId: testRoom });

      clientSocket.on('joined-room', ({ roomId }) => {
        expect(roomId).toBe(testRoom);
        clientSocket.emit('send-test-message', { roomId: testRoom, message: testMessage });
      });

      clientSocket.on('test-message', ({ message }) => {
        expect(message).toBe(testMessage);
        console.log('✅ Room-based messaging working through Redis');
        resolve();
      });

      setTimeout(() => reject(new Error('Message timeout')), 5000);
    });
  }, 10000);

  it('should handle user-specific notifications through Redis rooms', async () => {
    return new Promise<void>((resolve, reject) => {
      const testUserId = 12345;
      const testEvent = 'notification';
      const testData = { title: 'Test Notification', message: 'Redis is working!' };

      io.on('connection', (socket) => {
        socket.on('register-user', ({ userId }) => {
          const userRoom = `user:${userId}`;
          socket.join(userRoom);
          socket.emit('user-registered', { userId });
        });
      });

      clientSocket.emit('register-user', { userId: testUserId });

      clientSocket.on('user-registered', ({ userId }) => {
        expect(userId).toBe(testUserId);
        
        // Simulate server sending notification to user
        const userRoom = `user:${testUserId}`;
        const eventName = `user:${testUserId}:${testEvent}`;
        io.to(userRoom).emit(eventName, testData);
      });

      clientSocket.on(`user:${testUserId}:${testEvent}`, (data) => {
        expect(data).toEqual(testData);
        console.log('✅ User-specific notifications working through Redis');
        resolve();
      });

      setTimeout(() => reject(new Error('Notification timeout')), 5000);
    });
  }, 10000);
});
