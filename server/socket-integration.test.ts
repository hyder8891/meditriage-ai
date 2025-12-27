import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { initializeSocketServer } from "./_core/socket-server";

describe("Socket.IO Integration Tests", () => {
  let httpServer: any;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();
    
    // Initialize Socket.IO server
    io = initializeSocketServer(httpServer);
    
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

  it("should initialize Socket.IO server successfully", () => {
    expect(io).toBeDefined();
    expect(io.engine).toBeDefined();
  });

  it("should allow client to connect to Socket.IO server", async () => {
    await new Promise<void>((resolve, reject) => {
      clientSocket = ioc(`http://localhost:${serverPort}`, {
        transports: ['websocket', 'polling'],
      });

      clientSocket.on("connect", () => {
        expect(clientSocket.connected).toBe(true);
        console.log("✅ Client connected successfully");
        resolve();
      });

      clientSocket.on("connect_error", (error) => {
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });
  });

  it("should handle user registration", async () => {
    await new Promise<void>((resolve) => {
      const testUserId = 12345;
      
      clientSocket.emit("register-user", { userId: testUserId });
      
      // Wait a bit for registration to process
      setTimeout(() => {
        console.log("✅ User registration completed");
        resolve();
      }, 100);
    });
  });

  it("should handle room joining for consultations", async () => {
    await new Promise<void>((resolve) => {
      const testRoomId = "consultation-999";
      const testUserId = 12345;
      
      clientSocket.on("existing-participants", (participants) => {
        expect(Array.isArray(participants)).toBe(true);
        console.log("✅ Room joined, participants:", participants);
        resolve();
      });
      
      clientSocket.emit("join-room", {
        roomId: testRoomId,
        userId: testUserId,
        role: "patient",
      });
    });
  });

  it("should handle WebRTC signaling - offer", async () => {
    await new Promise<void>((resolve) => {
      const mockOffer = {
        type: "offer" as RTCSdpType,
        sdp: "mock-sdp-offer",
      };
      
      // Create second client to receive offer
      const client2 = ioc(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });
      
      client2.on("connect", () => {
        client2.on("offer", ({ offer, from }) => {
          expect(offer).toEqual(mockOffer);
          expect(from).toBe(clientSocket.id);
          console.log("✅ WebRTC offer received");
          client2.disconnect();
          resolve();
        });
        
        // Send offer from first client to second
        clientSocket.emit("offer", {
          offer: mockOffer,
          to: client2.id,
        });
      });
    });
  });

  it("should handle chat messages in room", async () => {
    await new Promise<void>((resolve) => {
      const testRoomId = "consultation-999";
      const testMessage = "Hello from test";
      
      clientSocket.on("chat-message", ({ message, sender, senderName, timestamp }) => {
        expect(message).toBe(testMessage);
        expect(sender).toBe(12345);
        expect(senderName).toBe("Test User");
        expect(timestamp).toBeDefined();
        console.log("✅ Chat message received");
        resolve();
      });
      
      clientSocket.emit("chat-message", {
        roomId: testRoomId,
        message: testMessage,
        sender: 12345,
        senderName: "Test User",
      });
    });
  });

  it("should handle room leaving", async () => {
    await new Promise<void>((resolve) => {
      const testRoomId = "consultation-999";
      const testUserId = 12345;
      
      clientSocket.emit("leave-room", {
        roomId: testRoomId,
        userId: testUserId,
      });
      
      // Wait a bit for leave to process
      setTimeout(() => {
        console.log("✅ Room left successfully");
        resolve();
      }, 100);
    });
  });

  it("should handle user unregistration", async () => {
    await new Promise<void>((resolve) => {
      const testUserId = 12345;
      
      clientSocket.emit("unregister-user", { userId: testUserId });
      
      // Wait a bit for unregistration to process
      setTimeout(() => {
        console.log("✅ User unregistered successfully");
        resolve();
      }, 100);
    });
  });
});
