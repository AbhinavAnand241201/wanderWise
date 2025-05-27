
import { config } from 'dotenv';
config(); // Load .env variables

import '@/ai/flows/generate-itinerary.ts';
import '@/ai/flows/suggest-places.ts';
import '@/ai/flows/get-weather-and-air-quality.ts'; // Added new flow
// Tools are implicitly available via their flows, no direct import needed here unless for standalone testing.
