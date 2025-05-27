
"use client";

import type { PackingListItem } from "@/ai/flows/generate-packing-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ShoppingCart, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import * as Icons from 'lucide-react';
import Link from "next/link";

interface PackingListDisplayProps {
  packingListItems: PackingListItem[];
  destination: string;
}

const amazonBaseUrl = "https://www.amazon.in/?&tag=googhydrabk1-21&ref=pd_sl_481kbhct8q_e&adgrpid=155259814713&hvpone=&hvptwo=&hvadid=674893539977&hvpos=&hvnetw=g&hvrand=13194572512749415799&hvqmt=e&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9149733&hvtargid=kwd-12357690325&hydadcr=5619_2359467&gad_source=1";

export function PackingListDisplay({ packingListItems, destination }: PackingListDisplayProps) {
  if (!packingListItems || packingListItems.length === 0) {
    return (
      <Card className="shadow-2xl mt-8 bg-card/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="border-b border-primary/10 pb-4">
          <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <ListChecks className="h-7 w-7 text-accent" /> Smart Packing List
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-lg">No packing list items generated for this trip yet. Looks like you're traveling light!</p>
        </CardContent>
      </Card>
    );
  }

  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <Icons.Package size={28} className="text-primary" />;
    // Normalize icon name: Capitalize first letter, rest lower (common Lucide naming)
    const normalizedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1).toLowerCase();
    const IconComponent = (Icons as any)[normalizedIconName] || (Icons as any)[iconName] || Icons.Package;
    try {
      return <IconComponent size={28} className="text-primary flex-shrink-0 group-hover:text-accent transition-colors" />;
    } catch (e) {
      console.warn(`Lucide icon "${iconName}" (normalized: "${normalizedIconName}") not found, using default. Error:`, e);
      return <Icons.Package size={28} className="text-primary flex-shrink-0" />;
    }
  };

  return (
    <Card className="shadow-2xl mt-8 bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="border-b border-primary/10 pb-4">
        <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-accent animate-pulse" /> Essential Packing List
        </CardTitle>
        <CardDescription className="text-lg font-semibold text-accent/90 pt-1">
          Planning to visit <span className="font-bold text-accent">{destination}</span> without these items... bad ideaaaa!!!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <ul className="space-y-4">
          {packingListItems.map((item, index) => (
            <li 
              key={`${index}-${item.name}`} 
              className="group flex items-center gap-4 p-4 bg-muted/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:bg-muted/70 hover:border-accent/30 border border-transparent"
            >
              <div className="p-2 bg-primary/10 rounded-full group-hover:bg-accent/10 transition-colors">
                {renderIcon(item.lucideIconName)}
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-lg text-foreground/90">{item.name}</h4>
                <p className="text-sm text-muted-foreground italic">{item.reason}</p>
              </div>
              {item.amazonSearchQuery && (
                <Button asChild variant="ghost" size="sm" className="ml-auto flex-shrink-0 group-hover:bg-accent/90 group-hover:text-accent-foreground transition-colors rounded-lg px-3 py-1.5">
                  <Link
                    href={`${amazonBaseUrl}&k=${encodeURIComponent(item.amazonSearchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Shop for ${item.name} on Amazon.in`}
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <ShoppingCart size={18} /> Shop
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
         <p className="text-xs text-muted-foreground/80 pt-4 text-center italic">
            This packing list is AI-generated. Always double-check your specific needs. Links to Amazon.in are for convenience.
        </p>
      </CardContent>
    </Card>
  );
}
