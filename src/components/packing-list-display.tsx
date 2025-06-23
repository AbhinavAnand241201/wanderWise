
"use client";

import type { PackingListItem } from "@/ai/flows/generate-packing-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ShoppingCart } from "lucide-react";
import * as Icons from 'lucide-react';
import Link from "next/link";

interface PackingListDisplayProps {
  packingListItems: PackingListItem[];
  destination: string;
}

const amazonBaseUrl = "https://www.amazon.com/s?k=";

export function PackingListDisplay({ packingListItems, destination }: PackingListDisplayProps) {
  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <Icons.Package size={28} className="text-primary" />;
    const IconComponent = (Icons as any)[iconName] || Icons.Package;
    try {
      return <IconComponent size={28} className="text-primary flex-shrink-0 group-hover:text-accent transition-colors" />;
    } catch (e) {
      console.warn(`Lucide icon "${iconName}" not found. Using default. Error:`, e);
      return <Icons.Package size={28} className="text-primary flex-shrink-0" />;
    }
  };

  return (
    <Card className="bg-card border h-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <ListChecks className="h-7 w-7 text-primary" /> Don't Forget These Essentials!
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">
          A smart packing list for your trip to {destination}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {(!packingListItems || packingListItems.length === 0) ? (
            <p className="text-muted-foreground text-center py-8">No specific packing items were generated. Pack well!</p>
        ) : (
            <ul className="space-y-4">
            {packingListItems.map((item, index) => (
                <li 
                key={`${index}-${item.name}`} 
                className="group flex items-center gap-4 p-4 bg-background rounded-xl border transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg hover:border-primary/50"
                >
                <div className="p-2 bg-primary/10 rounded-full">
                    {renderIcon(item.lucideIconName)}
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground italic">{item.reason}</p>
                </div>
                {item.amazonSearchQuery && (
                    <Button asChild variant="ghost" size="sm" className="ml-auto flex-shrink-0">
                    <Link
                        href={`${amazonBaseUrl}${encodeURIComponent(item.amazonSearchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Shop for ${item.name} on Amazon`}
                        className="flex items-center gap-1.5 text-sm font-medium"
                    >
                        <ShoppingCart size={16} />
                    </Link>
                    </Button>
                )}
                </li>
            ))}
            </ul>
        )}
         <p className="text-xs text-muted-foreground/80 pt-4 text-center italic">
            This packing list is AI-generated. Links are for convenience.
        </p>
      </CardContent>
    </Card>
  );
}
