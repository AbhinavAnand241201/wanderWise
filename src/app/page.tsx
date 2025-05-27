"use client";

import { useState, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { ItineraryForm, type ItineraryFormValues } from "@/components/itinerary-form";
import { ItineraryDisplay } from "@/components/itinerary-display";
import { SuggestionsDisplay } from "@/components/suggestions-display";
import { WeatherDisplay } from "@/components/weather-display";
import { MapDisplay } from "@/components/map-display";
import { generateItinerary, type GenerateItineraryOutput } from "@/ai/flows/generate-itinerary";
import { suggestPlaces, type SuggestPlacesOutput } from "@/ai/flows/suggest-places";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [formData, setFormData] = useState<ItineraryFormValues | null>(null);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestPlacesOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePlan = async (values: ItineraryFormValues) => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    setSuggestions(null);
    setFormData(values);

    try {
      const itineraryPromise = generateItinerary({
        destination: values.destination,
        budget: values.budget,
        interests: values.interests,
      });

      const budgetString = `$${values.budget}`;
      const suggestionsPromise = suggestPlaces({
        destination: values.destination,
        budget: budgetString,
        interests: values.interests,
      });

      const [itineraryResult, suggestionsResult] = await Promise.all([
        itineraryPromise,
        suggestionsPromise,
      ]);
      
      if (itineraryResult.itinerary) {
        setItinerary(itineraryResult.itinerary);
      } else {
        throw new Error("Failed to generate itinerary content.");
      }
      
      setSuggestions(suggestionsResult);

      toast({
        title: "Plan Generated!",
        description: "Your personalized trip plan is ready.",
        variant: "default",
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate plan: ${errorMessage}`);
      toast({
        title: "Error Generating Plan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (element: HTMLElement | null) => {
    if (!element) {
      toast({ title: "Error", description: "Could not find content to export.", variant: "destructive" });
      return;
    }

    toast({ title: "Generating PDF...", description: "Please wait a moment." });

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Improves quality
        useCORS: true, // For images from other domains if any
        logging: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      // const imgY = (pdfHeight - imgHeight * ratio) / 2; // center vertically
      const imgY = 0; // align top

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`WanderWise_Itinerary_${formData?.destination || 'Trip'}.pdf`);
      toast({ title: "PDF Exported!", description: "Your itinerary has been saved as a PDF." });
    } catch (e) {
      console.error("Error generating PDF:", e);
      toast({ title: "PDF Export Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Form & Suggestions */}
          <div className="lg:col-span-1 space-y-8">
            <ItineraryForm onSubmit={handleGeneratePlan} loading={loading} />
            {loading && !suggestions && (
              <Card className="shadow-xl">
                <CardHeader><CardTitle>Loading Suggestions...</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            )}
            {suggestions && !loading && <SuggestionsDisplay suggestions={suggestions} />}
          </div>

          {/* Column 2: Itinerary, Map, Weather */}
          <div className="lg:col-span-2 space-y-8">
            {error && (
              <Alert variant="destructive" className="shadow-md">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Oops! Something went wrong.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {loading && !itinerary && (
              <Card className="shadow-xl">
                <CardHeader><CardTitle>Generating Your Itinerary...</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            )}

            {itinerary && !loading && formData && (
              <ItineraryDisplay 
                itinerary={itinerary} 
                destination={formData.destination} 
                onExportPDF={handleExportPDF} 
              />
            )}
            
            {!loading && !itinerary && !error && !formData && (
                 <Card className="shadow-xl bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-xl text-primary">Welcome to WanderWise!</CardTitle>
                        <CardDescription>Fill out the form to start planning your next adventure. Our AI will craft a personalized itinerary just for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Let's make your travel dreams a reality!</p>
                    </CardContent>
                </Card>
            )}

            {formData && (itinerary || loading) && (
              <>
                {loading && !itinerary && ( // Show skeleton for map/weather while itinerary is primary loading focus
                  <>
                    <Skeleton className="h-[300px] w-full shadow-xl" />
                    <Skeleton className="h-[150px] w-full shadow-xl" />
                  </>
                )}
                {!loading && itinerary && ( // Show map/weather once itinerary is loaded
                  <>
                    <MapDisplay destination={formData.destination} />
                    <WeatherDisplay location={formData.destination} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border mt-8">
        © {new Date().getFullYear()} WanderWise. Adventure Awaits!
      </footer>
    </div>
  );
}
