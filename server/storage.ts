import { 
  users, type User, type InsertUser,
  nutritionLogs, type NutritionLog, type InsertNutritionLog,
  workoutLogs, type WorkoutLog, type InsertWorkoutLog,
  healthLogs, type HealthLog, type InsertHealthLog,
  dailyPlans, type DailyPlan, type InsertDailyPlan
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Nutrition log methods
  getNutritionLogs(userId: number): Promise<NutritionLog[]>;
  getNutritionLogByDate(userId: number, date: Date): Promise<NutritionLog | undefined>;
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  updateNutritionLog(id: number, logData: Partial<NutritionLog>): Promise<NutritionLog | undefined>;
  
  // Workout log methods
  getWorkoutLogs(userId: number): Promise<WorkoutLog[]>;
  getWorkoutLogByDate(userId: number, date: Date): Promise<WorkoutLog | undefined>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: number, logData: Partial<WorkoutLog>): Promise<WorkoutLog | undefined>;
  
  // Health log methods
  getHealthLogs(userId: number): Promise<HealthLog[]>;
  getHealthLogByDate(userId: number, date: Date): Promise<HealthLog | undefined>;
  createHealthLog(log: InsertHealthLog): Promise<HealthLog>;
  updateHealthLog(id: number, logData: Partial<HealthLog>): Promise<HealthLog | undefined>;
  
  // Daily plan methods
  getDailyPlans(userId: number): Promise<DailyPlan[]>;
  getDailyPlanByDate(userId: number, date: Date): Promise<DailyPlan | undefined>;
  createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan>;
  updateDailyPlan(id: number, planData: Partial<DailyPlan>): Promise<DailyPlan | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private nutritionLogs: Map<number, NutritionLog>;
  private workoutLogs: Map<number, WorkoutLog>;
  private healthLogs: Map<number, HealthLog>;
  private dailyPlans: Map<number, DailyPlan>;
  
  private userIdCounter: number;
  private nutritionLogIdCounter: number;
  private workoutLogIdCounter: number;
  private healthLogIdCounter: number;
  private dailyPlanIdCounter: number;

  constructor() {
    this.users = new Map();
    this.nutritionLogs = new Map();
    this.workoutLogs = new Map();
    this.healthLogs = new Map();
    this.dailyPlans = new Map();
    
    this.userIdCounter = 1;
    this.nutritionLogIdCounter = 1;
    this.workoutLogIdCounter = 1;
    this.healthLogIdCounter = 1;
    this.dailyPlanIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Nutrition log methods
  async getNutritionLogs(userId: number): Promise<NutritionLog[]> {
    return Array.from(this.nutritionLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  async getNutritionLogByDate(userId: number, date: Date): Promise<NutritionLog | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.nutritionLogs.values()).find(
      (log) => log.userId === userId && log.date.toISOString().split('T')[0] === dateString,
    );
  }

  async createNutritionLog(insertLog: InsertNutritionLog): Promise<NutritionLog> {
    const id = this.nutritionLogIdCounter++;
    const log: NutritionLog = { ...insertLog, id };
    this.nutritionLogs.set(id, log);
    return log;
  }

  async updateNutritionLog(id: number, logData: Partial<NutritionLog>): Promise<NutritionLog | undefined> {
    const log = this.nutritionLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.nutritionLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Workout log methods
  async getWorkoutLogs(userId: number): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  async getWorkoutLogByDate(userId: number, date: Date): Promise<WorkoutLog | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.workoutLogs.values()).find(
      (log) => log.userId === userId && log.date.toISOString().split('T')[0] === dateString,
    );
  }

  async createWorkoutLog(insertLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = this.workoutLogIdCounter++;
    const log: WorkoutLog = { ...insertLog, id };
    this.workoutLogs.set(id, log);
    return log;
  }

  async updateWorkoutLog(id: number, logData: Partial<WorkoutLog>): Promise<WorkoutLog | undefined> {
    const log = this.workoutLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.workoutLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Health log methods
  async getHealthLogs(userId: number): Promise<HealthLog[]> {
    return Array.from(this.healthLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  async getHealthLogByDate(userId: number, date: Date): Promise<HealthLog | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.healthLogs.values()).find(
      (log) => log.userId === userId && log.date.toISOString().split('T')[0] === dateString,
    );
  }

  async createHealthLog(insertLog: InsertHealthLog): Promise<HealthLog> {
    const id = this.healthLogIdCounter++;
    const log: HealthLog = { ...insertLog, id };
    this.healthLogs.set(id, log);
    return log;
  }

  async updateHealthLog(id: number, logData: Partial<HealthLog>): Promise<HealthLog | undefined> {
    const log = this.healthLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.healthLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Daily plan methods
  async getDailyPlans(userId: number): Promise<DailyPlan[]> {
    return Array.from(this.dailyPlans.values()).filter(
      (plan) => plan.userId === userId,
    );
  }

  async getDailyPlanByDate(userId: number, date: Date): Promise<DailyPlan | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.dailyPlans.values()).find(
      (plan) => plan.userId === userId && plan.date.toISOString().split('T')[0] === dateString,
    );
  }

  async createDailyPlan(insertPlan: InsertDailyPlan): Promise<DailyPlan> {
    const id = this.dailyPlanIdCounter++;
    const plan: DailyPlan = { ...insertPlan, id };
    this.dailyPlans.set(id, plan);
    return plan;
  }

  async updateDailyPlan(id: number, planData: Partial<DailyPlan>): Promise<DailyPlan | undefined> {
    const plan = this.dailyPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.dailyPlans.set(id, updatedPlan);
    return updatedPlan;
  }
}

export const storage = new MemStorage();
