import { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { db } from "./db";
import { users, nutritionLogs, workoutLogs, healthLogs, dailyPlans } from "@db/schema";
import { 
  registerSchema, 
  loginSchema, 
  insertNutritionLogSchema,
  insertWorkoutLogSchema, 
  insertHealthLogSchema,
  insertDailyPlanSchema 
} from "@db/schema";
import bcrypt from "bcryptjs";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { storage } from "./storage";
import { generateMealPlan } from "./services/meal-service";
import { generateWorkoutPlan } from "./services/workout-service";
import { calculateTDEE, calculateMacros } from "./services/tdee-service";
import { 
  processOnboardingMessage, 
  generateDailyMotivation, 
  processFeedback,
  OnboardingQuestion 
} from "./services/openai-service";
import { analyzeMealImage } from "./services/image-analysis-service";
import { 
  getOrCreateThread, 
  addMessageToThread, 
  runAssistantOnThread, 
  checkRunStatus, 
  getMessagesFromThread 
} from "./services/assistant-service";

interface SessionData {
  userId: number;
  onboarding?: {
    currentQuestion: OnboardingQuestion;
    userData: any;
  };
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    onboarding?: {
      currentQuestion: OnboardingQuestion;
      userData: any;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const newUser = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      });

      // Set session
      req.session.userId = newUser.id;

      res.status(201).json({
        message: "User registered successfully",
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Create or get a thread for the assistant
  app.post("/api/assistant/thread", async (req: Request, res: Response) => {
    try {
      const { existingThreadId } = req.body;
      
      const thread = await getOrCreateThread(existingThreadId);
      res.status(200).json({ threadId: thread.id });
    } catch (error) {
      console.error("Error creating/getting thread:", error);
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
          
          // Check if image data is too large
          if (imageSizeKB > 5000) {
            return res.status(413).json({ 
              message: "Image is too large. Please use a smaller image (maximum 5MB)." 
            });
          }
          
          validatedImages.push(img);
        } catch (imgError) {
          console.error("Error processing image data:", imgError);
        }
      }
      
      try {
        // Keep user message clean
        const finalMessage = message || "";
        
        // Add the message to the thread
        await addMessageToThread(threadId, finalMessage, validatedImages);
        console.log("Message added successfully");
      } catch (messageError) {
        console.error("Error adding message to thread:", messageError);
        return res.status(500).json({ 
          message: "Failed to add message to thread",
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
      const maxAttempts = 30;

      try {
        runStatus = await checkRunStatus(threadId, run.id);
        console.log(`Initial run status: ${runStatus.status}`);

        while (runStatus.status !== "completed" && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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

  // Get messages from a thread
  app.get("/api/assistant/messages/:threadId", async (req: Request, res: Response) => {
    try {
      const { threadId } = req.params;
      
      if (!threadId) {
        return res.status(400).json({ message: "Thread ID is required" });
      }

      const messages = await getMessagesFromThread(threadId);
      res.status(200).json({ messages: messages.data });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ 
        message: "Failed to get messages", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
  });

  return httpServer;
}