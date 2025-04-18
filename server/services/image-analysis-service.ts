import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeMealImage(imageBase64: string): Promise<{
  estimate: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  foodItems: string[];
  analysis: string;
  suggestions: string;
}> {
  try {
    // Remove data URI prefix if present
    const base64Image = imageBase64.includes('data:image')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a nutritional analysis AI that specializes in analyzing meal photos. 
          When a user uploads a food image, analyze it and provide: 
          1. Estimated macronutrients (calories, protein, carbs, fat)
          2. Identified food items in the meal
          3. Brief nutritional analysis
          4. Brief suggestions for improvement if needed
          Format your response as JSON.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this meal photo and provide nutritional information."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Return structured data
    return {
      estimate: {
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fat: result.fat || 0,
      },
      foodItems: result.food_items || [],
      analysis: result.analysis || "Unable to analyze the meal.",
      suggestions: result.suggestions || "",
    };
  } catch (error) {
    console.error("Error analyzing meal image:", error);
    throw new Error("Failed to analyze meal image");
  }
}