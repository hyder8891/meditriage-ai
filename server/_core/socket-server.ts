import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocketServer(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store active rooms and participants
  const rooms = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join consultation room
    socket.on('join-room', ({ roomId, userId, role }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)?.add(socket.id);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { userId, socketId: socket.id, role });
      
      // Send existing participants to the new user
      const existingParticipants = Array.from(rooms.get(roomId) || []).filter(id => id !== socket.id);
      socket.emit('existing-participants', existingParticipants);

      console.log(`User ${userId} (${role}) joined room ${roomId}`);
    });

    // WebRTC signaling
    socket.on('offer', ({ offer, to }) => {
      socket.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, to }) => {
      socket.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Chat messages
    socket.on('chat-message', ({ roomId, message, sender, senderName }) => {
      io?.to(roomId).emit('chat-message', {
        message,
        sender,
        senderName,
        timestamp: new Date().toISOString()
      });
    });

    // Screen sharing
    socket.on('start-screen-share', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-started', { userId, socketId: socket.id });
    });

    socket.on('stop-screen-share', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-stopped', { userId });
    });

    // Consultation status updates
    socket.on('consultation-status', ({ roomId, status }) => {
      socket.to(roomId).emit('consultation-status-update', { status });
    });

    // Leave room
    socket.on('leave-room', ({ roomId, userId }) => {
      socket.leave(roomId);
      rooms.get(roomId)?.delete(socket.id);
      
      if (rooms.get(roomId)?.size === 0) {
        rooms.delete(roomId);
      }

      socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
      console.log(`User ${userId} left room ${roomId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from all rooms
      rooms.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          socket.to(roomId).emit('user-left', { socketId: socket.id });
          
          if (participants.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
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
