
"use client";

import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { ItineraryForm, type ItineraryFormValues } from "@/components/itinerary-form";
import { ItineraryDisplay } from "@/components/itinerary-display";
import { SuggestionsDisplay } from "@/components/suggestions-display";
import { WeatherDisplay } from "@/components/weather-display";
import { MapDisplayWrapper } from "@/components/map-display";
import { generateItinerary, type DayItinerary } from "@/ai/flows/generate-itinerary";
import { suggestPlaces, type SuggestPlacesOutput } from "@/ai/flows/suggest-places";
import { generatePackingList, type PackingListItem } from "@/ai/flows/generate-packing-list";
import { PackingListDisplay } from "@/components/packing-list-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Info, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from "@/components/ui/skeleton";
import type { GetWeatherAndAirQualityOutput } from "@/ai/flows/get-weather-and-air-quality";
import Link from "next/link";

export default function HomePage() {
  const [formData, setFormData] = useState<ItineraryFormValues | null>(null);
  const [itinerary, setItinerary] = useState<DayItinerary[] | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestPlacesOutput | null>(null);
  const [weatherDataForPacking, setWeatherDataForPacking] = useState<GetWeatherAndAirQualityOutput | null>(null);
  const [currentRoutePolyline, setCurrentRoutePolyline] = useState<string | null>(null);
  const [packingList, setPackingList] = useState<PackingListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPackingList, setLoadingPackingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleWeatherDataFetched = (data: GetWeatherAndAirQualityOutput | null) => {
    setWeatherDataForPacking(data);
  };

  const handleGeneratePlan = async (values: ItineraryFormValues) => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    setSuggestions(null);
    setCurrentRoutePolyline(null);
    setPackingList(null);
    setWeatherDataForPacking(null); 
    setFormData(values);

    try {
      toast({
        title: "WanderWise AI is Thinking...",
        description: "Crafting your personalized adventure. This might take a moment!",
        variant: "default",
      });

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
        console.warn("Itinerary generated successfully but is empty or invalid:", itineraryResult);
        setItinerary([]); 
        toast({
          title: "Itinerary Note",
          description: "The AI couldn't create a detailed schedule. Try being more specific with your interests!",
          variant: "default",
        });
      }

      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      } else {
        console.warn("Suggestions were not generated or are invalid:", suggestionsResult);
        setSuggestions({ hotels: [], restaurants: [], activities: []});
      }
      
      toast({
        title: "Adventure Blueprint Ready!",
        description: "Your itinerary and suggestions are here. Fetching weather and packing list next...",
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
  
  useEffect(() => {
    if (formData && itinerary && weatherDataForPacking && !loading && !loadingPackingList && packingList === null) {
      const generateAndSetPackingList = async () => {
        setLoadingPackingList(true);
        try {
          const numDays = itinerary.length > 0 ? itinerary.length : 1; 
          let weatherSummary = `General weather for ${formData.destination}.`;
          if (weatherDataForPacking?.forecasts && weatherDataForPacking.forecasts.length > 0) {
            const todayForecast = weatherDataForPacking.forecasts[0];
            weatherSummary = `Expected weather: ${todayForecast.condition} with temperatures around ${todayForecast.minTempC}°C to ${todayForecast.maxTempC}°C.`;
            if (weatherDataForPacking.airQuality) {
              weatherSummary += ` Air quality is ${weatherDataForPacking.airQuality.category} (AQI: ${weatherDataForPacking.airQuality.aqi}).`;
            }
          } else if (weatherDataForPacking?.error) {
             weatherSummary += ` Weather data fetch had an error: ${weatherDataForPacking.error}. Pack generally.`;
          }

          const packingListResponse = await generatePackingList({
            destination: formData.destination,
            numberOfDays: numDays,
            interests: formData.interests,
            weatherSummary: weatherSummary,
          });

          if (packingListResponse && packingListResponse.items && packingListResponse.items.length > 0) {
            setPackingList(packingListResponse.items);
            toast({
              title: "Essential Packing List Ready!",
              description: "Your smart list of 5 must-have items is here.",
            });
          } else {
            console.warn("Packing list generated but is empty or invalid:", packingListResponse);
            setPackingList([]); 
            toast({
              title: "Packing List Note",
              description: "The AI couldn't generate a packing list for this trip. Showing defaults.",
            });
          }
        } catch (packingErr) {
          console.error("Error generating packing list:", packingErr);
          const packErrMsg = packingErr instanceof Error ? packingErr.message : "Could not generate packing list."
          toast({
            title: "Error Generating Packing List",
            description: packErrMsg,
            variant: "destructive",
          });
          setPackingList([]); 
        } finally {
          setLoadingPackingList(false);
        }
      };
      generateAndSetPackingList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, formData, weatherDataForPacking, loading]);


  const handleExportPDF = async (element: HTMLElement | null) => {
    if (!element) {
      toast({ title: "Error", description: "Could not find content to export.", variant: "destructive" });
      return;
    }

    toast({ title: "Generating PDF...", description: "Please wait, this can take a moment." });

    try {
      const accordions = element.querySelectorAll('div[data-state="closed"]');
      accordions.forEach(acc => (acc as HTMLElement).setAttribute('data-state', 'open'));
      
      // Ensure all images are loaded before capturing
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = img.onerror = resolve;
          });
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay for rendering complex elements

      const canvas = await html2canvas(element, {
        scale: 1.5, 
        useCORS: true,
        logging: true,
        scrollX: 0,
        scrollY: -window.scrollY, 
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        removeContainer: true, // Clean up container after capture
      });

      accordions.forEach(acc => (acc as HTMLElement).setAttribute('data-state', 'closed'));

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p', // portrait
        unit: 'pt', // points
        format: 'a4', // A4 page size
        putOnlyUsedFonts: true,
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const effectiveImgWidth = imgWidth * ratio;
      const effectiveImgHeight = imgHeight * ratio;
      
      const totalPages = Math.ceil(imgHeight / (pdfHeight/ratio) );

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        // Calculate Y offset for the current page's portion of the image
        const sourceY = i * (pdfHeight / ratio); // Y position in the source canvas
        
        pdf.addImage(
            imgData, 
            'PNG', 
            (pdfWidth - effectiveImgWidth) / 2, // Center the image horizontally
            0, // Start at the top of the PDF page
            effectiveImgWidth, 
            effectiveImgHeight,
            undefined, // alias
            'FAST', // compression
            0, // rotation
            0, // xOffset (in image) - not needed when using sourceY for cropping
            -sourceY // yOffset (in image) - negative to crop from top of image
        );
      }

      pdf.save(`WanderWise_Itinerary_${formData?.destination.replace(/[^a-zA-Z0-9]/g, '_') || 'Trip'}.pdf`);
      toast({ title: "PDF Exported!", description: "Your itinerary has been saved." });
    } catch (e) {
      console.error("Error generating PDF:", e);
      toast({ title: "PDF Export Failed", description: "An error occurred. The content might be too complex or an image failed to load.", variant: "destructive" });
    }
  };

  const handleRouteFetched = (polyline: string | null) => {
    setCurrentRoutePolyline(polyline);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30 font-sans selection:bg-accent selection:text-accent-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          <div className="lg:col-span-1 space-y-6 md:space-y-8 lg:sticky lg:top-24">
            <ItineraryForm onSubmit={handleGeneratePlan} loading={loading} />
            
            {loading && !suggestions && ( 
              <Card className="shadow-xl animate-pulse bg-card/80 backdrop-blur-sm">
                <CardHeader><Skeleton className="h-8 w-3/4 rounded-md bg-muted/70" /></CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Skeleton className="h-6 w-full rounded-md bg-muted/70" />
                  <Skeleton className="h-24 w-full rounded-lg bg-muted/70" />
                  <Skeleton className="h-24 w-full rounded-lg bg-muted/70" />
                </CardContent>
              </Card>
            )}
            {suggestions && !loading && <SuggestionsDisplay suggestions={suggestions} />}
          </div>

          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {error && (
              <Alert variant="destructive" className="shadow-xl border-destructive/70 bg-destructive/10 backdrop-blur-sm">
                <Terminal className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold">Oops! Something Went Wrong.</AlertTitle>
                <AlertDescription className="text-base">{error}</AlertDescription>
              </Alert>
            )}

            {loading && !itinerary && ( 
              <Card className="shadow-xl animate-pulse bg-card/80 backdrop-blur-sm">
                <CardHeader><Skeleton className="h-8 w-1/2 rounded-md bg-muted/70" /></CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-3/4 rounded-md bg-muted/70" />
                  <Skeleton className="h-5 w-full rounded-md bg-muted/70" />
                  <Skeleton className="h-5 w-5/6 rounded-md bg-muted/70" />
                  <Skeleton className="h-5 w-full rounded-md bg-muted/70" />
                </CardContent>
              </Card>
            )}

            {itinerary && !loading && formData && (
              <ItineraryDisplay
                itinerary={itinerary}
                destination={formData.destination}
                onExportPDF={handleExportPDF}
                onRouteFetched={handleRouteFetched}
              />
            )}

            {!loading && !itinerary && !error && !formData && (
                 <Card className="shadow-2xl bg-gradient-to-tr from-primary/90 via-primary to-accent/90 text-primary-foreground border-none transition-all hover:shadow-primary/40 hover:shadow-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-3xl font-extrabold flex items-center gap-2.5 drop-shadow-md">
                          <CalendarDays size={36} className="text-accent"/> Welcome to WanderWise!
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/90 text-lg pt-1.5">Your AI-powered journey planner. Fill the form to begin your adventure!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-primary-foreground/80 text-base">Let's turn your travel dreams into reality, one smart plan at a time.</p>
                    </CardContent>
                </Card>
            )}

            {formData && (itinerary || loading) && (
              <>
                {(loading && (!itinerary || itinerary.length === 0)) && (
                  <Skeleton className="h-[400px] w-full rounded-xl shadow-xl bg-muted/70" />
                )}
                <MapDisplayWrapper
                  destination={formData.destination}
                  routePolyline={currentRoutePolyline}
                />
                <WeatherDisplay 
                  location={formData.destination} 
                  onWeatherDataFetched={handleWeatherDataFetched} 
                />
              </>
            )}

            {loadingPackingList && formData && (
              <Card className="shadow-xl mt-8 animate-pulse bg-card/80 backdrop-blur-sm">
                <CardHeader><Skeleton className="h-8 w-3/4 rounded-md bg-muted/70" /></CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <Skeleton className="h-6 w-full rounded-md bg-muted/70" />
                    <Skeleton className="h-20 w-full rounded-lg bg-muted/70" />
                </CardContent>
              </Card>
            )}
            {packingList && !loadingPackingList && formData && (
              <PackingListDisplay packingListItems={packingList} destination={formData.destination} />
            )}
            {!loading && !loadingPackingList && packingList === null && itinerary && formData && (
                 <Card className="shadow-xl mt-8 bg-muted/50 backdrop-blur-sm">
                    <CardHeader><CardTitle className="text-primary/90">Preparing Your Packing List...</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Just a moment, curating essentials for your trip to {formData.destination}.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-6 text-muted-foreground/80 text-sm border-t border-border/50 mt-12 bg-background/50 backdrop-blur-sm">
        <p>© {new Date().getFullYear()} WanderWise where Adventure Awaits , Plan Smart!</p>
        <p className="mt-1">Made with love and effort by Abhinav.</p>
        <p className="mt-1">
          <Link href="https://portfolio-latest-steel.vercel.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent underline transition-colors">
            see more of my work
          </Link>
        </p>
      </footer>
    </div>
  );
}

    