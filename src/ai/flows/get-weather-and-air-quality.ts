
// src/ai/flows/get-weather-and-air-quality.ts
'use server';
/**
 * @fileOverview A Genkit flow to get weather forecast and air quality for a destination.
 *
 * - getWeatherAndAirQuality - Fetches weather and air quality data.
 * - GetWeatherAndAirQualityInput - Input schema for the flow.
 * - GetWeatherAndAirQualityOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  geocodeAddressTool, 
  getWeatherForecastTool, 
  getAirQualityTool 
} from '@/ai/tools/google-apis-tool';

const GetWeatherAndAirQualityInputSchema = z.object({
  destination: z.string().describe('The destination city or region for which to fetch weather and air quality.'),
  days: z.number().optional().default(7).describe('Number of forecast days required (1-16).'),
});
export type GetWeatherAndAirQualityInput = z.infer<typeof GetWeatherAndAirQualityInputSchema>;

const DailyForecastOutputSchema = z.object({
  date: z.string(),
  minTempC: z.number(),
  maxTempC: z.number(),
  condition: z.string(),
  iconCode: z.string().optional(),
});

const AirQualityOutputSchema = z.object({
  aqi: z.number(),
  category: z.string(),
  dominantPollutant: z.string().optional(),
  source: z.string().optional(),
  recommendations: z.record(z.string()).optional(),
}).nullable();

const GetWeatherAndAirQualityOutputSchema = z.object({
  destination: z.string(),
  forecasts: z.array(DailyForecastOutputSchema).nullable().describe("Array of daily weather forecasts."),
  airQuality: AirQualityOutputSchema.optional().describe("Current air quality information."),
  error: z.string().optional().describe("Error message if data fetching failed for a part."),
});
export type GetWeatherAndAirQualityOutput = z.infer<typeof GetWeatherAndAirQualityOutputSchema>;

// This flow does not use an LLM prompt directly, it orchestrates tool calls.
const getWeatherAndAirQualityFlow = ai.defineFlow(
  {
    name: 'getWeatherAndAirQualityFlow',
    inputSchema: GetWeatherAndAirQualityInputSchema,
    outputSchema: GetWeatherAndAirQualityOutputSchema,
    // Since we are not using an LLM to interpret natural language for this flow,
    // we don't need system prompt or tools in the flow definition itself.
    // The tools are called directly in the flow logic.
  },
  async (input) => {
    let errorMessage = "";

    // 1. Geocode destination
    const geocodeResult = await geocodeAddressTool({ address: input.destination });

    if (!geocodeResult) {
      console.error(`Geocoding failed for ${input.destination}`);
      return { 
        destination: input.destination, 
        forecasts: null, 
        airQuality: null,
        error: `Could not find coordinates for ${input.destination}.` 
      };
    }

    const { lat, lng } = geocodeResult;

    // 2. Fetch Weather Forecast (concurrently with Air Quality)
    const weatherPromise = getWeatherForecastTool({ lat, lng, days: input.days })
      .catch(err => {
        console.error(`Error fetching weather for ${input.destination}:`, err);
        errorMessage += `Failed to fetch weather. ${err.message || ''} `;
        return null;
      });

    // 3. Fetch Air Quality (concurrently with Weather)
    const airQualityPromise = getAirQualityTool({ lat, lng })
      .catch(err => {
        console.error(`Error fetching air quality for ${input.destination}:`, err);
        errorMessage += `Failed to fetch air quality. ${err.message || ''}`;
        return null;
      });
      
    const [forecasts, airQuality] = await Promise.all([weatherPromise, airQualityPromise]);

    return {
      destination: input.destination,
      forecasts: forecasts,
      airQuality: airQuality,
      error: errorMessage.trim() || undefined,
    };
  }
);

export async function getWeatherAndAirQuality(input: GetWeatherAndAirQualityInput): Promise<GetWeatherAndAirQualityOutput> {
  return getWeatherAndAirQualityFlow(input);
}
