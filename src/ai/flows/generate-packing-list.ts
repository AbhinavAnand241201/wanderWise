
'use server';
/**
 * @fileOverview A Genkit flow to generate a smart packing list.
 *
 * - generatePackingList - Generates a packing list based on trip details.
 * - GeneratePackingListInput - Input schema for the flow.
 * - PackingListItem - Schema for an individual item in the packing list.
 * - GeneratePackingListOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePackingListInputSchema = z.object({
  destination: z.string().describe('The destination of the trip.'),
  numberOfDays: z.number().describe('The total number of days for the trip.'),
  interests: z
    .string()
    .describe(
      'A comma-separated list of user interests/activities (e.g., "hiking, beach, museums").'
    ),
  weatherSummary: z
    .string()
    .describe(
      'A brief summary of the expected weather (e.g., "Warm and sunny", "Cool with chances of rain").'
    ),
});
export type GeneratePackingListInput = z.infer<
  typeof GeneratePackingListInputSchema
>;

const PackingListItemSchema = z.object({
  name: z.string().describe('The name of the packing item (e.g., "Hiking Boots", "Sunscreen").'),
  category: z
    .string()
    .describe(
      'The category of the item (e.g., "Clothing", "Toiletries", "Documents", "Electronics", "Miscellaneous").'
    ),
  quantity: z
    .string()
    .optional()
    .describe('Suggested quantity (e.g., "1 pair", "3-4", "As needed").'),
  notes: z.string().optional().describe('Any additional notes or considerations for the item (e.g., "waterproof recommended", "check airline policy").'),
  amazonSearchQuery: z.string().optional().describe('A concise search query for finding this item on Amazon.com (e.g., "travel adapter universal", "quick dry hiking pants men").'),
  imageKeywords: z.string().optional().describe('1-2 generic keywords for a placeholder image of this item (e.g., "hiking boots", "sunscreen bottle", "passport").'),
});
export type PackingListItem = z.infer<typeof PackingListItemSchema>;

const GeneratePackingListOutputSchema = z.object({
  items: z.array(PackingListItemSchema).describe('A list of suggested packing items, each with a name, category, optional quantity, notes, an Amazon search query, and image keywords.'),
});
export type GeneratePackingListOutput = z.infer<
  typeof GeneratePackingListOutputSchema
>;

export async function generatePackingList(input: GeneratePackingListInput): Promise<GeneratePackingListOutput> {
  return generatePackingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePackingListPrompt',
  input: {schema: GeneratePackingListInputSchema},
  output: {schema: GeneratePackingListOutputSchema},
  prompt: `You are an AI assistant that helps users create smart packing lists for their trips.
Based on the provided destination, trip duration, user interests, and weather summary, generate a comprehensive list of packing items.

Destination: {{{destination}}}
Number of Days: {{{numberOfDays}}}
Interests/Activities: {{{interests}}}
Weather Summary: {{{weatherSummary}}}

For each item, provide:
- "name": The item name (e.g., "Hiking Boots", "Passport").
- "category": Categorize the item (e.g., "Clothing", "Toiletries", "Documents", "Electronics", "Miscellaneous").
- "quantity": A suggested quantity (e.g., "1 pair", "2-3", "1 per week of travel"). Be sensible.
- "notes": (Optional) Any brief, helpful notes (e.g., "waterproof recommended", "check local voltage").
- "amazonSearchQuery": A concise and effective search query for finding a generic version of this item on Amazon.com. For example, for "Hiking Boots", use "waterproof hiking boots men" or "lightweight hiking boots women". For "Travel Adapter", use "universal travel adapter".
- "imageKeywords": 1-2 generic keywords for a placeholder image, like "t-shirt" or "passport" or "sunscreen bottle".

Consider the trip duration to suggest appropriate quantities for clothing and toiletries.
Tailor items to the interests (e.g., swimwear for beach, appropriate gear for hiking).
Factor in the weather summary.

Return the response as a single JSON object that strictly adheres to the GeneratePackingListOutputSchema. The main key should be "items", containing an array of PackingListItem objects.

Example of a single item structure:
{
  "name": "Rain Jacket",
  "category": "Clothing",
  "quantity": "1",
  "notes": "Lightweight and packable, especially if rain is expected.",
  "amazonSearchQuery": "lightweight packable rain jacket",
  "imageKeywords": "rain jacket"
}

Ensure the output is a valid JSON object.
Packing List:`,
});


const generatePackingListFlow = ai.defineFlow(
  {
    name: 'generatePackingListFlow',
    inputSchema: GeneratePackingListInputSchema,
    outputSchema: GeneratePackingListOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.items) {
      console.error("LLM did not return the expected packing list structure.");
      return { items: [] };
    }
    return output;
  }
);
