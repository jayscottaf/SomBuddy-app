import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from "fs";

const app = express();
// Increase JSON payload size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Add special handlers for main.tsx and other client assets that might be requested incorrectly
    app.get('/src/main.tsx', (req, res) => {
      console.log('Redirecting /src/main.tsx request to proper asset path');
      res.redirect('/assets/index.js');
    });
    
    // Handle other assets that might be requested with incorrect paths
    app.get('/src/*', (req, res, next) => {
      const requestedPath = req.path;
      console.log(`Received request for ${requestedPath}, checking for alternative locations`);
      
      // Try to map to correct asset paths
      const assetPath = requestedPath.replace('/src/', '/assets/');
      const possiblePaths = [
        { check: `./dist/public${assetPath}`, serve: assetPath },
        { check: `./dist/public/assets/index.js`, serve: '/assets/index.js' }
      ];
      
      // Check if any alternative path exists
      for (const { check, serve } of possiblePaths) {
        if (fs.existsSync(check)) {
          console.log(`Redirecting ${requestedPath} to ${serve}`);
          return res.redirect(serve);
        }
      }
      
      // If we can't find an alternative, log the error and continue to next handler
      console.log(`No alternative found for ${requestedPath}`);
      next();
    });
    
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
