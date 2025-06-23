
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudSun, CloudRain, CloudSnow, Sun, Wind, Thermometer, AlertTriangle, Leaf, CloudFog, CloudDrizzle, CloudLightning, Cloudy, CalendarDays, Sunrise } from "lucide-react";
import type { GetWeatherAndAirQualityOutput, GetWeatherAndAirQualityInput } from "@/ai/flows/get-weather-and-air-quality";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { getWeatherAndAirQuality } from "@/ai/flows/get-weather-and-air-quality";


interface WeatherDisplayProps {
  location: string;
  onWeatherDataFetched?: (data: GetWeatherAndAirQualityOutput | null) => void;
}

const getWeatherIcon = (iconCode?: string, condition?: string): React.ReactElement => {
  const lowerCondition = condition?.toLowerCase() || "";

  // Prioritize iconCode if available and mapped
  if (iconCode) {
    if (iconCode.includes("clear") || iconCode.includes("sunny")) return <Sun className="h-10 w-10 text-yellow-400" />;
    if (iconCode.includes("partly_cloudy") || iconCode.includes("mostly_clear")) return <CloudSun className="h-10 w-10 text-sky-400" />;
    if (iconCode.includes("cloudy") || iconCode.includes("overcast")) return <Cloudy className="h-10 w-10 text-gray-400" />;
    if (iconCode.includes("rain_light") || iconCode.includes("drizzle")) return <CloudDrizzle className="h-10 w-10 text-blue-300" />;
    if (iconCode.includes("rain") || iconCode.includes("showers_day") || iconCode.includes("showers_night")) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (iconCode.includes("tstorm")) return <CloudLightning className="h-10 w-10 text-purple-400" />;
    if (iconCode.includes("snow") || iconCode.includes("flurries")) return <CloudSnow className="h-10 w-10 text-blue-200" />;
    if (iconCode.includes("fog")) return <CloudFog className="h-10 w-10 text-gray-400" />;
    if (iconCode.includes("wind")) return <Wind className="h-10 w-10 text-slate-500" />;
  }

  // Fallback to condition string matching
  if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) return <Sun className="h-10 w-10 text-yellow-400" />;
  if (lowerCondition.includes("partly cloudy") || lowerCondition.includes("scattered clouds") || lowerCondition.includes("mostly clear")) return <CloudSun className="h-10 w-10 text-sky-400" />;
  if (lowerCondition.includes("cloudy") || lowerCondition.includes("mostly cloudy") || lowerCondition.includes("overcast")) return <Cloudy className="h-10 w-10 text-gray-400" />;
  if (lowerCondition.includes("drizzle") || lowerCondition.includes("light rain")) return <CloudDrizzle className="h-10 w-10 text-blue-300" />;
  if (lowerCondition.includes("rain") || lowerCondition.includes("showers")) return <CloudRain className="h-10 w-10 text-blue-500" />;
  if (lowerCondition.includes("thunderstorm")) return <CloudLightning className="h-10 w-10 text-purple-400" />;
  if (lowerCondition.includes("snow") || lowerCondition.includes("flurries")) return <CloudSnow className="h-10 w-10 text-blue-200" />;
  if (lowerCondition.includes("fog") || lowerCondition.includes("mist")) return <CloudFog className="h-10 w-10 text-gray-400" />;
  if (lowerCondition.includes("windy")) return <Wind className="h-10 w-10 text-slate-500" />;

  return <Thermometer className="h-10 w-10 text-slate-600" />;
};


