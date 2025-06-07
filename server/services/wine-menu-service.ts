
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WineEntry {
  binNumber?: string;
  producer: string;
  wineName: string;
  vintage?: string;
  region?: string;
  glassPrice?: number;
  bottlePrice?: number;
}

export interface WineMenuSection {
  sectionName: string;
  wines: WineEntry[];
}

export interface WineMenuAnalysis {
  restaurantName?: string;
  sections: WineMenuSection[];
  totalWineCount: number;
}

/**
 * Specialized function for accurate wine menu OCR and parsing
 */
export async function analyzeWineMenu(imageUrl: string): Promise<WineMenuAnalysis> {
  try {
    console.log('Performing detailed wine menu analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a specialized wine menu OCR system. Your task is to extract EVERY wine from the menu image with perfect accuracy. 

INSTRUCTIONS:
1. Read the entire menu systematically
2. Extract ALL wines, not just examples
3. Pay attention to small text, varying fonts, and formatting
4. Include bin numbers, producers, wine names, vintages, regions, and prices
5. Organize by menu sections (Pinot Noir, Cabernet Sauvignon, etc.)
6. Return structured JSON data

Be extremely thorough and accurate. Missing wines is unacceptable.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL wines from this menu image. Return a JSON object with this structure:
              {
                "restaurantName": "Restaurant Name (if visible)",
                "sections": [
                  {
                    "sectionName": "Section Name (e.g., 'Pinot Noir')",
                    "wines": [
                      {
                        "binNumber": "Bin# (if shown)",
                        "producer": "Producer Name",
                        "wineName": "Wine Name/Varietal",
                        "vintage": "Year",
                        "region": "Region/Appellation",
                        "glassPrice": price_number_or_null,
                        "bottlePrice": price_number_or_null
                      }
                    ]
                  }
                ],
                "totalWineCount": total_number_of_wines
              }
              
              Extract EVERY wine entry visible. Be meticulous and thorough.`
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as WineMenuAnalysis;
    console.log(`Wine menu analysis complete: ${analysis.totalWineCount} wines found`);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing wine menu:', error);
    throw new Error('Failed to analyze wine menu');
  }
}

/**
 * Generate formatted wine list for display
 */
export function formatWineMenuForDisplay(analysis: WineMenuAnalysis): string {
  let output = '';
  
  if (analysis.restaurantName) {
    output += `**${analysis.restaurantName} Wine Menu**\n\n`;
  }
  
  analysis.sections.forEach(section => {
    output += `**${section.sectionName.toUpperCase()}**\n`;
    
    section.wines.forEach((wine, index) => {
      const binText = wine.binNumber ? `${wine.binNumber}. ` : `${index + 1}. `;
      const vintage = wine.vintage ? `${wine.vintage} ` : '';
      const region = wine.region ? `, ${wine.region}` : '';
      const glassPrice = wine.glassPrice ? ` (Glass: $${wine.glassPrice})` : '';
      const bottlePrice = wine.bottlePrice ? ` (Bottle: $${wine.bottlePrice})` : '';
      
      output += `${binText}${vintage}${wine.producer} ${wine.wineName}${region}${glassPrice}${bottlePrice}\n`;
    });
    
    output += '\n';
  });
  
  output += `Total wines available: ${analysis.totalWineCount}`;
  
  return output;
}
