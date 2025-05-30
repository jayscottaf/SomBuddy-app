import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite"; // Import setupVite and serveStatic


const app = express();
// Redirect www.sombuddy.ai → sombuddy.ai
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.startsWith('www.')) {
    const redirectUrl = `https://${host.replace(/^www\\./, '')}${req.url}`;
    return res.redirect(301, redirectUrl);
  }
  next();
});
// Force production mode if running the built version
if (process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'production';
}

// Log environment for debugging
console.log(`APP ENV: ${process.env.NODE_ENV}`);

// Increase JSON payload size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
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
  
  // HEAD method handler for root path
  app.head('/', (_req, res) => {
    console.log('HEAD request to root path - returning 200 OK');
    // Always return a successful status for HEAD requests (used by health checks)
    res.status(200).end();
  });
  
  // Special handler for GET requests to root from Kubernetes probes
  app.get('/', (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Check if request is from a Kubernetes probe
    if (userAgent.includes('kube-probe')) {
      console.log('Kubernetes probe GET request detected - returning immediate success');
      return res.status(200).json({ status: 'healthy', probe: true });
    }
    
    // Otherwise pass to next handler
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("SETUP ENV:", process.env.NODE_ENV);
  
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development environment");
    await setupVite(app, server);
  } else {
    console.log("Setting up production static file serving");
    // Add special handlers for main.tsx and other client assets that might be requested incorrectly
    app.get('/src/main.tsx', (req, res) => {
      console.log('Redirecting /src/main.tsx request to proper asset path');
      res.redirect('/assets/index.js');
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
