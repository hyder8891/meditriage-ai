import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeBatchScheduler } from "./batch-scheduler";
import { 
  securityHeaders, 
  sanitizeInput, 
  requestSizeLimiter,
  apiLimiter,
  detectSuspiciousActivity,
  logAudit,
  getClientIp
} from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Security middleware - MUST be first
  app.use(securityHeaders);
  app.use(requestSizeLimiter);
  
  // Suspicious activity detection
  app.use((req, res, next) => {
    const { suspicious, reasons } = detectSuspiciousActivity(req);
    if (suspicious) {
      logAudit({
        action: 'security.suspicious_activity',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        details: { reasons, path: req.path },
        success: false,
      });
      console.warn('[SECURITY] Suspicious activity detected:', reasons);
    }
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Input sanitization
  app.use(sanitizeInput);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // AEC error reporting endpoint
  const { handleErrorReport } = await import("../aec/error-reporter.js");
  app.post("/api/aec/report-error", handleErrorReport);
  // tRPC API with rate limiting
  app.use(
    "/api/trpc",
    apiLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // AEC Sentinel: 404 handler (must be after all other routes)
  const { notFoundHandler, errorHandler } = await import("../aec/sentinel-layer.js");
  app.use(notFoundHandler);
  
  // AEC Sentinel: Error handler (must be last middleware)
  app.use(errorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize automated batch processing scheduler
    initializeBatchScheduler();
    
    // Initialize AEC alert system (daily reports at 8 AM and 8 PM)
    const { initializeAlertSystem } = await import("../aec/alerts/index.js");
    initializeAlertSystem();
    
    // Initialize AEC Sentinel (error monitoring)
    const { initializeSentinel } = await import("../aec/sentinel-layer.js");
    initializeSentinel();
  });
}

startServer().catch(console.error);
