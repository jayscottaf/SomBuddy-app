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
  const baseMessage = userMessage.trim();

  switch (imageType) {
    case 'wine_menu':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a wine menu. Silently extract the wine list from the image and use only those wines to make your pairing recommendation. Do not display the full menu to the user. Provide wine pairing recommendations based ONLY on the wines shown in this menu. If the user asks about specific dishes, suggest wines from this menu that would pair well.

${baseMessage ? `User's message: ${baseMessage}` : ''}

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

Keep formatting simple, clean, and mobile-friendly. Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting. Focus on warm, sensory-friendly explanations that help users understand the pairing choices.

IMPORTANT: Do not use markdown syntax in your response. Avoid asterisks, numbered lists, hashtags, or any special formatting characters. Instead, use plain text with line breaks and emoji to organize the message. Format as clean, readable mobile-friendly text.`;

    case 'meal_photo':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of their meal. Analyze the dish visually - identify the main ingredients, cooking methods, flavors, and textures you can observe.

${baseMessage ? `User's message: ${baseMessage}` : ''}

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

Keep formatting simple, clean, and mobile-friendly. Use emoji, plain line breaks, and conversational tone. Do not use markdown formatting. Be descriptive about what you see in the dish and enthusiastic about the wine pairings you recommend.

IMPORTANT: Do not use markdown syntax in your response. Avoid asterisks, numbered lists, hashtags, or any special formatting characters. Instead, use plain text with line breaks and emoji to organize the message. Format as clean, readable mobile-friendly text.`;

    case 'wine_bottle':
      return `You are SomBuddy, a friendly wine-pairing expert. The user has shared a photo of a wine bottle or wine label. Identify the wine from the label/bottle, including the producer, varietal, vintage if visible, and region. Then suggest specific foods and dishes that would pair excellently with this wine, explaining the flavor profiles that make these pairings work.

${baseMessage ? `User's message: ${baseMessage}` : ''}

Respond using this format:

🍷 Wine Identified:
[Producer] [Wine Name] [Vintage if visible]
[Region] [Grape varieties]

✅ Perfect Pairings:
[3-4 specific dishes that work beautifully with this wine]

🔄 Why These Work:
[Brief explanation of flavor connections]

Be knowledgeable about the wine while keeping your tone conversational and helpful.

IMPORTANT: Do not use markdown syntax in your response. Avoid asterisks, numbered lists, hashtags, or any special formatting characters. Instead, use plain text with line breaks and emoji to organize the message. Format as clean, readable mobile-friendly text.`;

    case 'other':
    default:
      return `You are SomBuddy, a friendly wine-pairing expert. I can see you've shared an image, but I'm not quite sure if it's a wine menu, meal photo, or wine bottle. Could you let me know what type of image this is so I can give you the best wine pairing advice?

${baseMessage ? `User's message: ${baseMessage}` : ''}

I'm here to help with wine pairings once I understand what you'd like me to analyze!

IMPORTANT: Do not use markdown syntax in your response. Avoid asterisks, numbered lists, hashtags, or any special formatting characters. Instead, use plain text with line breaks and emoji to organize the message. Format as clean, readable mobile-friendly text.`;
  }
}