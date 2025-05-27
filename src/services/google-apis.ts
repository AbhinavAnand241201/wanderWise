
// src/services/google-apis.ts
'use server';

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn(
    'GOOGLE_API_KEY is not set in environment variables. Google API calls will fail.'
  );
}

export interface GeocodeLocation {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeLocation | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Geocoding API response for:", address, JSON.stringify(data, null, 2));
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    console.error('Geocoding API Error:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error fetching geocoding data:', error);
    throw error;
  }
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  minTempC: number;
  maxTempC: number;
  condition: string;
  iconCode?: string; // Google's icon code
}

export interface AirQualityData {
  aqi: number;
  category: string;
  dominantPollutant?: string;
  source?: string;
  recommendations?: Record<string, string>;
}

export interface WeatherAndAirQualityOutput {
  forecasts: DailyForecast[] | null;
  airQuality?: AirQualityData | null;
}

export async function getWeatherForecast(lat: number, lng: number, days: number = 7): Promise<DailyForecast[] | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');
  const url = `https://forecast.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=${days}&languageCode=en&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const responseText = await response.text(); 
    console.log(`Google Forecast API response for lat: ${lat}, lng: ${lng}, days: ${days} - Status: ${response.status}`);
    // console.log("Forecast API Raw Response Body:", responseText); // Potentially very verbose

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: { message: `Failed to parse error response: ${responseText}` }};
      }
      console.error('Google Forecast API Error:', response.status, errorData);
      return null;
    }
    
    const data = JSON.parse(responseText);
    // console.log("Parsed Forecast API Data:", JSON.stringify(data, null, 2)); // Potentially very verbose
    
    if (data.dailyForecasts && Array.isArray(data.dailyForecasts)) {
      return data.dailyForecasts.map((df: any) => ({
        date: `${df.date.year}-${String(df.date.month).padStart(2, '0')}-${String(df.date.day).padStart(2, '0')}`,
        minTempC: df.temperatureForecast?.min ? parseFloat(df.temperatureForecast.min.value) : 0,
        maxTempC: df.temperatureForecast?.max ? parseFloat(df.temperatureForecast.max.value) : 0,
        condition: df.conditionDescription || 'Not available',
        iconCode: df.iconCode,
      }));
    }
    console.warn("No dailyForecasts array found in Forecast API response or it's not an array.");
    return null;
  } catch (error) {
    console.error('Error fetching or processing weather forecast data:', error);
    return null;
  }
}

export async function getCurrentAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
      }),
    });
    const responseText = await response.text();
    console.log(`Google Air Quality API response for lat: ${lat}, lng: ${lng} - Status: ${response.status}`);
    // console.log("Air Quality API Raw Response Body:", responseText); // Potentially verbose

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch(e) {
        errorData = { error: { message: `Failed to parse error response: ${responseText}`}};
      }
      console.error('Google Air Quality API Error:', response.status, errorData);
      return null;
    }
    const data = JSON.parse(responseText);
    // console.log("Parsed Air Quality API Data:", JSON.stringify(data, null, 2)); // Potentially verbose

    if (data.indexes && data.indexes.length > 0) {
      const primaryIndex = data.indexes.find((idx: any) => idx.code === 'uaqi') || data.indexes[0];
      return {
        aqi: primaryIndex.aqi,
        category: primaryIndex.category,
        dominantPollutant: primaryIndex.dominantPollutant,
        source: data.sources && data.sources.length > 0 ? data.sources[0].name : 'Unknown',
        recommendations: data.healthRecommendations,
      };
    }
    console.warn("No indexes array found in Air Quality API response or it's empty.");
    return null;
  } catch (error) {
    console.error('Error fetching or processing air quality data:', error);
    return null;
  }
}

export interface PlacePhotoReference {
  photoReference: string | null;
}

export async function findPlacePhotoByTextSearch(query: string, lat?: number, lng?: number): Promise<PlacePhotoReference | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');
  
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  if (lat && lng) {
    url += `&location=${lat}%2C${lng}&radius=50000`; 
  }
  
  // console.log("Google Places Text Search URL:", url); // Potentially verbose

  try {
    const response = await fetch(url);
    const data = await response.json();
    // console.log("Places Text Search API response for query:", query, JSON.stringify(data, null, 2)); // Potentially verbose

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const place = data.results[0];
      if (place.photos && place.photos.length > 0) {
        return { photoReference: place.photos[0].photo_reference };
      }
    }
    console.warn('No photo reference found for query:', query, 'Status:', data.status, 'Error:', data.error_message);
    return { photoReference: null };
  } catch (error) {
    console.error('Error fetching place photo data:', error);
    return null;
  }
}

export interface DirectionsResult {
  summary: string; // e.g., "15 mins (7.5 km)"
  distance: string;
  duration: string;
  overviewPolyline: string | null; // Encoded polyline string
}

export async function getDirections(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number
): Promise<DirectionsResult | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destinationLat},${destinationLng}&key=${API_KEY}`;
  console.log("Google Directions API URL:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Directions API Response:", JSON.stringify(data, null, 2));

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      if (route.legs && route.legs.length > 0) {
        const leg = route.legs[0];
        const distance = leg.distance?.text || 'N/A';
        const duration = leg.duration?.text || 'N/A';
        const overviewPolyline = route.overview_polyline?.points || null;

        return {
          summary: `${duration} (${distance})`,
          distance,
          duration,
          overviewPolyline,
        };
      }
    }
    console.error('Directions API Error or no routes found:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error fetching directions data:', error);
    return null;
  }
}
