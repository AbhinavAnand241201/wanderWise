
'use server';

import { geocodeAddress as geocodeAddressService } from '@/services/google-apis';
import { getDirections as getDirectionsService } from '@/services/google-apis'; // Direct service usage

interface FetchDirectionsParams {
  originAddress: string;
  destinationAddress: string;
}

export interface FetchDirectionsResult {
  summary: string | null;
  overviewPolyline: string | null;
  error?: string;
}

export async function fetchAndSummarizeDirections({
  originAddress,
  destinationAddress,
}: FetchDirectionsParams): Promise<FetchDirectionsResult> {
  console.log(`Fetching directions from ${originAddress} to ${destinationAddress}`);
  try {
    const [originCoords, destinationCoords] = await Promise.all([
      geocodeAddressService(originAddress),
      geocodeAddressService(destinationAddress),
    ]);

    if (!originCoords) {
      return { summary: null, overviewPolyline: null, error: `Could not find coordinates for origin: ${originAddress}` };
    }
    if (!destinationCoords) {
      return { summary: null, overviewPolyline: null, error: `Could not find coordinates for destination: ${destinationAddress}` };
    }

    console.log('Origin Coords:', originCoords);
    console.log('Destination Coords:', destinationCoords);

    const directionsResult = await getDirectionsService(
      originCoords.lat,
      originCoords.lng,
      destinationCoords.lat,
      destinationCoords.lng
    );

    if (!directionsResult) {
      return { summary: null, overviewPolyline: null, error: 'Failed to get directions from the service.' };
    }
    
    console.log('Directions Result from service:', directionsResult);

    return {
      summary: directionsResult.summary,
      overviewPolyline: directionsResult.overviewPolyline,
    };

  } catch (error) {
    console.error('Error in fetchAndSummarizeDirections server action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching directions.';
    return { summary: null, overviewPolyline: null, error: message };
  }
}
