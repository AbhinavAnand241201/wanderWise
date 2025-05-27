
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
  // Note: Google Forecast API is a premium API.
  // Using languageCode=en for English descriptions
  const url = `https://forecast.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=${days}&languageCode=en&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Forecast API Error:', response.status, errorData);
      throw new Error(`Forecast API request failed: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    
    if (data.dailyForecasts && Array.isArray(data.dailyForecasts)) {
      return data.dailyForecasts.map((df: any) => ({
        date: `${df.date.year}-${String(df.date.month).padStart(2, '0')}-${String(df.date.day).padStart(2, '0')}`,
        minTempC: df.temperatureForecast?.min ? parseFloat(df.temperatureForecast.min.value) : 0,
        maxTempC: df.temperatureForecast?.max ? parseFloat(df.temperatureForecast.max.value) : 0,
        condition: df.conditionDescription || 'Not available',
        iconCode: df.iconCode, // You'll need to map this to your display icons
      }));
    }
    return null;
  } catch (error) {
    console.error('Error fetching weather forecast data:', error);
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
        // universalAqi: true, // To get a universal AQI value
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Air Quality API Error:', response.status, errorData);
      throw new Error(`Air Quality API request failed: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();

    if (data.indexes && data.indexes.length > 0) {
      const primaryIndex = data.indexes.find((idx: any) => idx.code === 'uaqi') || data.indexes[0]; // Prefer Universal AQI
      return {
        aqi: primaryIndex.aqi,
        category: primaryIndex.category,
        dominantPollutant: primaryIndex.dominantPollutant,
        source: data.sources && data.sources.length > 0 ? data.sources[0].name : 'Unknown',
        recommendations: data.healthRecommendations,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    throw error;
  }
}
