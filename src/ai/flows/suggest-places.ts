// src/ai/flows/suggest-places.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting hotels, restaurants, and activities based on user preferences.
 *
 * - suggestPlaces - A function that suggests places based on user preferences.
 * - SuggestPlacesInput - The input type for the suggestPlaces function.
 * - SuggestPlacesOutput - The return type for the suggestPlaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const SuggestPlacesOutputSchema = z.object({
  hotels: z
    .array(z.string())
    .describe('A list of suggested hotels based on user preferences.'),
  restaurants: z
    .array(z.string())
    .describe('A list of suggested restaurants based on user preferences.'),
  activities: z
    .array(z.string())
    .describe('A list of suggested activities based on user preferences.'),
});
export type SuggestPlacesOutput = z.infer<typeof SuggestPlacesOutputSchema>;

export async function suggestPlaces(input: SuggestPlacesInput): Promise<SuggestPlacesOutput> {
  return suggestPlacesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPlacesPrompt',
  input: {schema: SuggestPlacesInputSchema},
  output: {schema: SuggestPlacesOutputSchema},
  prompt: `You are a trip planning expert. Given the destination, budget, and interests, suggest a list of hotels, restaurants, and activities.  Format the response as a JSON object with "hotels", "restaurants", and "activities" keys, each containing a list of strings.

Destination: {{{destination}}}
Budget: {{{budget}}}
Interests: {{{interests}}}

Suggestions:`,
});

const suggestPlacesFlow = ai.defineFlow(
  {
    name: 'suggestPlacesFlow',
    inputSchema: SuggestPlacesInputSchema,
    outputSchema: SuggestPlacesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
