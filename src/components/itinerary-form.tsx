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
import { DollarSign, MapPin, Sparkles, Loader2 } from "lucide-react";

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
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Plan Your Dream Trip
        </CardTitle>
        <CardDescription>Tell us about your travel plans, and we'll craft the perfect itinerary!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-accent" /> Destination
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paris, France" {...field} className="text-base"/>
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
                  <FormLabel className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5 text-accent" /> Budget (USD)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1500" {...field} className="text-base"/>
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
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-accent" /> Interests
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., museums, hiking, local cuisine, history"
                      {...field}
                      className="text-base min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full text-lg py-6">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
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
