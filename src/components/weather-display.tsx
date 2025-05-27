"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudSun } from "lucide-react";
import { useEffect, useState } from "react";

interface WeatherDisplayProps {
  location: string;
}

// This is a placeholder. In a real app, you'd fetch data from a weather API.
// Example: OpenWeatherMap API (requires API key)

export function WeatherDisplay({ location }: WeatherDisplayProps) {
  const [weatherData, setWeatherData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // In a real app, set to true initially

  useEffect(() => {
    if (location) {
      // Simulate API call
      setLoading(true);
      setTimeout(() => {
        // Replace with actual API call
        setWeatherData(`Sunny, 25°C for ${location}. (Mock data)`);
        setLoading(false);
      }, 1000);
    }
  }, [location]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
          <CloudSun className="h-6 w-6" /> Real-Time Weather
        </CardTitle>
        <CardDescription>Current weather conditions for {location}.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-muted-foreground">Loading weather data...</p>}
        {!loading && weatherData && <p className="text-lg">{weatherData}</p>}
        {!loading && !weatherData && (
          <p className="text-muted-foreground">
            Weather information will be displayed here. (Weather API integration needed)
          </p>
        )}
         <p className="text-xs text-muted-foreground mt-2">Note: This feature requires integration with a live weather API.</p>
      </CardContent>
    </Card>
  );
}
