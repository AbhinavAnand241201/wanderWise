
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, FileDown, Clock, DollarSignIcon, ListChecks, Tag, StickyNote, Briefcase, MapPin, Route, Loader2, AlertTriangle, Info } from "lucide-react";
import React, { useRef, useState } from 'react';
import type { DayItinerary, Activity } from "@/ai/flows/generate-itinerary";
import { fetchAndSummarizeDirections } from "@/app/actions/directionsActions";

interface ItineraryDisplayProps {
  itinerary: DayItinerary[];
  destination: string;
  onExportPDF: (element: HTMLElement | null) => void;
  onRouteFetched: (polyline: string | null) => void; 
}

export function ItineraryDisplay({ itinerary, destination, onExportPDF, onRouteFetched }: ItineraryDisplayProps) {
  const itineraryContentRef = useRef<HTMLDivElement>(null);
  const [directionsLoading, setDirectionsLoading] = useState<Record<string, boolean>>({});
  const [directionsData, setDirectionsData] = useState<Record<string, { summary: string | null; error?: string }>>({});

  const handleGetDirections = async (originActivity: Activity, destinationActivity: Activity, key: string) => {
    if (!originActivity.address || !destinationActivity.address) {
      setDirectionsData(prev => ({ ...prev, [key]: { summary: null, error: "Origin or destination address missing for route calculation." }}));
      onRouteFetched(null);
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

    const currentActivityName = activity.description 
        ? (activity.description.length > 30 ? activity.description.substring(0,27) + '...' : activity.description) 
        : "Current Activity";
    const nextActivityNameDisplay = nextActivity?.description 
        ? (nextActivity.description.length > 25 ? nextActivity.description.substring(0,22) + '...' : nextActivity.description) 
        : "Next Stop";

    return (
      <div key={activityIndex} className="mb-4 p-4 border-l-4 border-accent bg-card rounded-r-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-start mb-2">
          <div>
            {activity.time && <p className="text-sm font-semibold text-primary flex items-center gap-1.5"><Clock size={16} /> {activity.time}</p>}
            <p className="my-1.5 text-lg font-semibold text-foreground/90">{activity.description || "Activity Description Missing"}</p>
          </div>
          {activity.address && <p className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 ml-2 text-right"><MapPin size={12}/> {activity.address}</p>}
        </div>
        <div className="text-sm text-muted-foreground space-y-1 mt-1">
          {activity.duration && <p className="flex items-center gap-1.5"><Briefcase size={14} className="text-primary/80" /> Duration: {activity.duration}</p>}
          {activity.cost && <p className="flex items-center gap-1.5"><DollarSignIcon size={14} className="text-green-600" /> Cost: {activity.cost}</p>}
          {activity.notes && <p className="flex items-start gap-1.5"><StickyNote size={14} className="text-primary/80 mt-0.5" /> Notes: <span className="italic">{activity.notes}</span></p>}
        </div>
        
        {activity.address && nextActivity && nextActivity.address && (
          <div className="mt-4 pt-3 border-t border-dashed border-border">
             <p className="text-sm text-muted-foreground mb-2">
              Travel from <strong>{currentActivityName}</strong> to <strong>{nextActivityNameDisplay}</strong>:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGetDirections(activity, nextActivity, directionsKey)}
              disabled={isLoadingDirections}
              className="text-sm font-semibold border-primary/50 text-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md"
            >
              {isLoadingDirections ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Route className="mr-2 h-4 w-4" />
              )}
              Show Route to {nextActivityNameDisplay}
            </Button>
            {currentDirections && (
              <div className="mt-3 text-sm p-3 rounded-md bg-muted/80 border border-border shadow-inner">
                {currentDirections.summary && <p className="font-medium text-foreground/90">Route Summary: {currentDirections.summary}</p>}
                {currentDirections.error && <p className="text-destructive flex items-center gap-1.5"><AlertTriangle size={16}/> {currentDirections.error}</p>}
                {currentDirections.summary && !currentDirections.error && 
                  <p className="text-primary/90 mt-1.5 font-semibold flex items-center gap-1.5">
                    <Info size={16}/> Check the map for the visual route!
                  </p>
                }
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
      <AccordionItem value={dayTitle || `day-${dayIndex}`} key={dayIndex} className="border-b-2 border-primary/10 last:border-b-0">
        <AccordionTrigger className="text-xl font-bold hover:text-primary transition-colors py-5 px-2 text-foreground/90 rounded-t-md hover:bg-primary/5">
          <span className="flex items-center gap-2">
            <Tag size={22} className="text-accent"/> 
            {dayTitle} 
          </span>
          {dayData.theme && <span className="text-base text-muted-foreground ml-3 font-normal">- {dayData.theme}</span>}
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none dark:prose-invert bg-background/30 rounded-b-md">
          <div className="space-y-4 p-4 ">
            {dayData.summary && (
              <p className="italic text-muted-foreground mb-4 border-b border-dashed border-border pb-3 text-base">{dayData.summary}</p>
            )}
            
            {dayData.activities && dayData.activities.length > 0 ? (
              <div>
                <h4 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2"><ListChecks size={20}/> Activities Planned:</h4>
                {dayData.activities.map((activity, idx) => renderActivity(activity, idx, dayData.activities, dayIndex))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No activities listed for this day. Time for some spontaneous exploration!</p>
            )}

            {dayData.estimatedDayCost && (
              <p className="text-base font-medium flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-border">
                <DollarSignIcon size={18} className="text-green-600" /> Estimated Cost for Day: <span className="font-bold text-foreground/90">{dayData.estimatedDayCost}</span>
              </p>
            )}
            {dayData.travelNotes && (
              <p className="text-base text-muted-foreground flex items-start gap-2 mt-2">
                <MapPin size={18} className="text-primary/80 mt-0.5" /> Travel Notes: <span className="italic">{dayData.travelNotes}</span>
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card className="shadow-2xl bg-card/95 backdrop-blur-sm border-primary/20" ref={itineraryContentRef}>
      <CardHeader className="flex flex-row justify-between items-center border-b border-primary/10 pb-4 pt-5 px-6">
        <div>
          <CardTitle className="text-3xl font-extrabold text-primary flex items-center gap-2.5">
            <CalendarDays className="h-8 w-8 text-accent" /> Your Custom Itinerary
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1 text-base">Here's your AI-crafted adventure plan for {destination}.</CardDescription>
        </div>
        <Button onClick={() => onExportPDF(itineraryContentRef.current)} variant="outline" size="lg" className="font-semibold border-primary/50 text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-all">
          <FileDown className="mr-2 h-5 w-5" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {itinerary && itinerary.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={(typeof itinerary[0]?.day === 'number' ? `Day ${itinerary[0]?.day}` : itinerary[0]?.day) || `day-0`} className="w-full">
            {itinerary.map(renderDay)}
          </Accordion>
        ) : (
          <p className="text-muted-foreground py-6 text-center text-lg">Your detailed itinerary will appear here once generated. If you've already generated a plan and see this, the AI might not have been able to create a detailed schedule for your request.</p>
        )}
      </CardContent>
    </Card>
  );
}
