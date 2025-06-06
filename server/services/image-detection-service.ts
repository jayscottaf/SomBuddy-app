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
 * Generate context-appropriate prompts based on image type
 */
export function generateContextualPrompt(imageType: ImageType, userMessage: string = ''): string {
  // Return only the user's clean message - no internal instructions
  return userMessage.trim() || '';
}

/**
 * Generate system instructions that will be used internally by the assistant
 * These should never be shown to the user
 */
export function generateSystemInstructions(imageType: ImageType): string {
  switch (imageType) {
    case 'wine_menu':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a wine menu. Silently extract the wine list from the image and use only those wines to make your pairing recommendation. Do not display the full menu to the user. Provide wine pairing recommendations based ONLY on the wines shown in this menu.

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

Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting like asterisks, numbered lists, or hashtags. Format as clean, readable mobile-friendly text.`;

    case 'meal_photo':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of their meal. Analyze the dish visually and provide wine pairing recommendations.

Respond using this exact format:

🍷 Recommended Pairing:
[Wine Name] ([Region])
[Grape(s)]
[Flavor Notes]

✅ Why It Works:
[Short explanation using sensory, friendly language]

🔄 Alternatives:
[2-3 other excellent wine options with brief descriptions]

Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting. Be enthusiastic about the wine pairings you recommend.`;

    case 'wine_bottle':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of a wine bottle or wine label. Identify the wine and suggest food pairings.

Respond using this format:

🍷 Wine Identified:
[Producer] [Wine Name] [Vintage if visible]
[Region] [Grape varieties]

✅ Perfect Pairings:
[3-4 specific dishes that work beautifully with this wine]

🔄 Why These Work:
[Brief explanation of flavor connections]

Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting.`;

    case 'other':
    default:
      return `You are SomBuddy, a friendly wine-pairing expert. Analyze any image the user shares and provide appropriate wine recommendations. If you can identify food or wine-related content, provide relevant pairing advice. If the image is unclear, politely ask for clarification about what they'd like wine pairing advice for.`;
  }
}