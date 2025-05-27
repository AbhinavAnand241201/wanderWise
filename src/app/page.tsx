
"use client";

import { useState, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { ItineraryForm, type ItineraryFormValues } from "@/components/itinerary-form";
import { ItineraryDisplay } from "@/components/itinerary-display";
import { SuggestionsDisplay } from "@/components/suggestions-display";
import { WeatherDisplay } from "@/components/weather-display";
import { MapDisplay } from "@/components/map-display";
import { generateItinerary, type DayItinerary } from "@/ai/flows/generate-itinerary"; 
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
  const [itinerary, setItinerary] = useState<DayItinerary[] | null>(null); 
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

      const budgetString = `$${values.budget}`; // The suggestPlaces flow expects budget as a string
      const suggestionsPromise = suggestPlaces({
        destination: values.destination,
        budget: budgetString,
        interests: values.interests,
      });

      // Execute in parallel
      const [itineraryResult, suggestionsResult] = await Promise.all([
        itineraryPromise,
        suggestionsPromise,
      ]);
      
      // Process Itinerary
      if (itineraryResult.itinerary && itineraryResult.itinerary.length > 0) {
        setItinerary(itineraryResult.itinerary);
      } else {
        console.warn("Itinerary generated successfully but is empty or invalid:", itineraryResult);
        setItinerary([]); 
        toast({
          title: "Itinerary Note",
          description: "The AI couldn't create a detailed schedule. Try adjusting your inputs.",
          variant: "default",
        });
      }
      
      // Process Suggestions
      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      } else {
        console.warn("Suggestions were not generated or are invalid:", suggestionsResult);
        setSuggestions({ hotels: [], restaurants: [], activities: []}); // Ensure it's always an object
      }
      

      toast({
        title: "Plan Generated!",
        description: "Your personalized trip plan is ready.",
        variant: "default",
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during plan generation.";
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
        scale: 2, 
        useCORS: true, 
        logging: true,
        scrollX: 0, 
        scrollY: -window.scrollY, 
        windowWidth: element.scrollWidth, 
        windowHeight: element.scrollHeight, 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      let position = 0;
      let currentImgHeight = newImgHeight;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, 0, newImgWidth, newImgHeight);
      currentImgHeight -= pdfHeight;

      // Add subsequent pages if needed
      while (currentImgHeight > 0) {
        position -= pdfHeight; // This should be negative to move the image "up" on the new page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, position, newImgWidth, newImgHeight);
        currentImgHeight -= pdfHeight;
      }
      
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
            {/* Ensure suggestions is not null before rendering */}
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
                {(loading && (!itinerary || itinerary.length === 0)) && ( 
                  <>
                    <Skeleton className="h-[300px] w-full shadow-xl" />
                    <Skeleton className="h-[200px] w-full shadow-xl" /> {/* Adjusted skeleton height for weather */}
                  </>
                )}
                {/* Render MapDisplay and WeatherDisplay if formData exists, regardless of itinerary content,
                    as they depend on formData.destination primarily.
                    Show skeletons if loading and data isn't there yet.
                */}
                <MapDisplay destination={formData.destination} />
                <WeatherDisplay location={formData.destination} />
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
