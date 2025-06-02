
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, MapPin, Sparkles, Loader2, Briefcase } from "lucide-react";

const formSchema = z.object({
  destination: z.string().min(2, {
    message: "Destination must be at least 2 characters.",
  }),
  budget: z.coerce.number().positive({
    message: "Budget must be a positive number.",
  }),
  interests: z.string().min(3, {
    message: "Interests must be at least 3 characters.",
  }),
});

export type ItineraryFormValues = z.infer<typeof formSchema>;

interface ItineraryFormProps {
  onSubmit: (values: ItineraryFormValues) => void;
  loading: boolean;
}

export function ItineraryForm({ onSubmit, loading }: ItineraryFormProps) {
  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      budget: 1000,
      interests: "",
    },
  });

  return (
    <Card className="shadow-2xl bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="border-b border-primary/10 pb-4">
        <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-accent animate-pulse" />
          Plan Your Dream Trip
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">Tell us about your adventure, and we'll craft the magic!</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold text-foreground/90">
                    <MapPin className="h-5 w-5 text-primary" /> Destination
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kyoto, Japan" {...field} className="text-sm py-5 bg-background border-border focus:border-primary focus:ring-primary/50 shadow-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold text-foreground/90">
                    <DollarSign className="h-5 w-5 text-primary" /> Budget (USD)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2000" {...field} className="text-sm py-5 bg-background border-border focus:border-primary focus:ring-primary/50 shadow-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold text-foreground/90">
                    <Briefcase className="h-5 w-5 text-primary" /> Interests & Activities
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., temples, ramen tasting, bullet train, traditional markets"
                      {...field}
                      className="text-sm min-h-[120px] bg-background border-border focus:border-primary focus:ring-primary/50 shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full text-lg py-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Crafting Your Plan...
                </>
              ) : (
                "Create My Itinerary"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
