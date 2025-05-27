
"use client";

import type { PackingListItem } from "@/ai/flows/generate-packing-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, ShoppingCart, ImageOff, Box } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PackingListDisplayProps {
  packingListItems: PackingListItem[];
}

const placeholderImageBase = "https://placehold.co/100x100.png";

export function PackingListDisplay({ packingListItems }: PackingListDisplayProps) {
  if (!packingListItems || packingListItems.length === 0) {
    return (
      <Card className="shadow-xl mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <ListChecks className="h-6 w-6" /> Smart Packing List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No packing list items generated for this trip.</p>
        </CardContent>
      </Card>
    );
  }

  const categorizedItems = packingListItems.reduce<Record<string, PackingListItem[]>>((acc, item) => {
    const category = item.category || "Miscellaneous";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <Card className="shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
          <ListChecks className="h-6 w-6" /> Smart Packing List
        </CardTitle>
        <CardDescription>Here's a suggested list of items to pack for your trip.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categorizedItems).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-accent mb-3 border-b pb-1 flex items-center gap-2">
              <Box size={20}/> {category}
            </h3>
            <ul className="space-y-3">
              {items.map((item, index) => (
                <li key={`${category}-${index}-${item.name}`} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0 border">
                    <Image
                      src={placeholderImageBase} // Generic placeholder
                      alt={`Placeholder for ${item.name}`}
                      fill
                      sizes="64px"
                      className="object-contain p-1" // Use contain to show the whole placeholder
                      data-ai-hint={item.imageKeywords || "item object"}
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{item.name}</h4>
                    {item.quantity && <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>}
                    {item.notes && <p className="text-xs text-muted-foreground italic mt-0.5">Note: {item.notes}</p>}
                  </div>
                  {item.amazonSearchQuery && (
                    <Link
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(item.amazonSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex-shrink-0"
                      title={`Search for ${item.name} on Amazon`}
                    >
                      <button className="p-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors">
                        <ShoppingCart size={18} />
                      </button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
         <p className="text-xs text-muted-foreground mt-6 text-center">
            This packing list is AI-generated. Always double-check against your specific needs and travel regulations. Links to Amazon are for convenience.
        </p>
      </CardContent>
    </Card>
  );
}
