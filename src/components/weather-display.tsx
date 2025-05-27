
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cloud, CloudSun, CloudRain, CloudSnow, Sun, Wind, Thermometer, AlertTriangle, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { getWeatherAndAirQuality, type GetWeatherAndAirQualityOutput, type GetWeatherAndAirQualityInput } from "@/ai/flows/get-weather-and-air-quality";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherDisplayProps {
  location: string; // This will be the input to the Genkit flow
}

// Helper to map Google icon codes (or conditions) to Lucide icons
const getWeatherIcon = (iconCode?: string, condition?: string): React.ReactElement => {
  const lowerCondition = condition?.toLowerCase() || "";
  // Google's icon codes are not publicly documented in a simple mapping.
  // We'll rely on condition string matching for a basic implementation.
  // A more robust solution might involve a detailed mapping if Google provides one or using a third-party library.
  if (iconCode?.includes("day_clear") || lowerCondition.includes("clear") || lowerCondition.includes("sunny")) return <Sun className="h-5 w-5 text-yellow-400" />;
  if (iconCode?.includes("day_partial_cloud") || lowerCondition.includes("partly cloudy") || lowerCondition.includes("scattered clouds")) return <CloudSun className="h-5 w-5 text-sky-400" />;
  if (iconCode?.includes("cloudy") || lowerCondition.includes("mostly cloudy") || lowerCondition.includes("overcast")) return <Cloud className="h-5 w-5 text-gray-400" />;
  if (iconCode?.includes("rain") || lowerCondition.includes("rain") || lowerCondition.includes("showers")) return <CloudRain className="h-5 w-5 text-blue-400" />;
  if (iconCode?.includes("snow") || lowerCondition.includes("snow")) return <CloudSnow className="h-5 w-5 text-blue-300" />;
  if (iconCode?.includes("wind") || lowerCondition.includes("windy")) return <Wind className="h-5 w-5 text-gray-500" />;
  return <Thermometer className="h-5 w-5 text-slate-500" />; // Default
};


export function WeatherDisplay({ location }: WeatherDisplayProps) {
  const [data, setData] = useState<GetWeatherAndAirQualityOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setLoading(true);
      setError(null);
      setData(null);
      
      const input: GetWeatherAndAirQualityInput = { destination: location, days: 7 };
      getWeatherAndAirQuality(input)
        .then(response => {
          setData(response);
          if (response.error) {
            setError(response.error);
          }
        })
        .catch(err => {
          console.error("Error fetching weather/AQ data:", err);
          setError(err.message || "Failed to fetch weather and air quality data.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [location]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Assume local timezone for display
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
          <CloudSun className="h-6 w-6" /> Weather & Air Quality
        </CardTitle>
        <CardDescription>Forecast and air conditions for {location}.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          </div>
        )}
        {error && <p className="text-destructive"><AlertTriangle className="inline mr-2 h-4 w-4" />{error}</p>}
        
        {data && !loading && (
          <div className="space-y-6">
            {/* Current Weather - Approximated from first day of forecast or specific 'current' field if API provides */}
            {data.forecasts && data.forecasts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Current Outlook (Today)</h3>
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                  {getWeatherIcon(data.forecasts[0].iconCode, data.forecasts[0].condition)}
                  <div>
                    <p className="text-2xl font-bold">{data.forecasts[0].maxTempC}°C</p>
                    <p className="text-muted-foreground">{data.forecasts[0].condition}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Forecast */}
            {data.forecasts && data.forecasts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">7-Day Forecast</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.forecasts.map((day, index) => (
                    <div key={index} className="p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                      <p className="font-semibold text-sm">{formatDate(day.date)}</p>
                      <div className="flex items-center justify-center my-2">
                         {getWeatherIcon(day.iconCode, day.condition)}
                      </div>
                      <p className="text-center text-lg font-medium">{day.maxTempC}°C / {day.minTempC}°C</p>
                      <p className="text-xs text-center text-muted-foreground capitalize">{day.condition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Air Quality */}
            {data.airQuality && (
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary flex items-center gap-2"><Leaf className="h-5 w-5" /> Air Quality</h3>
                <div className="p-3 bg-muted/50 rounded-md space-y-1">
                  <p><strong>AQI:</strong> {data.airQuality.aqi} ({data.airQuality.category})</p>
                  {data.airQuality.dominantPollutant && <p className="text-sm text-muted-foreground">Dominant Pollutant: {data.airQuality.dominantPollutant}</p>}
                  {data.airQuality.source && <p className="text-xs text-muted-foreground">Source: {data.airQuality.source}</p>}
                   {data.airQuality.recommendations?.generalPopulation && (
                    <p className="text-xs mt-1">Health Advice: {data.airQuality.recommendations.generalPopulation}</p>
                  )}
                </div>
              </div>
            )}
            
            {!data.forecasts && !data.airQuality && !data.error && (
                 <p className="text-muted-foreground">Weather and air quality data will appear here.</p>
            )}
             <p className="text-xs text-muted-foreground mt-4">Weather and Air Quality data provided by Google. Accuracy may vary.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
