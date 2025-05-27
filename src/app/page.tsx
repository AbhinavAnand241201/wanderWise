
"use client";

import { useState, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { ItineraryForm, type ItineraryFormValues } from "@/components/itinerary-form";
import { ItineraryDisplay } from "@/components/itinerary-display";
import { SuggestionsDisplay } from "@/components/suggestions-display";
import { WeatherDisplay } from "@/components/weather-display";
import { MapDisplay } from "@/components/map-display";
import { generateItinerary, type GenerateItineraryOutput, type DayItinerary } from "@/ai/flows/generate-itinerary"; // Updated import
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
  const [itinerary, setItinerary] = useState<DayItinerary[] | null>(null); // Changed type from string | null
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
      
      if (itineraryResult.itinerary && itineraryResult.itinerary.length > 0) {
        setItinerary(itineraryResult.itinerary);
      } else {
        // Handle cases where itinerary might be empty or not generated as expected
        // even if the flow itself doesn't throw an error.
        console.warn("Itinerary generated successfully but is empty or invalid:", itineraryResult);
        setItinerary([]); // Set to empty array to signify no itinerary items
        // Optionally, inform the user
        // toast({
        //   title: "Itinerary Generation Note",
        //   description: "The itinerary could not be fully generated for your request. Please try adjusting your inputs.",
        //   variant: "default",
        // });
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
        scale: 2, 
        useCORS: true, 
        logging: true,
        scrollX: 0, // Try to prevent horizontal scroll issues
        scrollY: -window.scrollY, // Capture from the top
        windowWidth: element.scrollWidth, // Capture full width
        windowHeight: element.scrollHeight, // Capture full height
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
      let heightLeft = newImgHeight;

      if (newImgHeight <= pdfHeight) { // If image fits on one page
        pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, 0, newImgWidth, newImgHeight);
      } else { // If image is taller than one page, paginate
         pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, position, newImgWidth, newImgHeight);
         heightLeft -= pdfHeight;
         while (heightLeft > 0) {
            position = heightLeft - newImgHeight; // negative
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, position, newImgWidth, newImgHeight);
            heightLeft -= pdfHeight;
         }
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
            
            {loading && !itinerary && ( // Show skeleton while loading and no itinerary data yet
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

            {itinerary && !loading && formData && ( // Itinerary data is available and not loading
              <ItineraryDisplay 
                itinerary={itinerary} 
                destination={formData.destination} 
                onExportPDF={handleExportPDF} 
              />
            )}
            
            {!loading && !itinerary && !error && !formData && ( // Initial state, no form submitted
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

            {formData && (itinerary || loading) && ( // Form has been submitted, show map/weather
              <>
                {(loading && (!itinerary || itinerary.length === 0)) && ( // Show skeleton for map/weather if itinerary is still primary loading focus OR itinerary came back empty
                  <>
                    <Skeleton className="h-[300px] w-full shadow-xl" />
                    <Skeleton className="h-[150px] w-full shadow-xl" />
                  </>
                )}
                {(!loading && itinerary && itinerary.length > 0) && ( // Show map/weather once itinerary is loaded and has content
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
