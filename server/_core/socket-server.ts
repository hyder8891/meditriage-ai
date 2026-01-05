import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

let io: SocketIOServer | null = null;

// Allowed origins for WebSocket connections
const ALLOWED_ORIGINS = [
  // Production domains
  'https://tabibi.clinic',
  'https://www.tabibi.clinic',
  'https://meditriage.ai',
  'https://www.meditriage.ai',
  // Manus preview domains
  /^https:\/\/.*\.manus\.space$/,
  /^https:\/\/.*\.manus-asia\.computer$/,
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Validate if an origin is allowed for WebSocket connections
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Allow server-to-server connections (no origin header)
    return true;
  }
  
  for (const allowed of ALLOWED_ORIGINS) {
    if (typeof allowed === 'string') {
      if (origin === allowed) return true;
    } else if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return true;
    }
  }
  
  // In development, allow all origins
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

export function initializeSocketServer(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      // Validate origins against allowlist
      origin: (requestOrigin, callback) => {
        if (isOriginAllowed(requestOrigin)) {
          callback(null, true);
        } else {
          console.warn(`[Socket.IO] Rejected connection from unauthorized origin: ${requestOrigin}`);
          callback(new Error('Origin not allowed'), false);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["content-type"]
    },
    // Reliability settings for Iraq's mobile networks
    pingTimeout: 20000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    
    // Connection state recovery for flaky networks
    connectionStateRecovery: {
      // Max duration to keep connection state (2 minutes)
      maxDisconnectionDuration: 2 * 60 * 1000,
      // Skip middleware on recovery (faster reconnection)
      skipMiddlewares: true,
    },
    
    // Clean up stale connections aggressively
    cleanupEmptyChildNamespaces: true,
  });

  // ---------------------------------------------------------
  // 🔴 SCALABILITY: Redis Adapter Configuration
  // ---------------------------------------------------------
  if (process.env.REDIS_URL) {
    // Create separate clients for Pub/Sub (Required by socket.io)
    // TLS configuration for secure Redis connections (Upstash)
    const pubClient = new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false }
    });
    const subClient = pubClient.duplicate();

    // Error handling to prevent app crashes if Redis blips
    const handleRedisError = (err: Error) => console.error("[Redis Error]", err.message);
    pubClient.on('error', handleRedisError);
    subClient.on('error', handleRedisError);

    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin;
    
    // ---------------------------------------------------------
    // 1. SCALABLE USER REGISTRATION (Using Rooms)
    // ---------------------------------------------------------
    socket.on('register-user', ({ userId }) => {
      // Instead of a Map, we join a "personal room"
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
    });

    socket.on('unregister-user', ({ userId }) => {
      const userRoom = `user:${userId}`;
      socket.leave(userRoom);
    });

    // ---------------------------------------------------------
    // 2. CONSULTATION ROOMS
    // ---------------------------------------------------------
    socket.on('join-room', async ({ roomId, userId, role }) => {
      socket.join(roomId);
      
      // Notify others in the room (Redis handles broadcasting across servers)
      socket.to(roomId).emit('user-joined', { userId, socketId: socket.id, role });
      
      // Fetch participants: With Redis, we ask the adapter who is in the room
      const socketsInRoom = await io?.in(roomId).fetchSockets();
      const existingParticipants = socketsInRoom
        ?.filter(s => s.id !== socket.id)
        .map(s => s.id) || [];

      socket.emit('existing-participants', existingParticipants);
    });

    socket.on('leave-room', ({ roomId, userId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
    });

    // ---------------------------------------------------------
    // 3. WebRTC SIGNALING (P2P Handshake)
    // ---------------------------------------------------------
    socket.on('offer', ({ offer, to }) => {
      socket.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, to }) => {
      socket.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // ---------------------------------------------------------
    // 4. CHAT & UTILITIES
    // ---------------------------------------------------------
    socket.on('chat-message', ({ roomId, message, sender, senderName }) => {
      io?.to(roomId).emit('chat-message', {
        message,
        sender,
        senderName,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('start-screen-share', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-started', { userId, socketId: socket.id });
    });

    socket.on('stop-screen-share', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-stopped', { userId });
    });

    socket.on('consultation-status', ({ roomId, status }) => {
      socket.to(roomId).emit('consultation-status-update', { status });
    });

    socket.on('disconnect', (reason) => {
      // Redis Adapter automatically handles removing socket from rooms
    });
    
    // Handle connection errors explicitly
    socket.on('error', (err) => {
      console.error(`Socket error on ${socket.id}:`, err);
    });
    
    // Heartbeat to detect zombie connections
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}

/**
 * Emit a notification to a specific user securely and scalably.
 * Uses the Redis Room pattern to find the user on ANY server.
 */
export function emitNotificationToUser(userId: number, event: string, data: unknown) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot send notification');
    return;
  }
  
  // Backward compatibility: 
  // We send to the "user:ID" room, but keep the event name structure 
  // your frontend expects (`user:ID:event`).
  const userRoom = `user:${userId}`;
  const specificEventName = `user:${userId}:${event}`;
  
  io.to(userRoom).emit(specificEventName, data);
}
