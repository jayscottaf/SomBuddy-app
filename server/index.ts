import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import fs from "fs";

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

  // Dedicated debug route that always shows details
  app.get('/debug-build', async (_req, res) => {
    // Show detailed debugging info
    const paths = [
      './dist/public/index.html',
      './dist/client/index.html',
      './public/index.html',
      './client/index.html',
      '../dist/public/index.html'
    ];
    
    const results = paths.map(p => {
      return { path: p, exists: fs.existsSync(p) };
    });
    
    res.status(200).send(`
      <html>
        <head><title>SomBuddy - Build Debug Info</title></head>
        <body>
          <h1>Build Debug Info</h1>
          <p>Current directory: ${process.cwd()}</p>
          <p>Environment: ${app.get('env')}</p>
          <hr>
          <h2>Checks for index.html:</h2>
          <ul>
            ${results.map(r => `<li>${r.path}: ${r.exists ? '✅ Found' : '❌ Not found'}</li>`).join('\n')}
          </ul>
          <hr>
          <h2>Directory contents:</h2>
          <h3>Root:</h3>
          <pre>${JSON.stringify(fs.readdirSync('.'))}</pre>
          ${fs.existsSync('./dist') ? `<h3>dist/:</h3><pre>${JSON.stringify(fs.readdirSync('./dist'))}</pre>` : ''}
          ${fs.existsSync('./dist/public') ? `<h3>dist/public/:</h3><pre>${JSON.stringify(fs.readdirSync('./dist/public'))}</pre>` : ''}
        </body>
      </html>
    `);
  });

  // HEAD method handler for root path 
  // This addresses: "Add a HEAD method handler for the root path to respond to health checks without requiring expensive operations"
  app.head('/', (_req, res) => {
    // Always return a successful status for HEAD requests (used by health checks)
    res.status(200).end();
  });

  // Root path with better error handling
  app.get('/', async (req, res, next) => {
    const isProduction = app.get('env') === 'production';
    const userAgent = req.headers['user-agent'] || 'none';
    const isKubeProbe = userAgent.includes('kube-probe');
    
    // If it's a kubernetes probe, ALWAYS return healthy status (per Replit's suggestion)
    // This addresses: "Modify the root endpoint to respond with a 200 status code immediately for Kubernetes health probes without checking database"
    if (isKubeProbe) {
      // Skip database connection check entirely
      console.log("Kubernetes probe detected, returning immediate 200 status");
      return res.status(200).json({ status: 'healthy', immediate: true });
    }

    // In production and not a kube probe, try to serve the app
    if (isProduction) {
      try {
        const possiblePaths = [
          { path: './dist/public/index.html', root: './dist/public' },
          { path: '../dist/public/index.html', root: '../dist/public' },
          { path: './public/index.html', root: './public' },
          { path: './client/build/index.html', root: './client/build' }
        ];
        
        // Try each path
        for (const { path: indexPath, root } of possiblePaths) {
          if (fs.existsSync(indexPath)) {
            console.log(`Found index.html at ${indexPath}, serving from ${root}`);
            return res.sendFile('index.html', { root });
          }
        }
        
        // If no index.html found, redirect to debug page
        return res.redirect('/debug-build');
      } catch (error: any) {
        console.error('Error serving index.html:', error);
        return res.redirect('/debug-build');
      }
    }
    
    // In development or if we didn't handle it above, pass to next middleware
    next();
  });
  
  // Simplified health check endpoint for Kubernetes probes
  // This addresses: "Simplify the /k8s-health endpoint to always return a 200 status code without checking the database connection"
  app.get('/k8s-health', (_req, res) => {
    // Always return a 200 OK status without checking the database
    res.status(200).json({ status: 'healthy', immediate: true });
  });

  // Add minimal health check endpoint that always returns 200
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    
    // Add a catch-all route for the frontend to support client-side routing in production
    // This ensures routes like /chat and /dashboard work without server-side route definitions
    app.get('*', (req, res) => {
      // Skip API routes - those should 404 if not defined
      if (!req.path.startsWith('/api/')) {
        res.sendFile('index.html', { root: './dist/public' });
      } else {
        res.status(404).json({ message: 'API endpoint not found' });
      }
    });
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