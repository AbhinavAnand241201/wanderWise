
'use server';

/**
 * @fileOverview Generates a personalized trip itinerary based on destination, budget, and interests.
 * Outputs a structured JSON array of day objects.
 *
 * - generateItinerary - A function that generates the trip itinerary.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - DayItinerary - The structure for a single day in the itinerary.
 * - Activity - The structure for an activity within a day.
 * - GenerateItineraryOutput - The return type for the generateItinerary function, containing an array of DayItinerary objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItineraryInputSchema = z.object({
  destination: z.string().describe('The destination for the trip.'),
  budget: z.number().describe('The budget for the trip in USD.'),
  interests: z.string().describe('A comma-separated list of interests for the trip.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

const ActivitySchema = z.object({
  time: z.string().optional().describe("The time of the activity (e.g., '9:00 AM', 'Afternoon')."),
  description: z.string().describe("A detailed description of the activity."),
  duration: z.string().optional().describe("Estimated duration of the activity (e.g., '2 hours')."),
  cost: z.string().optional().describe("Estimated cost of the activity (e.g., '€15', 'Free')."),
  notes: z.string().optional().describe("Any additional notes or tips for the activity."),
});
export type Activity = z.infer<typeof ActivitySchema>;

const DayItinerarySchema = z.object({
  day: z.union([z.string(), z.number()]).describe("The day number (e.g., 1, 'Day 1') or a general title like 'Arrival Day'."),
  theme: z.string().optional().describe("An optional theme for the day (e.g., 'Historical Exploration', 'Relaxation Day')."),
  summary: z.string().optional().describe("A brief summary or overview of the day's plan."),
  activities: z.array(ActivitySchema).describe("A list of activities planned for the day."),
  estimatedDayCost: z.string().optional().describe("An estimated total cost for the day's planned activities."),
  travelNotes: z.string().optional().describe("Notes about travel or transportation for the day."),
});
export type DayItinerary = z.infer<typeof DayItinerarySchema>;

const GenerateItineraryOutputSchema = z.object({
  itinerary: z.array(DayItinerarySchema).describe('A detailed day-wise itinerary as an array of day objects. Each object represents a day and contains a list of activities with details like time, description, duration, cost, and notes. Ensure the output is a valid JSON array where each element conforms to the DayItinerary schema, and each activity within a day conforms to the Activity schema.'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const generateItineraryPrompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  prompt: `You are an AI travel assistant. Generate a detailed day-wise itinerary for a trip to {{{destination}}} with a budget of \${{{budget}}} USD. The user is interested in {{{interests}}}.

Your response MUST be a valid JSON object that strictly adheres to the following structure:
{
  "itinerary": [ // An array of DayItinerary objects
    {
      "day": "Day 1", // Or a number, e.g., 1
      "theme": "Iconic Landmarks and Local Flavors", // Optional
      "summary": "A day focused on exploring famous sights and enjoying local cuisine.", // Optional overall description for the day
      "activities": [ // An array of Activity objects
        {
          "time": "9:00 AM", // Optional
          "description": "Visit the Eiffel Tower. Pre-book tickets to avoid long queues.",
          "duration": "3 hours", // Optional
          "cost": "€25", // Optional
          "notes": "Go early to beat the crowds. Take photos from Trocadero for the best views." // Optional
        },
        {
          "time": "1:00 PM",
          "description": "Lunch at a traditional Parisian bistro near the Eiffel Tower. Try the Coq au Vin.",
          "duration": "1.5 hours",
          "cost": "€30-€50",
          "notes": "Reservations recommended for popular spots."
        },
        // ... more activities for Day 1
      ],
      "estimatedDayCost": "€100-€150", // Optional: total estimated cost for the day
      "travelNotes": "Utilize the Metro for efficient travel between locations. A Navigo pass might be cost-effective." // Optional
    },
    // ... more DayItinerary objects for subsequent days
  ]
}

Focus on providing practical, engaging, and detailed information for each activity. Include specific place names where appropriate. Ensure all monetary values include currency symbols. The "description" for an activity should be the main plan. "notes" can provide extra tips.
Ensure the entire output is a single, valid JSON object matching the 'GenerateItineraryOutputSchema'.
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
    if (!output || !output.itinerary) {
      // Fallback or error handling if the LLM doesn't return the expected structure
      console.error("LLM did not return the expected itinerary structure.");
      // Potentially return a default empty itinerary or throw an error
      // For now, let's return an empty itinerary to avoid breaking the UI,
      // but this indicates a problem with the LLM's response or the prompt.
      return { itinerary: [] };
    }
    return output;
  }
);

