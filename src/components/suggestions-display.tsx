
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SuggestPlacesOutput, PlaceSuggestion } from "@/ai/flows/suggest-places";
import { Hotel, Utensils, FerrisWheel, Lightbulb, ImageOff, Building, Soup, MountainSnow } from "lucide-react";
import Image from "next/image";

interface SuggestionsDisplayProps {
  suggestions: SuggestPlacesOutput;
}

const placeholderImage = "https://placehold.co/300x200.png";

const dataAiHints = {
  hotels: "modern hotel exterior",
  restaurants: "gourmet dish presentation",
  activities: "scenic travel landmark",
}

export function SuggestionsDisplay({ suggestions }: SuggestionsDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const renderSuggestionList = (items: PlaceSuggestion[], type: keyof typeof dataAiHints) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-center py-8 text-lg">No {type} suggestions available yet. Try broadening your search!</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 pt-6">
        {items.map((item, index) => {
          const imageUrl = item.photoReference && apiKey
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${item.photoReference}&key=${apiKey}`
            : placeholderImage;
          
          const altText = item.description ? `${item.name} - ${item.description}` : item.name;

          return (
            <Card key={`${type}-${index}-${item.name}`} className="overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col bg-card/90 backdrop-blur-sm border-border hover:border-primary/50">
              <div className="relative w-full h-48 bg-muted/70">
                <Image
                  src={imageUrl}
                  alt={altText}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint={item.photoReference ? undefined : dataAiHints[type]} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== placeholderImage) {
                      target.src = placeholderImage;
                      if(target.dataset) target.dataset.aiHint = dataAiHints[type];
                    }
                  }}
                />
                {!item.photoReference && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 text-center rounded-t-xl">
                        <ImageOff size={36} className="text-white/60 mb-1"/>
                        <p className="text-xs text-white/70">
                            {apiKey ? "Image not found" : "API key needed for images"}
                        </p>
                    </div>
                )}
              </div>
              <CardContent className="p-5 flex-grow">
                <h3 className="font-bold text-lg leading-tight text-primary group-hover:text-accent transition-colors">{item.name}</h3>
                {item.description && <p className="text-sm text-muted-foreground mt-1.5">{item.description}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-2xl bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="border-b border-primary/10 pb-4">
        <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <Lightbulb className="h-7 w-7 text-accent animate-pulse" /> AI-Powered Suggestions
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">Explore recommendations tailored to your trip!</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="hotels" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-primary/5 p-1 h-auto rounded-lg shadow-inner">
            <TabsTrigger value="hotels" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
              <Building className="mr-2 h-5 w-5" /> Hotels
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
              <Soup className="mr-2 h-5 w-5" /> Restaurants
            </TabsTrigger>
            <TabsTrigger value="activities" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
              <MountainSnow className="mr-2 h-5 w-5" /> Activities
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
            <p className="text-xs text-muted-foreground text-center mt-4 italic">
                Note: Real place images require NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Placeholders are shown.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
