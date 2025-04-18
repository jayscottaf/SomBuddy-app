import { apiRequest } from "../queryClient";

// Function to handle conversational onboarding messages
export async function sendOnboardingMessage(message: string): Promise<{
  field: string;
  value: any;
  nextQuestion?: {
    text: string;
    field: string;
  };
  isComplete?: boolean;
}> {
  const response = await apiRequest("POST", "/api/onboarding/message", {
    message
  });
  
  if (!response.ok) {
    throw new Error("Failed to process onboarding message");
  }
  
  return response.json();
}

// Function to send daily feedback
export async function sendDailyFeedback(mood: string, message: string): Promise<{
  response: string;
}> {
  const response = await apiRequest("POST", "/api/feedback", {
    mood,
    message
  });
  
  if (!response.ok) {
    throw new Error("Failed to send feedback");
  }
  
  return response.json();
}

// Utility function to format AI-generated meal plan for display
export function formatMealPlan(mealPlan: any) {
  if (!mealPlan) return null;
  
  const { breakfast, lunch, dinner, snacks } = mealPlan;
  
  return {
    breakfast: {
      title: breakfast.name,
      description: breakfast.description,
      macros: breakfast.macros,
    },
    lunch: {
      title: lunch.name,
      description: lunch.description,
      macros: lunch.macros,
      restaurant: lunch.restaurantRecommendation,
    },
    dinner: {
      title: dinner.name,
      description: dinner.description,
      macros: dinner.macros,
      restaurant: dinner.restaurantRecommendation,
    },
    snacks: snacks.map((snack: any) => ({
      title: snack.name,
      description: snack.description,
      macros: snack.macros,
    })),
  };
}

// Utility function to format AI-generated workout plan for display
export function formatWorkoutPlan(workoutPlan: any) {
  if (!workoutPlan) return null;
  
  return {
    title: workoutPlan.title,
    description: workoutPlan.description,
    duration: workoutPlan.duration,
    intensity: workoutPlan.intensityLevel,
    sections: workoutPlan.sections.map((section: any) => ({
      name: section.name,
      duration: section.duration,
      exercises: section.exercises.map((exercise: any) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        description: exercise.description,
      })),
    })),
    gymOption: workoutPlan.gymRecommendation,
  };
}
