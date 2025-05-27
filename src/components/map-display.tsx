
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapIcon } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

interface MapDisplayProps {
  destination: string;
  routePolyline?: string | null; // Encoded polyline for the route
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

// This function should ideally live in a service or utils file if used elsewhere.
async function geocodeDestinationWithName(destinationName: string, apiKey: string | undefined): Promise<GeocodeResult | null> {
  if (!apiKey) {
    console.warn("Google Maps API key is missing for geocoding. Using mock geocoding.");
    // Fallback mock geocoding - adjust as needed or remove if API key is always expected
    if (destinationName.toLowerCase().includes("paris")) return { lat: 48.8566, lng: 2.3522 };
    if (destinationName.toLowerCase().includes("tokyo")) return { lat: 35.6895, lng: 139.6917 };
    return { lat: 37.0902, lng: -95.7129 }; // Default
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

export function MapDisplay({ destination, routePolyline }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInstance = useMap(); // Hook to get map instance

  const [decodedPath, setDecodedPath] = useState<google.maps.LatLngLiteral[] | null>(null);

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
            setError(`Could not find coordinates for ${destination}.`);
            setPosition(null); // Explicitly set to null on error
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error("Geocoding error:", err);
          setError("Error finding location.");
          setPosition(null);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
       if (isMounted) {
        setLoading(false);
        setPosition(null); // Clear position if destination is cleared
       }
    }
    return () => { isMounted = false; }
  }, [destination, apiKey]);

  useEffect(() => {
    if (mapInstance && routePolyline) {
      try {
        // Ensure google.maps.geometry is available
        if (window.google && window.google.maps && window.google.maps.geometry && window.google.maps.geometry.encoding) {
          const path = window.google.maps.geometry.encoding.decodePath(routePolyline);
          setDecodedPath(path);

          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(point => bounds.extend(point));
          mapInstance.fitBounds(bounds);
        } else {
          console.warn("Google Maps Geometry library not loaded yet for polyline decoding.");
          setDecodedPath(null); // Clear path if geometry lib not ready
        }
      } catch (e) {
        console.error("Error decoding or fitting polyline:", e);
        setDecodedPath(null);
      }
    } else if (!routePolyline) {
      setDecodedPath(null); // Clear path if routePolyline is null
      // Optionally, re-center on the main destination if no route
      if (mapInstance && position) {
        mapInstance.setCenter(position);
        mapInstance.setZoom(10); // Reset zoom
      }
    }
  }, [routePolyline, mapInstance, position]);


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

        {/* 
          Ensure APIProvider wraps the Map component. 
          If MapDisplay is used outside of a context where APIProvider is already present at a higher level,
          it might need its own APIProvider. For this app structure, HomePage handles the Provider.
        */}
        {apiKey && (position || decodedPath) && !loading && (
          <div className="h-[400px] w-full rounded-md overflow-hidden">
            {/* APIProvider is in HomePage, so we don't need it here again if MapDisplay is always child of HomePage content */}
            <Map
              center={position || undefined} // Center on main destination initially or if no route
              zoom={position ? 10 : 5} // Default zoom, will be overridden by fitBounds
              mapId="wanderwise-map"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              // The map instance is obtained via useMap(), no need for onLoad here
            >
              {position && <AdvancedMarker position={position} title={destination} />}
              {decodedPath && (
                <Polyline
                  path={decodedPath}
                  strokeColor="#FF0000"
                  strokeOpacity={0.8}
                  strokeWeight={5}
                />
              )}
            </Map>
          </div>
        )}
         {!apiKey && !loading && !position && !decodedPath && !error && (
            <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-center">Map will appear here.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

// MapDisplayWrapper to provide its own APIProvider context if needed, or just use the one from HomePage
export function MapDisplayWrapper(props: MapDisplayProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey && !props.destination) { // If no API key and no destination, don't even try to render map parts
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
                    <MapIcon className="h-6 w-6" /> Interactive Map
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                        <p className="text-muted-foreground p-4 text-center">
                            { !apiKey && "Google Maps API key is not configured. Map functionality is limited."}
                            { !props.destination && "Please enter a destination to see the map."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    // If API key *is* present, APIProvider should be at a higher level (like HomePage)
    // If MapDisplay might be used in a context without a higher-level APIProvider,
    // then this component *would* need to wrap MapDisplay with APIProvider.
    // For current app structure, HomePage's APIProvider is sufficient.
    return <MapDisplay {...props} />;
}
