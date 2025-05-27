"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SuggestPlacesOutput } from "@/ai/flows/suggest-places";
import { Hotel, Utensils, FerrisWheel, Lightbulb } from "lucide-react";
import Image from "next/image";

interface SuggestionsDisplayProps {
  suggestions: SuggestPlacesOutput;
}

const placeholderImages = {
  hotels: "https://placehold.co/300x200.png",
  restaurants: "https://placehold.co/300x200.png",
  activities: "https://placehold.co/300x200.png",
};

const dataAiHints = {
  hotels: "hotel building",
  restaurants: "restaurant food",
  activities: "travel activity",
}

export function SuggestionsDisplay({ suggestions }: SuggestionsDisplayProps) {
  const renderSuggestionList = (items: string[], type: keyof typeof placeholderImages) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-center py-4">No {type} suggestions available yet.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pt-4">
        {items.map((item, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Image
              src={placeholderImages[type]}
              alt={item}
              width={300}
              height={200}
              className="w-full h-40 object-cover"
              data-ai-hint={dataAiHints[type]}
            />
            <CardContent className="p-4">
              <p className="font-semibold text-base">{item}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Lightbulb className="h-6 w-6" /> AI-Powered Suggestions
        </CardTitle>
        <CardDescription>Explore recommendations tailored to your preferences.</CardDescription>
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
      </CardContent>
    </Card>
  );
}
