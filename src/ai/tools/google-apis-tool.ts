
// src/ai/tools/google-apis-tool.ts
'use server';
/**
 * @fileOverview Genkit tools for interacting with Google APIs (Geocoding, Weather, Air Quality, Places, Directions).
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  geocodeAddress as geocodeAddressService, 
  getWeatherForecast as getWeatherForecastService,
  getCurrentAirQuality as getCurrentAirQualityService,
  findPlacePhotoByTextSearch as findPlacePhotoByTextSearchService,
  getDirections as getDirectionsService, // New service import
  type GeocodeLocation,
  type DailyForecast,
  type AirQualityData,
  type PlacePhotoReference,
  type DirectionsResult
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
    description: 'Converts a textual address or place name into geographic coordinates (latitude and longitude). Use this to find coordinates for a location before fetching weather, air quality or finding places.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async (input) => {
    try {
      return await geocodeAddressService(input.address);
    } catch (error) {
      console.error("Error in geocodeAddressTool:", error);
      return null; 
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

// Find Place Photo Tool
const FindPlacePhotoInputSchema = z.object({
  placeName: z.string().describe('The name of the place to find a photo for (e.g., "Louvre Museum", "Joe\'s Pizza Shack").'),
  destinationContext: z.string().describe('The broader destination context to help disambiguate the place name (e.g., "Paris, France", "New York City").'),
});
const FindPlacePhotoOutputSchema = z.object({
  photoReference: z.string().nullable(), 
}).describe("A photo reference string from Google Places API, or null if not found.");


export const findPlacePhotoTool = ai.defineTool(
  {
    name: 'findPlacePhoto',
    description: 'Finds a photo reference for a given place name within a destination context using Google Places API. This reference can be used to display an image of the place.',
    inputSchema: FindPlacePhotoInputSchema,
    outputSchema: FindPlacePhotoOutputSchema,
  },
  async (input) => {
    try {
      const geocodedContext = await geocodeAddressService(input.destinationContext);
      const query = `${input.placeName} in ${input.destinationContext}`;
      
      const result = await findPlacePhotoByTextSearchService(query, geocodedContext?.lat, geocodedContext?.lng);
      return result ? { photoReference: result.photoReference } : { photoReference: null };
    } catch (error) {
      console.error("Error in findPlacePhotoTool:", error);
      return { photoReference: null }; 
    }
  }
);

// Get Directions Tool (New Tool)
const GetDirectionsInputSchema = z.object({
  originLat: z.number().describe("Latitude of the origin."),
  originLng: z.number().describe("Longitude of the origin."),
  destinationLat: z.number().describe("Latitude of the destination."),
  destinationLng: z.number().describe("Longitude of the destination."),
});

const GetDirectionsOutputSchema = z.object({
  summary: z.string().describe("Textual summary of the directions (e.g., '15 mins (7.5 km)')."),
  distance: z.string().describe("Total distance of the route."),
  duration: z.string().describe("Total duration of the route."),
  overviewPolyline: z.string().nullable().describe("Encoded polyline string for the route overview."),
}).nullable();

export const getDirectionsTool = ai.defineTool(
  {
    name: 'getDirections',
    description: 'Fetches directions, including distance, duration, and route polyline, between two geographic coordinates.',
    inputSchema: GetDirectionsInputSchema,
    outputSchema: GetDirectionsOutputSchema,
  },
  async (input) => {
    try {
      return await getDirectionsService(input.originLat, input.originLng, input.destinationLat, input.destinationLng);
    } catch (error) {
      console.error("Error in getDirectionsTool:", error);
      return null;
    }
  }
);
