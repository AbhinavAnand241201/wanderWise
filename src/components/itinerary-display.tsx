
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

interface StructuredDay {
  day?: number | string;
  title?: string;
  description?: string;
  content?: string; // General catch-all for main text
  activities?: string[] | string; // Could be an array of strings or a single multi-line string
  estimatedCost?: string;
  travelTime?: string;
  [key: string]: any; // Allow other properties from the AI
}

// Renamed original parseItinerary to use as a fallback for purely text-based itineraries
const parseTextAsFallback = (itineraryString: string): Array<{ title: string; content: string }> => {
  const dayRegex = /Day\s*\d+:/gi;
  let days: Array<{ title: string; content: string; startIndex?: number }> = [];
  let lastIndex = 0;
  let match;

  // This loop structure is from your original parseItinerary function
  while ((match = dayRegex.exec(itineraryString)) !== null) {
    if (days.length > 0 && days[days.length-1].startIndex !== undefined) {
       // Assign content to the *previous* day block
       days[days.length-1].content = itineraryString.substring(days[days.length-1].startIndex!, match.index)
                                        .replace(new RegExp(`^${days[days.length-1].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '') // Remove title from start of content
                                        .trim();
    } else if (lastIndex === 0 && match.index > 0) {
      // Content before the first "Day X:", treat as an introduction
      const introContent = itineraryString.substring(0, match.index).trim();
      if (introContent) {
        days.push({ title: "Trip Introduction", content: introContent });
      }
    }
    // Add new day entry
    days.push({ title: match[0], content: "", startIndex: match.index + match[0].length });
    lastIndex = match.index + match[0].length;
  }
  
  if (days.length > 0 && days[days.length-1].startIndex !== undefined) {
    // Assign content for the *last* day block
    days[days.length-1].content = itineraryString.substring(days[days.length-1].startIndex!)
                                   .replace(new RegExp(`^${days[days.length-1].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '')
                                   .trim();
  } else if (itineraryString && days.length === 0) { // No "Day X:" found at all
    days.push({ title: "Trip Overview", content: itineraryString.trim() });
  }
  
  return days.filter(day => day.content.trim() !== "");
};


export function ItineraryDisplay({ itinerary, destination, onExportPDF }: ItineraryDisplayProps) {
  const itineraryContentRef = useRef<HTMLDivElement>(null);

  const processItineraryString = (itineraryStr: string): Array<{ title: string; content: string }> => {
    try {
      const parsedJson = JSON.parse(itineraryStr);
      if (Array.isArray(parsedJson) && parsedJson.length > 0 && typeof parsedJson[0] === 'object') {
        // It's likely an array of structured day objects
        return parsedJson.map((item: StructuredDay, index: number) => {
          let dayTitle = item.title || (item.day ? `Day ${item.day}` : `Day ${index + 1}`);
          let dayContent = item.description || item.content || '';

          if (Array.isArray(item.activities)) {
            dayContent += (dayContent ? '\n\nActivities:\n' : 'Activities:\n') + item.activities.map(act => `- ${act}`).join('\n');
          } else if (typeof item.activities === 'string') {
            dayContent += (dayContent ? '\n\nActivities:\n' : 'Activities:\n') + item.activities;
          }
          
          // Append other properties if they exist and weren't covered
          const knownProps = ['day', 'title', 'description', 'content', 'activities', 'estimatedCost', 'travelTime'];
          for (const key in item) {
            if (!knownProps.includes(key) && item[key]) {
              dayContent += `\n${key.charAt(0).toUpperCase() + key.slice(1)}: ${item[key]}`;
            }
          }
          if (item.estimatedCost) dayContent += `\nEstimated Cost: ${item.estimatedCost}`;
          if (item.travelTime) dayContent += `\nTravel Time: ${item.travelTime}`;

          return { title: dayTitle, content: dayContent.trim() };
        });
      }
    } catch (e) {
      // Not JSON or not the expected array format, fall back to text parsing
    }
    // Fallback to original text parsing logic
    return parseTextAsFallback(itineraryStr);
  };

  const parsedDays = processItineraryString(itinerary);

  const enhanceContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.toLowerCase().includes('travel time:')) {
        return <p key={index} className="flex items-center gap-1 text-sm text-muted-foreground"><Clock size={14} /> {line}</p>;
      }
      if (line.toLowerCase().includes('estimated cost:') || line.toLowerCase().includes('budget:')) {
        return <p key={index} className="flex items-center gap-1 text-sm text-green-600 font-medium"><DollarSignIcon size={14} /> {line}</p>;
      }
      // Make headings (lines ending with ':') bold
      if (line.trim().endsWith(':') && line.length < 80) { // Heuristic for headings
        return <p key={index} className="text-base font-semibold mt-2 mb-1">{line}</p>;
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
          <Accordion type="single" collapsible defaultValue={parsedDays[0]?.title} className="w-full">
            {parsedDays.map((day, index) => (
              day.title && day.content ? (
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
              ) : null
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground">Your itinerary details will appear here once generated.</p>
        )}
      </CardContent>
    </Card>
  );
}

    