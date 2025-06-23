
"use client";

import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import CardStack from "@/components/card-stack";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, MapPin, Sparkles, Compass, Edit, ArrowRight, Loader2, FileDown, Plane, Map, Forward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from "@/components/ui/skeleton";
import type { GetWeatherAndAirQualityOutput } from "@/ai/flows/get-weather-and-air-quality";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();
  const plannerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleScrollToPlanner = () => {
    plannerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showResults) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showResults]);

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
        setItinerary([]); 
        toast({
          title: "Itinerary Note",
          description: "The AI couldn't create a detailed schedule. Try being more specific!",
          variant: "destructive",
        });
      }

      setSuggestions(suggestionsResult);
      setShowResults(true);
      
      toast({
        title: "Adventure Blueprint Ready!",
        description: "Your itinerary and suggestions are here. Explore your new plan below.",
      });
    } catch (err) {
      console.error("Error generating itinerary:", err);
      setError("Failed to generate itinerary. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
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
          }

          const packingListResponse = await generatePackingList({
            destination: formData.destination,
            numberOfDays: numDays,
            interests: formData.interests,
            weatherSummary: weatherSummary,
          });

          if (packingListResponse?.items) {
            setPackingList(packingListResponse.items);
          } else {
            setPackingList([]);
          }
        } catch (packingErr) {
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
  }, [itinerary, formData, weatherDataForPacking, loading, packingList, loadingPackingList, toast]);

  const itineraryContentRef = useRef<HTMLDivElement>(null);
  const handleExportPDF = async () => {
    const element = itineraryContentRef.current;
    if (!element) return;
    toast({ title: "Generating PDF..." });
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / pdfWidth;
    const scaledHeight = imgHeight / ratio;
    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }
    pdf.save(`WanderWise_Itinerary_${formData?.destination || 'Trip'}.pdf`);
    toast({ title: "PDF Exported!" });
  };

  const handleRouteFetched = (polyline: string | null) => {
    setCurrentRoutePolyline(polyline);
  };
  
  const handleEdit = () => {
    setShowResults(false);
    setItinerary(null);
    setSuggestions(null);
    setPackingList(null);
    setWeatherDataForPacking(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* CardStack component now handles the entire hero section */}
      <CardStack />
      
      {/* Scroll indicator */}
      <button 
        onClick={handleScrollToPlanner}
        className="group fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-bounce"
        aria-label="Scroll to planner"
      >
        <div className="flex h-12 w-8 flex-col items-center">
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
            Scroll
          </span>
          <div className="mt-1 h-4 w-4 rounded-full border-2 border-foreground/80 group-hover:border-foreground">
            <div className="mx-auto h-1 w-0.5 animate-bounce bg-foreground/80 group-hover:bg-foreground" />
          </div>
        </div>
      </button>
      <main className="flex-grow">
        {!showResults ? (
          <>
            <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center text-foreground bg-gradient-to-b from-background via-background to-card">
              <div className="relative container mx-auto px-4 z-10 animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Craft your perfect journey, powered by AI.</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">From custom itineraries to packing lists and local suggestions, WanderWise turns your travel dreams into a seamless reality. Tell us your destination, and let's begin the adventure.</p>
                <Button onClick={handleScrollToPlanner} size="lg" className="mt-8 text-lg font-bold">
                  Start Planning Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </section>
            
            <section className="py-20 bg-background text-foreground">
              <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold mb-12">How It Works</h2>
                 <div className="grid md:grid-cols-3 gap-12">
                   <div className="flex flex-col items-center">
                     <div className="bg-primary/10 p-5 rounded-full mb-4">
                       <MapPin className="h-10 w-10 text-primary" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2">1. Tell Us Your Trip</h3>
                     <p className="text-muted-foreground">Provide your destination, budget, and interests to start the planning process.</p>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="bg-primary/10 p-5 rounded-full mb-4">
                       <Sparkles className="h-10 w-10 text-primary" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2">2. Get Your AI Plan</h3>
                     <p className="text-muted-foreground">Instantly receive a detailed, day-by-day itinerary tailored just for you.</p>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="bg-primary/10 p-5 rounded-full mb-4">
                       <Compass className="h-10 w-10 text-primary" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2">3. Explore with Confidence</h3>
                     <p className="text-muted-foreground">Use our interactive map, local suggestions, and essential checklists.</p>
                   </div>
                 </div>
              </div>
            </section>

            <section ref={plannerRef} className="py-20 bg-card">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="mx-auto max-w-3xl rounded-2xl bg-background p-6 shadow-lg">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Plan Your Next Adventure</h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Let our AI create a personalized travel itinerary just for you
                  </p>
                </div>
                <ItineraryForm 
                  onSubmit={handleGeneratePlan} 
                  loading={loading}
                />
              </div>
            </div>
          </section>
          </>
        ) : (
          <div ref={resultsRef} className="container mx-auto p-4 md:p-6 lg:p-8 mt-8 animate-fade-in-up">
            {error && (
              <Alert variant="destructive" className="mb-8">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Oops! Something Went Wrong.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Summary Bar */}
            {formData && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-8 rounded-xl bg-card border">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                   <h2 className="text-2xl font-bold text-primary">{formData.destination}</h2>
                   <div className="flex items-center gap-4 text-muted-foreground">
                      <span>${formData.budget}</span>
                      <span className="hidden md:block">|</span>
                      <span className="truncate max-w-[200px]">{formData.interests}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportPDF} variant="outline" className="text-secondary border-secondary hover:bg-secondary/10 hover:text-secondary">
                        <FileDown className="h-4 w-4 mr-2" /> Export PDF
                    </Button>
                    <Button onClick={handleEdit} variant="outline">
                        <Edit className="h-4 w-4 mr-2" /> Edit Plan
                    </Button>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-1/3 rounded-lg" />
                <Skeleton className="h-60 w-full rounded-lg" />
              </div>
            ) : (
              <Tabs defaultValue="itinerary" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="itinerary"><Plane className="h-4 w-4 mr-2"/>Itinerary</TabsTrigger>
                  <TabsTrigger value="map-suggestions"><Map className="h-4 w-4 mr-2"/>Map & Suggestions</TabsTrigger>
                  <TabsTrigger value="trip-essentials"><Forward className="h-4 w-4 mr-2"/>Trip Essentials</TabsTrigger>
                </TabsList>
                
                <TabsContent value="itinerary">
                  {itinerary && formData && (
                     <div ref={itineraryContentRef}>
                        <ItineraryDisplay
                            itinerary={itinerary}
                            destination={formData.destination}
                            onRouteFetched={handleRouteFetched}
                        />
                     </div>
                  )}
                </TabsContent>
                <TabsContent value="map-suggestions">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <MapDisplayWrapper
                            destination={formData?.destination || ""}
                            routePolyline={currentRoutePolyline}
                        />
                        {suggestions && <SuggestionsDisplay suggestions={suggestions} />}
                    </div>
                </TabsContent>
                <TabsContent value="trip-essentials">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {loadingPackingList ? (
                           <Skeleton className="h-60 w-full rounded-lg" />
                        ) : (
                           packingList && formData && <PackingListDisplay packingListItems={packingList} destination={formData.destination} />
                        )}
                         <WeatherDisplay 
                            location={formData?.destination || ""} 
                            onWeatherDataFetched={handleWeatherDataFetched} 
                        />
                     </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </main>
      <footer className="text-center p-6 text-muted-foreground text-sm border-t mt-12 bg-card">
        <p>© {new Date().getFullYear()} WanderWise - Craft your perfect journey.</p>
         <p className="mt-1">Made with love and effort by Abhinav.</p>
        <p className="mt-1">
          <Link href="https://portfolio-latest-steel.vercel.app" target="_blank" rel="noopener noreferrer" className="text-primary/80 hover:text-primary underline transition-colors">
            see more of my work
          </Link>
        </p>
      </footer>
    </div>
  );
}

    