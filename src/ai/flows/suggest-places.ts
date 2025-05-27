
// src/ai/flows/suggest-places.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting hotels, restaurants, and activities,
 * including fetching photo references for them.
 *
 * - suggestPlaces - A function that suggests places based on user preferences.
 * - SuggestPlacesInput - The input type for the suggestPlaces function.
 * - PlaceSuggestion - The structure for a single place suggestion.
 * - SuggestPlacesOutput - The return type for the suggestPlaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findPlacePhotoTool } from '@/ai/tools/google-apis-tool'; // Import the new tool

const SuggestPlacesInputSchema = z.object({
  destination: z.string().describe('The destination city or region.'),
  budget: z.string().describe('The budget for the trip (e.g., "$500", "€1000").'),
  interests: z
    .string()
    .describe(
      'A comma-separated list of interests (e.g., "history, food, museums").'
    ),
});
export type SuggestPlacesInput = z.infer<typeof SuggestPlacesInputSchema>;

// New schema for individual place suggestions
const PlaceSuggestionSchema = z.object({
  name: z.string().describe('The name of the suggested place.'),
  description: z.string().optional().describe('A brief description or reason for the suggestion.'),
  photoReference: z.string().optional().nullable().describe('A Google Places API photo reference string, if available.'),
});
export type PlaceSuggestion = z.infer<typeof PlaceSuggestionSchema>;

const SuggestPlacesOutputSchema = z.object({
  hotels: z
    .array(PlaceSuggestionSchema)
    .describe('A list of suggested hotels, including name, description, and photoReference.'),
  restaurants: z
    .array(PlaceSuggestionSchema)
    .describe('A list of suggested restaurants, including name, description, and photoReference.'),
  activities: z
    .array(PlaceSuggestionSchema)
    .describe('A list of suggested activities, including name, description, and photoReference.'),
});
export type SuggestPlacesOutput = z.infer<typeof SuggestPlacesOutputSchema>;

export async function suggestPlaces(input: SuggestPlacesInput): Promise<SuggestPlacesOutput> {
  return suggestPlacesFlow(input);
}

// Temporary schema for LLM's initial raw suggestions (just names and descriptions)
const LLMSuggestionItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});
const LLMSuggestionsSchema = z.object({
  hotels: z.array(LLMSuggestionItemSchema),
  restaurants: z.array(LLMSuggestionItemSchema),
  activities: z.array(LLMSuggestionItemSchema),
});

const prompt = ai.definePrompt({
  name: 'suggestPlacesPrompt',
  input: {schema: SuggestPlacesInputSchema},
  output: {schema: LLMSuggestionsSchema}, // LLM will output names and descriptions
  prompt: `You are a trip planning expert. Given the destination, budget, and interests, suggest a list of specific hotels, restaurants, and activities.
For each suggestion, provide a 'name' and a brief 'description' (1-2 sentences).
Format the response as a JSON object with "hotels", "restaurants", and "activities" keys. Each key should contain an array of objects, where each object has a "name" and "description" field.

Destination: {{{destination}}}
Budget: {{{budget}}}
Interests: {{{interests}}}

Example for one hotel:
{
  "name": "The Grand Plaza Hotel",
  "description": "A luxurious hotel known for its excellent service and central location, suitable for a comfortable stay within the specified budget."
}

Suggestions:`,
});

const suggestPlacesFlow = ai.defineFlow(
  {
    name: 'suggestPlacesFlow',
    inputSchema: SuggestPlacesInputSchema,
    outputSchema: SuggestPlacesOutputSchema,
    // We are not directly giving the findPlacePhotoTool to the LLM here,
    // but we will call it programmatically within the flow.
  },
  async (input: SuggestPlacesInput) => {
    // 1. Get initial suggestions (name, description) from the LLM
    const { output: llmOutput } = await prompt(input);

    if (!llmOutput) {
      console.error("LLM did not return suggestions.");
      return { hotels: [], restaurants: [], activities: [] };
    }

    // Helper function to process a list of suggestions and add photo references
    const processSuggestions = async (
      items: Array<{ name: string; description?: string }>,
      destinationContext: string
    ): Promise<PlaceSuggestion[]> => {
      if (!items) return [];
      const processedItems: PlaceSuggestion[] = [];
      for (const item of items) {
        let photoRef: string | null | undefined = null;
        try {
          const photoToolResult = await findPlacePhotoTool({
            placeName: item.name,
            destinationContext: destinationContext,
          });
          photoRef = photoToolResult?.photoReference;
        } catch (e) {
          console.error(`Error fetching photo for ${item.name}:`, e);
        }
        processedItems.push({
          name: item.name,
          description: item.description,
          photoReference: photoRef,
        });
      }
      return processedItems;
    };

    // 2. Enrich suggestions with photo references
    const [hotels, restaurants, activities] = await Promise.all([
      processSuggestions(llmOutput.hotels, input.destination),
      processSuggestions(llmOutput.restaurants, input.destination),
      processSuggestions(llmOutput.activities, input.destination),
    ]);

    return {
      hotels,
      restaurants,
      activities,
    };
  }
);
