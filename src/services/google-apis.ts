
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
  forecasts: DailyForecast[];
  airQuality?: AirQualityData;
}

export async function getWeatherForecast(lat: number, lng: number, days: number = 7): Promise<DailyForecast[] | null> {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not configured.');
  const url = `https://forecast.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=${days}&languageCode=en&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const responseText = await response.text(); // Get raw text for logging
    console.log(`Google Forecast API response for lat: ${lat}, lng: ${lng}, days: ${days} - Status: ${response.status}`);
    console.log("Forecast API Raw Response Body:", responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: { message: `Failed to parse error response: ${responseText}` }};
      }
      console.error('Google Forecast API Error:', response.status, errorData);
      throw new Error(`Forecast API request failed: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = JSON.parse(responseText);
    console.log("Parsed Forecast API Data:", JSON.stringify(data, null, 2));
    
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
    throw error;
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
    console.log("Air Quality API Raw Response Body:", responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch(e) {
        errorData = { error: { message: `Failed to parse error response: ${responseText}`}};
      }
      console.error('Google Air Quality API Error:', response.status, errorData);
      throw new Error(`Air Quality API request failed: ${errorData.error?.message || response.statusText}`);
    }
    const data = JSON.parse(responseText);
    console.log("Parsed Air Quality API Data:", JSON.stringify(data, null, 2));

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
    throw error;
  }
}
