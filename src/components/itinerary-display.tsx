
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, FileDown, Clock, DollarSignIcon, ListChecks, Tag, StickyNote, Briefcase, MapPin } from "lucide-react";
import React, { useRef } from 'react';
import type { DayItinerary, Activity } from "@/ai/flows/generate-itinerary"; // Import structured types

interface ItineraryDisplayProps {
  itinerary: DayItinerary[]; // Expecting an array of structured DayItinerary objects
  destination: string;
  onExportPDF: (element: HTMLElement | null) => void;
}

export function ItineraryDisplay({ itinerary, destination, onExportPDF }: ItineraryDisplayProps) {
  const itineraryContentRef = useRef<HTMLDivElement>(null);

  const renderActivity = (activity: Activity, activityIndex: number) => (
    <div key={activityIndex} className="mb-3 p-3 border-l-2 border-accent/50 bg-background rounded-r-md shadow-sm">
      {activity.time && <p className="text-sm font-semibold text-primary flex items-center gap-1"><Clock size={14} /> {activity.time}</p>}
      <p className="my-1">{activity.description}</p>
      <div className="text-xs text-muted-foreground space-y-0.5">
        {activity.duration && <p><Briefcase size={12} className="inline mr-1" /> Duration: {activity.duration}</p>}
        {activity.cost && <p><DollarSignIcon size={12} className="inline mr-1 text-green-600" /> Cost: {activity.cost}</p>}
        {activity.notes && <p><StickyNote size={12} className="inline mr-1" /> Notes: {activity.notes}</p>}
      </div>
    </div>
  );

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
            
            {dayData.activities && dayData.activities.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-2 text-primary/80 flex items-center gap-1"><ListChecks size={18}/> Activities:</h4>
                {dayData.activities.map(renderActivity)}
              </div>
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
          <p className="text-muted-foreground py-4 text-center">Your detailed itinerary will appear here once generated. If you've already generated a plan and see this, the AI might not have been able to create a detailed schedule for your request.</p>
        )}
      </CardContent>
    </Card>
  );
}
