
// src/components/map-display.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapIcon } from "lucide-react";
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
  const [position, setPosition] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mapInstance = GoogleMaps.useMap();
  const geocodingLibrary = GoogleMaps.useMapsLibrary('geocoding'); // Use the hook

  const [decodedPath, setDecodedPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [currentMapPolyline, setCurrentMapPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!destination) {
      if (isMounted) {
        setPosition(null);
        setError(null);
        setLoading(false);
        if (currentMapPolyline) { // Clear polyline if destination is removed
            currentMapPolyline.setMap(null);
            setCurrentMapPolyline(null);
        }
        setDecodedPath(null);
      }
      return; // Early exit if no destination
    }

    setLoading(true); // Start loading when destination is present

    if (geocodingLibrary) {
      const geocoder = new geocodingLibrary.Geocoder();
      geocoder.geocode({ address: destination }, (results, status) => {
        if (!isMounted) return;
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          setPosition({ lat: loc.lat(), lng: loc.lng() });
          setError(null);
        } else {
          console.error(`Geocoding API Error for '${destination}': ${status}`, results);
          setError(`Geocoding failed for ${destination}. Status: ${status}. Possible API key issue or Geocoding API not enabled in GCP.`);
          setPosition(null);
        }
        setLoading(false);
      });
    } else {
      // geocodingLibrary is null from useMapsLibrary hook.
      // This implies the 'geocoding' library requested by APIProvider (or useMapsLibrary itself) is not available.
      if (isMounted) {
        console.warn("`useMapsLibrary('geocoding')` returned null. Ensure 'geocoding' is in APIProvider's libraries prop and the API key has Geocoding API enabled in Google Cloud Console.");
        setError("Geocoding service setup error. Check API key and ensure Geocoding API is enabled in Google Cloud Console.");
        setLoading(false); // Show the error
        setPosition(null);
      }
    }

    return () => { isMounted = false; };
  }, [destination, geocodingLibrary]); // Effect runs when destination or geocodingLibrary availability changes

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
      if (mapInstance && position) { // If no route, zoom to geocoded position
        mapInstance.setCenter(position);
        mapInstance.setZoom(10);
      } else if (mapInstance && !position && !error) { // No route, no position, no error -> default view
        mapInstance.setCenter({ lat: 0, lng: 0 }); // Or some other default
        mapInstance.setZoom(2);
      }
    }
  }, [routePolyline, mapInstance, position, error]); // Added error to dependencies

  useEffect(() => {
    if (!mapInstance) return;

    // Clear previous polyline if it exists
    if (currentMapPolyline) {
      currentMapPolyline.setMap(null);
      setCurrentMapPolyline(null); 
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
    }
    
    // Cleanup function to remove polyline when component unmounts or dependencies change
    return () => {
      if (currentMapPolyline) { 
        currentMapPolyline.setMap(null);
      }
    };
  }, [mapInstance, decodedPath]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent flex items-center gap-2">
          <MapIcon className="h-6 w-6" />
          Interactive Map
        </CardTitle>
        <CardDescription>Visualize your destination{destination ? `: ${destination}` : ''}{routePolyline ? ' and route' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-muted-foreground">Loading map data...</p>}
        {error && <p className="text-destructive mb-2">{error}</p>}
        
        {(!loading && (position || decodedPath)) && ( // Render map if not loading AND we have a position or a path to show
          <div className="h-[400px] w-full rounded-md overflow-hidden border">
            <GoogleMaps.Map 
              center={position || (decodedPath && decodedPath.length > 0 ? decodedPath[0] : undefined) || {lat: 0, lng: 0}} 
              zoom={position && !decodedPath ? 10 : (decodedPath ? 5 : 2) }
              mapId="wanderwise-map"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              {position && <GoogleMaps.AdvancedMarker position={position} title={destination} />}
              {/* Polyline is now drawn manually using useEffect */}
            </GoogleMaps.Map>
          </div>
        )}
         {!loading && !position && !decodedPath && !error && ( // No data, not loading, no error
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
    
    // 'geocoding' is included here to tell APIProvider to load it.
    // 'geometry' is needed for decoding polylines.
    const libraries: ("geometry" | "places" | "marker" | "geocoding" | "routes" | "visualization" | "drawing" | "localContext")[] = ['geometry', 'geocoding'];

    return (
        <GoogleMaps.APIProvider apiKey={apiKey} libraries={libraries}> 
            <InnerMapDisplay {...props} />
        </GoogleMaps.APIProvider>
    );
}
