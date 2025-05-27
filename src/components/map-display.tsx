"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapIcon } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

interface MapDisplayProps {
  destination: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

// A very simple mock geocoding function. 
// In a real app, use Google's Geocoding API.
async function geocodeDestination(destinationName: string): Promise<GeocodeResult | null> {
  // This is a placeholder. Real geocoding requires an API call.
  // For demonstration, we'll return a fixed coordinate if an API key is not available or for common places.
  // You should replace this with a call to Google's Geocoding API.
  console.log(`Geocoding (mock): ${destinationName}`);
  if (destinationName.toLowerCase().includes("paris")) return { lat: 48.8566, lng: 2.3522 };
  if (destinationName.toLowerCase().includes("tokyo")) return { lat: 35.6895, lng: 139.6917 };
  if (destinationName.toLowerCase().includes("new york")) return { lat: 40.7128, lng: -74.0060 };
  return { lat: 37.0902, lng: -95.7129 }; // Default to center of US
}


export function MapDisplay({ destination }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (destination && apiKey) {
      geocodeDestination(destination)
        .then(coords => {
          if (coords) {
            setPosition(coords);
            setError(null);
          } else {
            setError(`Could not find coordinates for ${destination}.`);
            setPosition({ lat: 0, lng: 0 }); // Default position
          }
        })
        .catch(err => {
          console.error("Geocoding error:", err);
          setError("Error finding location.");
          setPosition({ lat: 0, lng: 0 }); // Default position
        });
    } else if (!apiKey) {
      setError("Google Maps API key is missing. Map functionality is limited.");
      // Set a default position so the map can render without API for placeholders
      setPosition({ lat: 0, lng: 0 }); 
    }
  }, [destination, apiKey]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
          <MapIcon className="h-6 w-6" /> Interactive Map
        </CardTitle>
        <CardDescription>Visualize your destination: {destination}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-2">{error}</p>}
        {!apiKey && (
             <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md">
                <p className="text-muted-foreground p-4 text-center">
                    Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is not configured. <br/>
                    Please add it to your .env.local file to enable full map functionality. <br/>
                    A placeholder map is shown.
                </p>
             </div>
        )}
        {apiKey && position && (
          <div className="h-[400px] w-full rounded-md overflow-hidden">
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={position}
                defaultZoom={10}
                mapId="wanderwise-map"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
              >
                <AdvancedMarker position={position} title={destination} />
              </Map>
            </APIProvider>
          </div>
        )}
         {!apiKey && position && ( // Fallback for when API key is missing but we want to show something
            <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-center">
                    Map preview would appear here if API key was provided.
                    <br />Currently centered on a default location.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
