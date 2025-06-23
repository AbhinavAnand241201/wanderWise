
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SuggestPlacesOutput, PlaceSuggestion } from "@/ai/flows/suggest-places";
import { Building, Soup, MountainSnow, ImageOff } from "lucide-react";
import Image from "next/image";

interface SuggestionsDisplayProps {
  suggestions: SuggestPlacesOutput;
}

const placeholderImage = "https://placehold.co/400x300.png";

const dataAiHints = {
  hotels: "modern hotel exterior",
  restaurants: "gourmet dish presentation",
  activities: "scenic travel landmark",
}

export function SuggestionsDisplay({ suggestions }: SuggestionsDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const renderSuggestionList = (items: PlaceSuggestion[], type: keyof typeof dataAiHints) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-center py-12">No {type} suggestions available yet.</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {items.map((item, index) => {
          const imageUrl = item.photoReference && apiKey
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${item.photoReference}&key=${apiKey}`
            : placeholderImage;
          
          const altText = item.description ? `${item.name} - ${item.description}` : item.name;

          return (
            <Card key={`${type}-${index}-${item.name}`} className="overflow-hidden rounded-xl bg-background border group transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl hover:border-primary/50">
              <div className="relative w-full h-48">
                <Image
                  src={imageUrl}
                  alt={altText}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 text-center">
                        <ImageOff size={36} className="text-white/60 mb-1"/>
                        <p className="text-xs text-white/70">
                            {apiKey ? "Image not found" : "API key needed"}
                        </p>
                    </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                {item.description && <p className="text-sm text-muted-foreground mt-1.5">{item.description}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-card border h-full">
        <CardContent className="pt-6">
            <Tabs defaultValue="hotels" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-background p-1 h-auto rounded-lg">
                <TabsTrigger value="hotels" className="py-2.5 font-semibold">
                <Building className="mr-2 h-4 w-4" /> Hotels
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="py-2.5 font-semibold">
                <Soup className="mr-2 h-4 w-4" /> Restaurants
                </TabsTrigger>
                <TabsTrigger value="activities" className="py-2.5 font-semibold">
                <MountainSnow className="mr-2 h-4 w-4" /> Activities
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
        </CardContent>
    </Card>
  );
}
