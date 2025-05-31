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
              
              - "wine_menu": Restaurant wine lists, wine menu pages, wine catalogs, beverage menus with wine sections
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
      max_tokens: 15,
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
  const baseMessage = userMessage.trim();
  
  switch (imageType) {
    case 'wine_menu':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a wine menu. 

CRITICAL: You must carefully read and extract ALL wines from this menu image. Look for:
- Wine names, producers, vintages, and regions
- Different sections (Pinot Noir, Cabernet Sauvignon, Italian Reds, etc.)
- Both bottle and glass prices
- Pay special attention to small text and varying fonts
- Include ALL wines listed, not just a few examples

Read the menu systematically from top to bottom, left to right. Extract every single wine entry you can see, including:
- Producer name
- Wine name/varietal
- Vintage year
- Region/appellation
- Bin number if shown
- Prices

Then organize the wines by category/section and provide wine pairing recommendations based ONLY on the wines shown in this menu.

${baseMessage ? `User's message: ${baseMessage}` : ''}

Be thorough, accurate, and conversational while being informative about wine pairings.`;

    case 'meal_photo':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of their meal. Analyze the dish visually - identify the main ingredients, cooking methods, flavors, and textures you can observe. Then suggest 3-4 specific wines that would pair beautifully with this dish, explaining why each pairing works.

${baseMessage ? `User's message: ${baseMessage}` : ''}

Be descriptive about what you see in the dish and enthusiastic about the wine pairings you recommend.`;

    case 'wine_bottle':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of a wine bottle or wine label. Identify the wine from the label/bottle, including the producer, varietal, vintage if visible, and region. Then suggest specific foods and dishes that would pair excellently with this wine, explaining the flavor profiles that make these pairings work.

${baseMessage ? `User's message: ${baseMessage}` : ''}

Be knowledgeable about the wine while keeping your tone conversational and helpful.`;

    case 'other':
    default:
      return `You are SomBuddy, a friendly wine-pairing expert. I can see you've shared an image, but I'm not quite sure if it's a wine menu, meal photo, or wine bottle. Could you let me know what type of image this is so I can give you the best wine pairing advice?

${baseMessage ? `User's message: ${baseMessage}` : ''}

I'm here to help with wine pairings once I understand what you'd like me to analyze!`;
  }
}