
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

async function geocodeDestinationWithName(destinationName: string, apiKey: string | undefined): Promise<GeocodeResult | null> {
  if (!apiKey) {
    console.warn("Google Maps API key is missing. Using mock geocoding.");
    // Fallback mock geocoding
    if (destinationName.toLowerCase().includes("paris")) return { lat: 48.8566, lng: 2.3522 };
    if (destinationName.toLowerCase().includes("tokyo")) return { lat: 35.6895, lng: 139.6917 };
    if (destinationName.toLowerCase().includes("new york")) return { lat: 40.7128, lng: -74.0060 };
    return { lat: 37.0902, lng: -95.7129 }; // Default to center of US
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destinationName)}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error("Geocoding API error:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    return null;
  }
}


export function MapDisplay({ destination }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (destination) {
      setLoading(true);
      geocodeDestinationWithName(destination, apiKey)
        .then(coords => {
          if (!isMounted) return;
          if (coords) {
            setPosition(coords);
            setError(null);
          } else {
            setError(`Could not find coordinates for ${destination}. Displaying default location.`);
            setPosition({ lat: 37.0902, lng: -95.7129 }); // Default position on error
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error("Geocoding error:", err);
          setError("Error finding location. Displaying default location.");
          setPosition({ lat: 37.0902, lng: -95.7129 }); // Default position on error
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
       if (isMounted) setLoading(false);
    }
    return () => { isMounted = false; }
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
        {loading && <p className="text-muted-foreground">Loading map...</p>}
        {error && <p className="text-destructive mb-2">{error}</p>}
        
        {!apiKey && !loading && (
             <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-center">
                    Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is not configured. <br/>
                    Please add it to your .env file to enable full map functionality. <br/>
                    A placeholder map is shown.
                </p>
             </div>
        )}

        {apiKey && position && !loading && (
          <div className="h-[400px] w-full rounded-md overflow-hidden">
            <APIProvider apiKey={apiKey} solutionChannel="GMP_wanderswise_app_v1">
              <Map
                center={position} // Changed from defaultCenter to center for dynamic updates
                zoom={10}        // Changed from defaultZoom to zoom
                mapId="wanderwise-map"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
              >
                <AdvancedMarker position={position} title={destination} />
              </Map>
            </APIProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
