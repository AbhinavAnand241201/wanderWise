
// src/ai/tools/google-apis-tool.ts
'use server';
/**
 * @fileOverview Genkit tools for interacting with Google APIs (Geocoding, Weather, Air Quality).
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  geocodeAddress as geocodeAddressService, 
  getWeatherForecast as getWeatherForecastService,
  getCurrentAirQuality as getCurrentAirQualityService,
  type GeocodeLocation,
  type DailyForecast,
  type AirQualityData
} from '@/services/google-apis';

// Geocoding Tool
const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The street address or place name to geocode.'),
});
const GeocodeAddressOutputSchema = z.object({
  lat: z.number(),
  lng: z.number(),
}).nullable();

export const geocodeAddressTool = ai.defineTool(
  {
    name: 'geocodeAddress',
    description: 'Converts a textual address or place name into geographic coordinates (latitude and longitude). Use this to find coordinates for a location before fetching weather or air quality.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async (input) => {
    try {
      return await geocodeAddressService(input.address);
    } catch (error) {
      console.error("Error in geocodeAddressTool:", error);
      return null; // Return null on error to allow flow to continue if designed for it
    }
  }
);

// Weather Forecast Tool
const WeatherForecastInputSchema = z.object({
  lat: z.number().describe("Latitude of the location."),
  lng: z.number().describe("Longitude of the location."),
  days: z.number().optional().default(7).describe("Number of days for the forecast (1-16)."),
});
const DailyForecastSchema = z.object({
  date: z.string().describe("Date of the forecast in YYYY-MM-DD format."),
  minTempC: z.number().describe("Minimum temperature in Celsius."),
  maxTempC: z.number().describe("Maximum temperature in Celsius."),
  condition: z.string().describe("Textual description of the weather condition."),
  iconCode: z.string().optional().describe("Weather condition icon code from the API."),
});
const WeatherForecastOutputSchema = z.array(DailyForecastSchema).nullable();

export const getWeatherForecastTool = ai.defineTool(
  {
    name: 'getWeatherForecast',
    description: 'Fetches the weather forecast for a given latitude and longitude for a specified number of days.',
    inputSchema: WeatherForecastInputSchema,
    outputSchema: WeatherForecastOutputSchema,
  },
  async (input) => {
     try {
      return await getWeatherForecastService(input.lat, input.lng, input.days);
    } catch (error) {
      console.error("Error in getWeatherForecastTool:", error);
      return null;
    }
  }
);

// Air Quality Tool
const AirQualityInputSchema = z.object({
  lat: z.number().describe("Latitude of the location."),
  lng: z.number().describe("Longitude of the location."),
});
const AirQualityOutputSchema = z.object({
  aqi: z.number().describe("Air Quality Index value."),
  category: z.string().describe("Textual description of the AQI category (e.g., 'Good', 'Moderate')."),
  dominantPollutant: z.string().optional().describe("The main pollutant if applicable."),
  source: z.string().optional().describe("Data source attribution."),
  recommendations: z.record(z.string()).optional().describe("Health recommendations."),
}).nullable();

export const getAirQualityTool = ai.defineTool(
  {
    name: 'getCurrentAirQuality',
    description: 'Fetches the current air quality conditions for a given latitude and longitude.',
    inputSchema: AirQualityInputSchema,
    outputSchema: AirQualityOutputSchema,
  },
  async (input) => {
    try {
      return await getCurrentAirQualityService(input.lat, input.lng);
    } catch (error) {
      console.error("Error in getAirQualityTool:", error);
      return null;
    }
  }
);
