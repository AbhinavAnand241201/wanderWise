// use server'

/**
 * @fileOverview Generates a personalized trip itinerary based on destination, budget, and interests.
 *
 * - generateItinerary - A function that generates the trip itinerary.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItineraryInputSchema = z.object({
  destination: z.string().describe('The destination for the trip.'),
  budget: z.number().describe('The budget for the trip in USD.'),
  interests: z.string().describe('A comma-separated list of interests for the trip.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

const GenerateItineraryOutputSchema = z.object({
  itinerary: z.string().describe('A detailed day-wise itinerary for the trip.'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;

export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const generateItineraryPrompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  prompt: `You are an AI travel assistant. Generate a detailed day-wise itinerary for a trip to {{{destination}}} with a budget of ${'{{{budget}}}'} USD. The user is interested in ${'{{{interests}}}'}.  The itinerary should include specific places to visit, activities to do, estimated travel times, and estimated costs for each day.  Provide a compelling and engaging itinerary.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async input => {
    const {output} = await generateItineraryPrompt(input);
    return output!;
  }
);
