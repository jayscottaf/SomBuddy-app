import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registerSchema, loginSchema } from "@shared/schema";
import {
  getOrCreateThread,
  addMessageToThread,
  runAssistantOnThread,
  checkRunStatus,
  getMessagesFromThread
} from "./services/assistant-service";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware with PostgreSQL store
  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || "sombuddy-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Auth Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      
      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: "",
      });
      
      req.session.userId = user.id;
      
      res.status(201).json({ message: "User created", userId: user.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      res.status(200).json({
        message: "Login successful",
        userId: user.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // User Routes
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });




  // Assistant Chat API Routes
  
  // Initialize or retrieve a thread
  app.post("/api/assistant/thread", async (req: Request, res: Response) => {
    try {
      const { threadId } = req.body;
      const newThreadId = await getOrCreateThread(threadId);
      res.status(200).json({ threadId: newThreadId });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ message: "Failed to create or retrieve thread" });
    }
  });
  
  // Send a message to the assistant
  app.post("/api/assistant/message", async (req: Request, res: Response) => {
    try {
      const { threadId, message, imageData, imageDataArray } = req.body;
      
      if (!threadId) {
        return res.status(400).json({ message: "Thread ID is required" });
      }
      
      // Support both single imageData and multiple imageDataArray
      const images = imageDataArray || (imageData ? [imageData] : []);
      
      if (!message && images.length === 0) {
        return res.status(400).json({ message: "Message or at least one image is required" });
      }
      
      // Process and validate all image data
      const validatedImages: string[] = [];
      for (const img of images) {
        try {
          if (!img) continue;
          
          const imageSizeKB = Math.round(img.length / 1024);
          console.log(`Processing image of approximately ${imageSizeKB}KB`);
          
          // Check if image data is too large (OpenAI limit is ~20MB, but we'll be more conservative)
          if (imageSizeKB > 5000) { // 5MB limit
            return res.status(413).json({ 
              message: "Image is too large. Please use a smaller image (maximum 5MB)." 
            });
          }
          
          validatedImages.push(img);
        } catch (imgError) {
          console.error("Error processing image data:", imgError);
          // Continue with other images rather than failing completely
        }
      }
      
      try {
        // Add the message to the thread with intelligent image analysis
        console.log(`Adding message to thread ${threadId}`);
        
        let finalMessage = message || "";
        
        // If we have images, detect their types and generate appropriate prompts
        if (validatedImages.length > 0) {
          console.log(`Processing ${validatedImages.length} images for intelligent analysis`);
          
          // For now, we'll handle the first image for type detection
          // Upload the first image to get a URL for analysis
          const { uploadImageToCloudinary } = await import("./services/cloudinary-service");
          const firstImageUrl = await uploadImageToCloudinary(validatedImages[0]);
          
          // Detect the image type
          const imageType = await detectImageType(firstImageUrl);
          console.log(`Detected image type: ${imageType}`);
          
          // Generate contextual prompt based on image type
          finalMessage = generateContextualPrompt(imageType, message);
          console.log(`Generated contextual prompt for ${imageType}`);
        }
        
        await addMessageToThread(threadId, finalMessage, validatedImages);
        console.log("Message and images added successfully with contextual analysis");
      } catch (messageError) {
        console.error("Error adding message to thread:", messageError);
        
        // Provide more detailed error messages for common issues
        let errorMessage = "Failed to add message to thread";
        let statusCode = 500;
        
        if (messageError instanceof Error) {
          const errorText = messageError.message.toLowerCase();
          
          // Check for common errors
          if (errorText.includes('cloudinary')) {
            errorMessage = "Error uploading image to cloud storage. Please try again or use a different image.";
            statusCode = 502; // Bad Gateway - issue with external service
          } else if (errorText.includes('too large') || errorText.includes('file size')) {
            errorMessage = "Image is too large. Please try with a smaller image.";
            statusCode = 413; // Request Entity Too Large
          } else if (errorText.includes('rate limit') || errorText.includes('too many requests')) {
            errorMessage = "Rate limit exceeded. Please try again in a few moments.";
            statusCode = 429; // Too Many Requests
          } else if (errorText.includes('invalid') && errorText.includes('format')) {
            errorMessage = "Invalid image format. Please try a different image.";
            statusCode = 400; // Bad Request
          }
        }
        
        return res.status(statusCode).json({ 
          message: errorMessage, 
          error: messageError instanceof Error ? messageError.message : String(messageError) 
        });
      }
      
      // Run the assistant on the thread
      console.log(`Running assistant on thread ${threadId}`);
      let run;
      try {
        run = await runAssistantOnThread(threadId);
        console.log(`Run created with ID: ${run.id}`);
      } catch (runError) {
        console.error("Error running assistant:", runError);
        return res.status(500).json({ 
          message: "Failed to run assistant", 
          error: runError instanceof Error ? runError.message : String(runError) 
        });
      }
      
      // Poll for completion
      let runStatus;
      let attempts = 0;
      const maxAttempts = 30; // Maximum 30 attempts (30 seconds)
      
      try {
        runStatus = await checkRunStatus(threadId, run.id);
        console.log(`Initial run status: ${runStatus.status}`);
        
        while (runStatus.status !== "completed" && attempts < maxAttempts) {
          // Wait for 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check the status again
          runStatus = await checkRunStatus(threadId, run.id);
          attempts++;
          
          if (attempts % 5 === 0) {
            console.log(`Run status after ${attempts} attempts: ${runStatus.status}`);
          }
        }
      } catch (statusError) {
        console.error("Error checking run status:", statusError);
        return res.status(500).json({ 
          message: "Failed to check run status", 
          error: statusError instanceof Error ? statusError.message : String(statusError) 
        });
      }
      
      if (runStatus.status !== "completed") {
        return res.status(408).json({ message: "Assistant processing timed out" });
      }
      
      // Get the messages from the thread
      console.log(`Getting messages from thread ${threadId}`);
      let messages;
      try {
        messages = await getMessagesFromThread(threadId);
      } catch (messagesError) {
        console.error("Error getting messages:", messagesError);
        return res.status(500).json({ 
          message: "Failed to get messages", 
          error: messagesError instanceof Error ? messagesError.message : String(messagesError) 
        });
      }
      
      res.status(200).json({ messages: messages.data });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ 
        message: "Failed to process message",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all messages from a thread
  app.get("/api/assistant/messages/:threadId", async (req: Request, res: Response) => {
    try {
      const { threadId } = req.params;
      
      if (!threadId) {
        return res.status(400).json({ message: "Thread ID is required" });
      }
      
      // Get the messages from the thread
      const messages = await getMessagesFromThread(threadId);
      
      res.status(200).json({ messages: messages.data });
    } catch (error) {
      console.error("Error retrieving messages:", error);
      res.status(500).json({ message: "Failed to retrieve messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
