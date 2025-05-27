
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, FileDown, Clock, DollarSignIcon, ListChecks, Tag, StickyNote, Briefcase, MapPin, Route, Loader2, AlertTriangle } from "lucide-react";
import React, { useRef, useState } from 'react';
import type { DayItinerary, Activity } from "@/ai/flows/generate-itinerary";
import { fetchAndSummarizeDirections } from "@/app/actions/directionsActions";

interface ItineraryDisplayProps {
  itinerary: DayItinerary[];
  destination: string;
  onExportPDF: (element: HTMLElement | null) => void;
  onRouteFetched: (polyline: string | null) => void; // Callback to pass polyline to HomePage
}

export function ItineraryDisplay({ itinerary, destination, onExportPDF, onRouteFetched }: ItineraryDisplayProps) {
  const itineraryContentRef = useRef<HTMLDivElement>(null);
  const [directionsLoading, setDirectionsLoading] = useState<Record<string, boolean>>({});
  const [directionsData, setDirectionsData] = useState<Record<string, { summary: string | null; error?: string }>>({});

  const handleGetDirections = async (originActivity: Activity, destinationActivity: Activity, key: string) => {
    if (!originActivity.address || !destinationActivity.address) {
      setDirectionsData(prev => ({ ...prev, [key]: { summary: null, error: "Origin or destination address missing." }}));
      return;
    }

    setDirectionsLoading(prev => ({ ...prev, [key]: true }));
    setDirectionsData(prev => ({ ...prev, [key]: { summary: null, error: undefined }}));
    onRouteFetched(null); 

    try {
      const result = await fetchAndSummarizeDirections({
        originAddress: originActivity.address,
        destinationAddress: destinationActivity.address,
      });

      setDirectionsData(prev => ({ ...prev, [key]: { summary: result.summary, error: result.error }}));
      if (result.overviewPolyline && !result.error) {
        onRouteFetched(result.overviewPolyline);
      } else {
        onRouteFetched(null);
      }
    } catch (error) {
      console.error("Failed to fetch directions:", error);
      const message = error instanceof Error ? error.message : "Unknown error fetching directions.";
      setDirectionsData(prev => ({ ...prev, [key]: { summary: null, error: message }}));
      onRouteFetched(null);
    } finally {
      setDirectionsLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderActivity = (activity: Activity, activityIndex: number, dayActivities: Activity[], dayIndex: number) => {
    const nextActivity = dayActivities[activityIndex + 1];
    const directionsKey = `d${dayIndex}-a${activityIndex}-a${activityIndex+1}`;
    const currentDirections = directionsData[directionsKey];
    const isLoadingDirections = directionsLoading[directionsKey];

    // Robust handling for activity names
    const currentActivityName = activity.description 
        ? (activity.description.length > 25 ? activity.description.substring(0,22) + '...' : activity.description) 
        : "Current Activity";
    const nextActivityNameDisplay = nextActivity?.description 
        ? (nextActivity.description.length > 20 ? nextActivity.description.substring(0,17) + '...' : nextActivity.description) 
        : "Next Stop";

    return (
      <div key={activityIndex} className="mb-3 p-3 border-l-2 border-accent/50 bg-background rounded-r-md shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            {activity.time && <p className="text-sm font-semibold text-primary flex items-center gap-1"><Clock size={14} /> {activity.time}</p>}
            <p className="my-1 font-medium">{activity.description || "Activity Description Missing"}</p>
          </div>
          {activity.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12}/> {activity.address}</p>}
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
          {activity.duration && <p><Briefcase size={12} className="inline mr-1" /> Duration: {activity.duration}</p>}
          {activity.cost && <p><DollarSignIcon size={12} className="inline mr-1 text-green-600" /> Cost: {activity.cost}</p>}
          {activity.notes && <p><StickyNote size={12} className="inline mr-1" /> Notes: {activity.notes}</p>}
        </div>
        
        {activity.address && nextActivity && nextActivity.address && (
          <div className="mt-3 pt-2 border-t border-dashed">
             <p className="text-xs text-muted-foreground mb-1">
              Travel from <strong>{currentActivityName}</strong> to <strong>{nextActivityNameDisplay}</strong>:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGetDirections(activity, nextActivity, directionsKey)}
              disabled={isLoadingDirections}
              className="text-xs"
            >
              {isLoadingDirections ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Route className="mr-2 h-3 w-3" />
              )}
              Show Route to {nextActivityNameDisplay}
            </Button>
            {currentDirections && (
              <div className="mt-2 text-xs p-2 rounded-md bg-muted/70">
                {currentDirections.summary && <p className="font-medium">Route Summary: {currentDirections.summary}</p>}
                {currentDirections.error && <p className="text-destructive flex items-center gap-1"><AlertTriangle size={14}/> {currentDirections.error}</p>}
                {currentDirections.summary && !currentDirections.error && <p className="text-primary/80 mt-1 font-semibold">Check the map for the visual route!</p>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const renderDay = (dayData: DayItinerary, dayIndex: number) => {
    const dayTitle = typeof dayData.day === 'number' ? `Day ${dayData.day}` : dayData.day;
    
    return (
      <AccordionItem value={dayTitle || `day-${dayIndex}`} key={dayIndex}>
        <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
          {dayTitle} {dayData.theme && <span className="text-sm text-muted-foreground ml-2 font-normal">- {dayData.theme}</span>}
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none dark:prose-invert">
          <div className="space-y-3 p-2 bg-muted/30 rounded-md">
            {dayData.summary && (
              <p className="italic text-muted-foreground mb-3 border-b pb-2">{dayData.summary}</p>
            )}
            
            {dayData.activities && dayData.activities.length > 0 ? (
              <div>
                <h4 className="text-md font-semibold mb-2 text-primary/80 flex items-center gap-1"><ListChecks size={18}/> Activities:</h4>
                {dayData.activities.map((activity, idx) => renderActivity(activity, idx, dayData.activities, dayIndex))}
              </div>
            ) : (
              <p className="text-muted-foreground py-2">No activities listed for this day.</p>
            )}

            {dayData.estimatedDayCost && (
              <p className="text-sm font-medium flex items-center gap-1 mt-3 pt-2 border-t">
                <DollarSignIcon size={16} className="text-green-700" /> Estimated Cost for Day: {dayData.estimatedDayCost}
              </p>
            )}
            {dayData.travelNotes && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin size={16} /> Travel Notes: {dayData.travelNotes}
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card className="shadow-xl" ref={itineraryContentRef}>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6" /> Your Custom Itinerary
          </CardTitle>
          <CardDescription>Here's your personalized plan for {destination}.</CardDescription>
        </div>
        <Button onClick={() => onExportPDF(itineraryContentRef.current)} variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent>
        {itinerary && itinerary.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={(typeof itinerary[0]?.day === 'number' ? `Day ${itinerary[0]?.day}` : itinerary[0]?.day) || `day-0`} className="w-full">
            {itinerary.map(renderDay)}
          </Accordion>
        ) : (
          <p className="text-muted-foreground py-4 text-center">Your detailed itinerary will appear here once generated. If you've already generated a plan and see this, the AI might not have been able to create a detailed schedule for your request, or there were no activities with addresses to show directions for.</p>
        )}
      </CardContent>
    </Card>
  );
}
