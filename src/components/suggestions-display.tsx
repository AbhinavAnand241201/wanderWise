
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SuggestPlacesOutput, PlaceSuggestion } from "@/ai/flows/suggest-places";
import { Hotel, Utensils, FerrisWheel, Lightbulb, ImageOff } from "lucide-react";
import Image from "next/image";

interface SuggestionsDisplayProps {
  suggestions: SuggestPlacesOutput;
}

const placeholderImage = "https://placehold.co/300x200.png";

const dataAiHints = {
  hotels: "hotel building",
  restaurants: "restaurant food",
  activities: "travel activity",
}

export function SuggestionsDisplay({ suggestions }: SuggestionsDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const renderSuggestionList = (items: PlaceSuggestion[], type: keyof typeof dataAiHints) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-center py-4">No {type} suggestions available yet.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pt-4">
        {items.map((item, index) => {
          const imageUrl = item.photoReference && apiKey
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photoReference}&key=${apiKey}`
            : placeholderImage;
          
          const altText = item.description ? `${item.name} - ${item.description}` : item.name;

          return (
            <Card key={`${type}-${index}-${item.name}`} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative w-full h-40 bg-muted">
                <Image
                  src={imageUrl}
                  alt={altText}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint={item.photoReference ? undefined : dataAiHints[type]} // Only add hint if placeholder
                  onError={(e) => {
                    // If Google Places image fails, fall back to placeholder
                    const target = e.target as HTMLImageElement;
                    if (target.src !== placeholderImage) {
                      target.src = placeholderImage;
                      if(target.dataset) target.dataset.aiHint = dataAiHints[type];
                    }
                  }}
                />
                {!item.photoReference && !apiKey && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-2 text-center">
                        <ImageOff size={32} className="text-white/70 mb-1"/>
                        <p className="text-xs text-white/80">
                            {apiKey ? "Image not found" : "API key needed for real images"}
                        </p>
                    </div>
                )}
              </div>
              <CardContent className="p-4 flex-grow">
                <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
                {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Lightbulb className="h-6 w-6" /> AI-Powered Suggestions
        </CardTitle>
        <CardDescription>Explore recommendations tailored to your preferences, now with images!</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hotels" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-primary/10">
            <TabsTrigger value="hotels" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Hotel className="mr-2 h-4 w-4" /> Hotels
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Utensils className="mr-2 h-4 w-4" /> Restaurants
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FerrisWheel className="mr-2 h-4 w-4" /> Activities
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hotels">
            {renderSuggestionList(suggestions.hotels, "hotels")}
          </TabsContent>
          <TabsContent value="restaurants">
            {renderSuggestionList(suggestions.restaurants, "restaurants")}
          </TabsContent>
          <TabsContent value="activities">
            {renderSuggestionList(suggestions.activities, "activities")}
          </TabsContent>
        </Tabs>
        {!apiKey && (
            <p className="text-xs text-muted-foreground text-center mt-4">
                Note: Real images require NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set in your .env file.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
