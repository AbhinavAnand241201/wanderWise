
"use client";

import { useState, useRef, useEffect } from "react"; // Added useEffect
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
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from "@/components/ui/skeleton";
import type { GetWeatherAndAirQualityOutput } from "@/ai/flows/get-weather-and-air-quality"; // For weather summary

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

  // Callback to receive weather data from WeatherDisplay, to be used for packing list
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
    setWeatherDataForPacking(null); // Reset weather data for packing
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
        console.warn("Itinerary generated successfully but is empty or invalid:", itineraryResult);
        setItinerary([]);
        toast({
          title: "Itinerary Note",
          description: "The AI couldn't create a detailed schedule. Try adjusting your inputs.",
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
        title: "Plan Generated!",
        description: "Your personalized trip plan is ready. Weather and packing list coming up next...",
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
      setLoading(false); // Main loading stops, packing list might start
    }
  };
  
  // Effect to generate packing list after itinerary and weather data are available
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && formData && weatherDataForPacking && !loading && !loadingPackingList && !packingList) {
      const generateAndSetPackingList = async () => {
        setLoadingPackingList(true);
        try {
          const numDays = itinerary.length;
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

          if (packingListResponse && packingListResponse.items) {
            setPackingList(packingListResponse.items);
            toast({
              title: "Packing List Ready!",
              description: "Your smart packing list has been generated.",
            });
          } else {
            console.warn("Packing list generated but is empty or invalid:", packingListResponse);
            setPackingList([]);
            toast({
              title: "Packing List Note",
              description: "The AI couldn't generate a packing list for this trip.",
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
          setPackingList([]); // Ensure it's cleared on error
        } finally {
          setLoadingPackingList(false);
        }
      };
      generateAndSetPackingList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, formData, weatherDataForPacking, loading]); // Dependencies for triggering packing list generation


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

      pdf.addImage(imgData, 'PNG', (pdfWidth - newImgWidth) / 2, 0, newImgWidth, newImgHeight);
      currentImgHeight -= pdfHeight;

      while (currentImgHeight > 0) {
        position -= pdfHeight;
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

  const handleRouteFetched = (polyline: string | null) => {
    setCurrentRoutePolyline(polyline);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
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
                onRouteFetched={handleRouteFetched}
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
                    <Skeleton className="h-[300px] w-full shadow-xl" /> {/* Map Placeholder Skeleton */}
                    {/* WeatherDisplay will show its own loading skeleton */}
                  </>
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

            {/* Packing List Section */}
            {loadingPackingList && formData && (
              <Card className="shadow-xl mt-8">
                <CardHeader><CardTitle>Generating Your Packing List...</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            )}
            {packingList && !loadingPackingList && formData && (
              <PackingListDisplay packingListItems={packingList} />
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
