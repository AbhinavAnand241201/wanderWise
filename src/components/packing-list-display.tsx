
"use client";

import type { PackingListItem } from "@/ai/flows/generate-packing-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ShoppingCart, Package, AlertTriangle } from "lucide-react";
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
      <Card className="shadow-xl mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <ListChecks className="h-6 w-6" /> Smart Packing List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No packing list items generated for this trip yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <Icons.Package size={24} className="text-primary" />;
    const IconComponent = (Icons as any)[iconName] || Icons.Package;
    try {
      return <IconComponent size={24} className="text-primary flex-shrink-0" />;
    } catch (e) {
      console.warn(`Lucide icon "${iconName}" not found, using default. Error:`, e);
      return <Icons.Package size={24} className="text-primary" />;
    }
  };

  return (
    <Card className="shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
          <ListChecks className="h-6 w-6" /> Essential Packing List
        </CardTitle>
        <CardDescription className="text-lg font-semibold text-accent">
          Planning to visit {destination} without these items... bad ideaaaa!!!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {packingListItems.map((item, index) => (
            <li 
              key={`${index}-${item.name}`} 
              className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mt-1">
                {renderIcon(item.lucideIconName)}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-base">{item.name}</h4>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
              </div>
              {item.amazonSearchQuery && (
                <Button asChild variant="outline" size="sm" className="ml-auto flex-shrink-0">
                  <Link
                    href={`${amazonBaseUrl}&k=${encodeURIComponent(item.amazonSearchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Shop for ${item.name} on Amazon.in`}
                    className="flex items-center gap-1"
                  >
                    <ShoppingCart size={16} /> Shop
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
         <p className="text-xs text-muted-foreground mt-6 text-center">
            This packing list is AI-generated. Always double-check your specific needs. Links to Amazon.in are for convenience.
        </p>
      </CardContent>
    </Card>
  );
}

    