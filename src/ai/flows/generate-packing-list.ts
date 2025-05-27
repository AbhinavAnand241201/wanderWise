
'use server';
/**
 * @fileOverview A Genkit flow to generate a smart, concise packing list of 5 essential items.
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
  name: z.string().describe('The name of the essential packing item (e.g., "Passport", "Universal Adapter").'),
  reason: z.string().describe('A smart, concise, one-line reason why this item is essential for the trip.'),
  lucideIconName: z.string().optional().describe('A valid name of a lucide-react icon, case-sensitive (e.g., "Shirt", "Sun", "Passport", "Smartphone", "CreditCard", "Briefcase", "MapPin", "Camera", "Headphones", "BookOpen"). Choose the most relevant one.'),
  amazonSearchQuery: z.string().optional().describe('A concise search query for finding this item on Amazon (e.g., "universal travel adapter", "noise cancelling headphones", "comfortable walking shoes").'),
});
export type PackingListItem = z.infer<typeof PackingListItemSchema>;

const GeneratePackingListOutputSchema = z.object({
  items: z.array(PackingListItemSchema).max(5).describe('A list of exactly 5 essential packing items. Each item must have a name, a one-line reason, a suggested lucideIconName, and an Amazon search query.'),
});
export type GeneratePackingListOutput = z.infer<
  typeof GeneratePackingListOutputSchema
>;

export async function generatePackingList(input: GeneratePackingListInput): Promise<GeneratePackingListOutput> {
  return generatePackingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEssentialPackingListPrompt',
  input: {schema: GeneratePackingListInputSchema},
  output: {schema: GeneratePackingListOutputSchema},
  prompt: `You are an AI assistant that helps users create an ultra-concise, smart packing list of 5 absolutely essential items for their trip.
These should be "can't go without it" items.

Based on the provided details:
Destination: {{{destination}}}
Number of Days: {{{numberOfDays}}}
Interests/Activities: {{{interests}}}
Weather Summary: {{{weatherSummary}}}

Generate a list of exactly 5 essential packing items. For each item, provide:
- "name": The item name (e.g., "Passport & Visas").
- "reason": A smart, concise, one-line reason why this item is absolutely essential for this specific trip.
- "lucideIconName": A valid, case-sensitive name of a lucide-react icon that best represents the item (e.g., "Passport", "Smartphone", "CreditCard", "Luggage", "Sun", "CloudRain", "Map", "Camera", "Headphones", "Pill"). Choose from common and appropriate icons. Examples: Shirt, Briefcase, BookOpen, Thermometer.
- "amazonSearchQuery": A concise and effective search query for finding a generic version of this item on Amazon. For example, for "Passport Wallet", use "rfid passport wallet".

Tailor items to the destination, duration, interests, and weather.
Prioritize documents, essential electronics, critical clothing, and health/safety items based on context.

Return the response as a single JSON object that strictly adheres to the GeneratePackingListOutputSchema. The main key should be "items", containing an array of exactly 5 PackingListItem objects.

Example of a single item structure:
{
  "name": "Portable Charger",
  "reason": "Keeps your devices powered for navigation and emergencies on the go.",
  "lucideIconName": "BatteryCharging",
  "amazonSearchQuery": "high capacity power bank"
}

Ensure the output is a valid JSON object with exactly 5 items.
Essential Packing List:`,
});


const generatePackingListFlow = ai.defineFlow(
  {
    name: 'generatePackingListFlow',
    inputSchema: GeneratePackingListInputSchema,
    outputSchema: GeneratePackingListOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.items || output.items.length === 0) {
      console.error("LLM did not return the expected packing list structure or returned an empty list.");
      // Fallback for robustness, though the prompt strongly requests 5 items.
      return { items: [
        { name: "Universal Adapter", reason: "To charge your devices in any country.", lucideIconName: "Plug", amazonSearchQuery: "universal travel adapter" },
        { name: "Comfortable Shoes", reason: "Essential for exploring without discomfort.", lucideIconName: "Footprints", amazonSearchQuery: "comfortable walking shoes" },
        { name: "Passport/ID", reason: "Required for travel and identification.", lucideIconName: "Fingerprint", amazonSearchQuery: "passport holder" },
        { name: "Medication", reason: "Any personal prescribed medication.", lucideIconName: "Pill", amazonSearchQuery: "travel pill organizer" },
        { name: "Reusable Water Bottle", reason: "Stay hydrated and reduce plastic waste.", lucideIconName: "GlassWater", amazonSearchQuery: "collapsible water bottle" },
      ].slice(0,5) };
    }
     // Ensure we always return exactly 5 items, even if the LLM gives more or less
    const essentialItems = output.items.slice(0, 5);
    while (essentialItems.length < 5) {
      // Add generic essential items if LLM returned too few
      const fallbacks = [
        { name: "Credit/Debit Card", reason: "For payments and emergencies.", lucideIconName: "CreditCard", amazonSearchQuery: "travel money belt" },
        { name: "Smartphone", reason: "For communication, maps, and information.", lucideIconName: "Smartphone", amazonSearchQuery: "unlocked smartphone" },
        { name: "Weather-appropriate Outwear", reason: "Based on forecast, essential for comfort.", lucideIconName: "Wind", amazonSearchQuery: "packable rain jacket" },
        { name: "Local Currency", reason: "Some cash for places that don't accept cards.", lucideIconName: "Landmark", amazonSearchQuery: "currency converter" },
        { name: "Sunglasses", reason: "Protect your eyes, especially in sunny destinations.", lucideIconName: "Sunglasses", amazonSearchQuery: "uv protection sunglasses" },
      ];
      const needed = 5 - essentialItems.length;
      essentialItems.push(...fallbacks.slice(0, needed));
    }
    return { items: essentialItems };
  }
);


    