export function WeatherDisplay({ location, onWeatherDataFetched }: WeatherDisplayProps) {
  const [data, setData] = useState<GetWeatherAndAirQualityOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setLoading(true);
      setError(null);
      setData(null);
      if (onWeatherDataFetched) onWeatherDataFetched(null);

      const input: GetWeatherAndAirQualityInput = { destination: location, days: 7 };
      getWeatherAndAirQuality(input)
        .then(response => {
          setData(response);
          if (response.error) {
            setError(response.error);
            console.warn("Weather API partial error:", response.error);
          }
          if (onWeatherDataFetched) onWeatherDataFetched(response);
        })
        .catch(err => {
          console.error("Error fetching weather/AQ data:", err);
          setError(err.message || "Failed to fetch weather and air quality data.");
           if (onWeatherDataFetched) onWeatherDataFetched({destination: location, forecasts: null, airQuality: null, error: err.message || "Failed to fetch data."});
        })
        .finally(() => {
          setLoading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return "bg-green-500/80 text-white"; // Good
    if (aqi <= 100) return "bg-yellow-500/80 text-black"; // Moderate
    if (aqi <= 150) return "bg-orange-500/80 text-white"; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return "bg-red-500/80 text-white"; // Unhealthy
    if (aqi <= 300) return "bg-purple-600/80 text-white"; // Very Unhealthy
    return "bg-maroon-700/80 text-white"; // Hazardous
  };


  return (
    <Card className="shadow-2xl bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="border-b border-primary/10 pb-4">
        <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <CloudSun className="h-7 w-7 text-accent" /> Weather & Air Quality
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">Outlook for {location}.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4 rounded-lg bg-muted/70" />
            <Skeleton className="h-8 w-1/2 rounded-md bg-muted/70" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-muted/70" />)}
            </div>
             <Skeleton className="h-20 w-full rounded-lg mt-4 bg-muted/70" />
          </div>
        )}
        {error && !loading && !data?.forecasts && !data?.airQuality && <p className="text-destructive text-lg flex items-center gap-2"><AlertTriangle className="inline h-6 w-6" />{error}</p>}

        {data && !loading && (
          <div className="space-y-8">
            {data.forecasts && data.forecasts.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-primary flex items-center gap-2"><Sunrise className="text-accent"/> Current Outlook (Today)</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/50 rounded-xl shadow-lg border border-border">
                  <div className="text-6xl">
                    {getWeatherIcon(data.forecasts[0].iconCode, data.forecasts[0].condition)}
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-4xl font-bold text-foreground/90">{data.forecasts[0].maxTempC}°C</p>
                    <p className="text-lg text-muted-foreground capitalize">{data.forecasts[0].condition}</p>
                    <p className="text-sm text-muted-foreground">Min: {data.forecasts[0].minTempC}°C</p>
                  </div>
                </div>
              </div>
            )}

            {data.forecasts && data.forecasts.length > 1 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2"><CalendarDays className="text-accent"/> 7-Day Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                  {data.forecasts.map((day, index) => (
                    <div key={index} className="p-3 border border-border rounded-xl bg-card/80 hover:shadow-xl hover:border-accent/50 transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center shadow-md">
                      <p className="font-semibold text-sm text-primary">{formatDate(day.date)}</p>
                      <div className="my-2 text-4xl">
                         {getWeatherIcon(day.iconCode, day.condition)}
                      </div>
                      <p className="text-lg font-bold text-foreground/90">{day.maxTempC}°C</p>
                      <p className="text-xs text-muted-foreground">{day.minTempC}°C</p>
                      <p className="text-xs text-center text-muted-foreground capitalize mt-1 truncate w-full" title={day.condition}>{day.condition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.airQuality && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-primary flex items-center gap-2"><Leaf className="text-green-500"/> Air Quality</h3>
                <div className={`p-4 rounded-xl shadow-lg border ${getAQIColor(data.airQuality.aqi)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">AQI: {data.airQuality.aqi}</span>
                    <span className="font-semibold text-lg px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm">{data.airQuality.category}</span>
                  </div>
                  {data.airQuality.dominantPollutant && <p className="text-sm mt-1">Dominant Pollutant: {data.airQuality.dominantPollutant}</p>}
                   {data.airQuality.recommendations?.generalPopulation && (
                    <p className="text-xs mt-2 italic">Health Advice: {data.airQuality.recommendations.generalPopulation}</p>
                  )}
                  {data.airQuality.source && <p className="text-xs mt-2 opacity-80">Source: {data.airQuality.source}</p>}
                </div>
              </div>
            )}

            {data.error && (!data.forecasts || data.forecasts.length === 0) && (!data.airQuality) && (
                <p className="text-destructive text-lg flex items-center gap-2"><AlertTriangle className="inline h-6 w-6" />{data.error}</p>
            )}

            {(!data.forecasts || data.forecasts.length === 0) && !data.airQuality && !data.error && !loading && (
                 <p className="text-muted-foreground text-center py-4">Weather and air quality data will appear here once a destination is set.</p>
            )}
             <p className="text-xs text-muted-foreground/80 mt-6 text-center italic">Weather and Air Quality data provided by Google. Accuracy may vary.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
