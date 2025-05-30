import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ImageType = 'wine_menu' | 'meal_photo' | 'wine_bottle' | 'other';

/**
 * Detect the type of image using GPT-4o Vision
 * @param imageUrl - The URL of the image to analyze
 * @returns Promise<ImageType> - The detected image type
 */
export async function detectImageType(imageUrl: string): Promise<ImageType> {
  try {
    console.log('Detecting image type for:', imageUrl.substring(0, 50) + '...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and classify it into one of these categories:
              
              - "wine_menu": Restaurant wine lists, wine menu pages, wine catalogs
              - "meal_photo": Food dishes, plates of food, meals, desserts
              - "wine_bottle": Wine bottles, wine labels, wine glasses with wine
              - "other": Everything else that doesn't fit the above categories
              
              Respond with ONLY the category name, nothing else.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    const detectedType = response.choices[0]?.message?.content?.trim().toLowerCase() as ImageType;
    
    // Validate the response
    const validTypes: ImageType[] = ['wine_menu', 'meal_photo', 'wine_bottle', 'other'];
    if (validTypes.includes(detectedType)) {
      console.log('Detected image type:', detectedType);
      return detectedType;
    } else {
      console.log('Invalid response from GPT, defaulting to "other":', detectedType);
      return 'other';
    }
  } catch (error) {
    console.error('Error detecting image type:', error);
    return 'other';
  }
}

/**
 * Generate system instructions and user message based on image type
 */
export function generateContextualMessages(imageType: ImageType, userMessage: string = ''): { systemMessage: string; userMessage: string } {
  const baseMessage = userMessage.trim();
  
  switch (imageType) {
    case 'wine_menu':
      return {
        systemMessage: `You are SomBuddy, a friendly wine-pairing expert. The user has shared a wine menu image and may ask about specific dishes. Your task is to:

1. Silently extract the wine list from the image and use only those wines to make your pairing recommendation
2. Do not display the full menu to the user
3. Provide wine pairing recommendations based ONLY on the wines shown in this menu
4. If the user asks about specific dishes, suggest wines from this menu that would pair well

Respond using this exact format:

🍷 Recommended Pairing:
[Wine Name] ([Region])
[Grape(s)]
[Flavor Notes]

✅ Why It Works:
[Short explanation using sensory, friendly language]

🔄 Alternatives:
[1-2 alternate wines from the menu with brief descriptions]

🚫 Avoid:
[Wines from the menu that would clash and why]

Keep formatting simple, clean, and mobile-friendly. Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting. Focus on warm, sensory-friendly explanations that help users understand the pairing choices.`,
        userMessage: baseMessage || "Please suggest wine pairings from this menu."
      };

    case 'meal_photo':
      return {
        systemMessage: `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of their meal. Your task is to:

1. Analyze the dish visually - identify the main ingredients, cooking methods, flavors, and textures you can observe
2. Suggest wine pairings based on what you see in the image

Respond using this exact format:

🍷 Recommended Pairing:
[Wine Name] ([Region])
[Grape(s)]
[Flavor Notes]

✅ Why It Works:
[Short explanation using sensory, friendly language about how the wine complements the dish]

🔄 Alternatives:
[2-3 other excellent wine options with brief descriptions]

🚫 Avoid:
[Optional - mention a wine style that wouldn't work well with this dish and why]

Keep formatting simple, clean, and mobile-friendly. Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting. Be descriptive about what you see in the dish and enthusiastic about the wine pairings you recommend.`,
        userMessage: baseMessage || "What wines would pair well with this dish?"
      };

    case 'wine_bottle':
      return {
        systemMessage: `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of a wine bottle or wine label. Your task is to:

1. Identify the wine from the label/bottle, including the producer, varietal, vintage if visible, and region
2. Suggest specific foods and dishes that would pair excellently with this wine
3. Explain the flavor profiles that make these pairings work

Be knowledgeable about the wine while keeping your tone conversational and helpful.`,
        userMessage: baseMessage || "What foods would pair well with this wine?"
      };

    case 'other':
    default:
      return {
        systemMessage: `You are SomBuddy, a friendly wine-pairing expert. The user has shared an image, but it's not clear if it's a wine menu, meal photo, or wine bottle. Ask for clarification so you can provide the best wine pairing advice.`,
        userMessage: baseMessage || "I'm not sure what type of image this is. Can you help me with wine pairings?"
      };
  }
}