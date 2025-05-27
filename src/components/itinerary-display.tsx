"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, FileDown, Clock, DollarSignIcon } from "lucide-react";
import React, { useRef } from 'react';

interface ItineraryDisplayProps {
  itinerary: string;
  destination: string;
  onExportPDF: (element: HTMLElement | null) => void;
}

// Helper function to parse itinerary string into days
const parseItinerary = (itineraryString: string) => {
  const dayRegex = /Day\s*\d+:/gi;
  let days = [];
  let lastIndex = 0;
  let match;

  while ((match = dayRegex.exec(itineraryString)) !== null) {
    if (lastIndex > 0 && match.index > lastIndex) {
      // This means there was content before the first "Day X:" or between days
      const title = itineraryString.substring(lastIndex, match.index).trim();
      if (days.length > 0) {
         days[days.length-1].content += "\n" + title;
      }
    }
    if (days.length > 0) {
       days[days.length-1].content = itineraryString.substring(days[days.length-1].startIndex, match.index).replace(days[days.length-1].title, '').trim();
    }
    days.push({ title: match[0], content: "", startIndex: match.index + match[0].length });
    lastIndex = match.index + match[0].length;
  }
  
  if (days.length > 0) {
     days[days.length-1].content = itineraryString.substring(days[days.length-1].startIndex).trim();
  } else if (itineraryString) {
    // Handle case where itinerary doesn't start with "Day X:"
    days.push({ title: "Trip Overview", content: itineraryString.trim(), startIndex: 0 });
  }
  
  return days.filter(day => day.content.trim() !== "");
};


export function ItineraryDisplay({ itinerary, destination, onExportPDF }: ItineraryDisplayProps) {
  const itineraryContentRef = useRef<HTMLDivElement>(null);
  const parsedDays = parseItinerary(itinerary);

  const enhanceContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.toLowerCase().includes('travel time:')) {
        return <p key={index} className="flex items-center gap-1 text-sm text-muted-foreground"><Clock size={14} /> {line}</p>;
      }
      if (line.toLowerCase().includes('estimated cost:') || line.toLowerCase().includes('budget:')) {
        return <p key={index} className="flex items-center gap-1 text-sm text-green-600 font-medium"><DollarSignIcon size={14} /> {line}</p>;
      }
      if (line.match(/^\s*-\s/) || line.match(/^\s*\*\s/)) {
        return <li key={index} className="ml-4 list-disc text-base">{line.replace(/^\s*[-\*]\s*/, '')}</li>;
      }
      if (line.trim().length === 0) {
        return <br key={index} />;
      }
      return <p key={index} className="text-base mb-1">{line}</p>;
    });
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
        {parsedDays.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={parsedDays[0].title} className="w-full">
            {parsedDays.map((day, index) => (
              <AccordionItem value={day.title} key={index}>
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  {day.title}
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="space-y-2 p-2 bg-muted/30 rounded-md">
                     {enhanceContent(day.content)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground">Your itinerary details will appear here once generated.</p>
        )}
      </CardContent>
    </Card>
  );
}
