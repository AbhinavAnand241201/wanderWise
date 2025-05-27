
// src/components/map-display.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapIcon } from "lucide-react"; // Correct import for MapIcon
import * as GoogleMaps from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

interface MapDisplayProps {
  destination: string;
  routePolyline?: string | null; // Encoded polyline for the route
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

function InnerMapDisplay({ destination, routePolyline }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInstance = GoogleMaps.useMap(); 

  const [decodedPath, setDecodedPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [currentMapPolyline, setCurrentMapPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (destination && apiKey && window.google && window.google.maps) {
      setLoading(true);
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: destination }, (results, status) => {
        if (!isMounted) return;
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          setPosition({ lat: loc.lat(), lng: loc.lng() });
          setError(null);
        } else {
          console.error(`Geocoding failed for ${destination}: ${status}`);
          setError(`Could not find coordinates for ${destination}. Status: ${status}`);
          setPosition(null);
        }
        setLoading(false);
      });
    } else if (!destination) {
        if (isMounted) {
            setPosition(null);
            setError(null);
            setLoading(false);
        }
    } else if (!apiKey) {
        if (isMounted) {
            setError("Geocoding requires an API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).");
            setLoading(false);
            setPosition(null);
        }
    } else { // window.google or window.google.maps not available yet
        if (isMounted) {
            // This case might indicate API script hasn't loaded, could retry or show specific message
            // For now, treat as loading or a setup issue
            // setError("Google Maps script not loaded yet.");
            setLoading(false); // Or true if we implement a retry
        }
    }
    return () => { isMounted = false; }
  }, [destination, apiKey]);

  useEffect(() => {
    if (routePolyline && window.google && window.google.maps && window.google.maps.geometry && window.google.maps.geometry.encoding) {
      try {
        const path = window.google.maps.geometry.encoding.decodePath(routePolyline);
        const literalPath = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
        setDecodedPath(literalPath); 
        
        if (mapInstance && path.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          literalPath.forEach(point => bounds.extend(point));
          mapInstance.fitBounds(bounds);
        }
      } catch (e) {
        console.error("Error decoding or fitting polyline:", e);
        setDecodedPath(null);
      }
    } else if (!routePolyline) {
      setDecodedPath(null);
      if (mapInstance && position) {
        mapInstance.setCenter(position);
        mapInstance.setZoom(10);
      }
    }
  }, [routePolyline, mapInstance, position]);

  useEffect(() => {
    if (!mapInstance) return;

    // Clear previous polyline if it exists
    if (currentMapPolyline) {
      currentMapPolyline.setMap(null);
    }

    if (decodedPath && decodedPath.length > 0 && window.google && window.google.maps) {
      const newPolyline = new window.google.maps.Polyline({
        path: decodedPath,
        strokeColor: "hsl(var(--primary))", 
        strokeOpacity: 0.9,
        strokeWeight: 6,
        clickable: false,
        draggable: false,
        editable: false,
        geodesic: true,
      });
      newPolyline.setMap(mapInstance);
      setCurrentMapPolyline(newPolyline);
    } else {
      setCurrentMapPolyline(null); // Ensure it's cleared if no path
    }
    
    // This cleanup function will be called when the dependencies (mapInstance, decodedPath) change,
    // or when the component unmounts. It should clean up the *current* polyline that was just drawn.
    // A more robust way for cleanup is to capture 'newPolyline' in the closure if one was created.
    // However, given `currentMapPolyline` is set, cleaning based on its state before this effect
    // re-runs (or on unmount) should be okay.
    return () => {
      // If newPolyline was created in this effect's run, it's now in currentMapPolyline.
      // So, this logic will clean up the polyline that this effect instance managed.
      if (currentMapPolyline) { 
        currentMapPolyline.setMap(null);
      }
    };
  }, [mapInstance, decodedPath]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
          <MapIcon className="h-6 w-6" /> {/* Correctly using MapIcon from lucide-react */}
          Interactive Map
        </CardTitle>
        <CardDescription>Visualize your destination{destination ? `: ${destination}` : ''}{routePolyline ? ' and route' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-muted-foreground">Loading map data...</p>}
        {error && <p className="text-destructive mb-2">{error}</p>}
        
        {(position || decodedPath) && !loading && (
          <div className="h-[400px] w-full rounded-md overflow-hidden border">
            <GoogleMaps.Map 
              center={position || undefined} 
              zoom={position && !decodedPath ? 10 : 5} 
              mapId="wanderwise-map"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              {position && <GoogleMaps.AdvancedMarker position={position} title={destination} />} 
            </GoogleMaps.Map>
          </div>
        )}
         {!loading && !position && !decodedPath && !error && (
            <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-center">Map will appear here once a destination is provided.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MapDisplayWrapper(props: MapDisplayProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
                        <MapIcon className="h-6 w-6" /> Interactive Map
                    </CardTitle>
                    {props.destination && <CardDescription>Visualize your destination: {props.destination}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md border">
                        <p className="text-muted-foreground p-4 text-center">
                            Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is not configured. <br/>
                            Map functionality is limited. Please add the API key to your .env file.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const libraries: ("geometry" | "places" | "marker")[] = ['geometry'];

    return (
        <GoogleMaps.APIProvider apiKey={apiKey} libraries={libraries}> 
            <InnerMapDisplay {...props} />
        </GoogleMaps.APIProvider>
    );
}
