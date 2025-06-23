
"use client";

import { Wand2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      isScrolled ? "bg-card shadow-lg border-b" : "bg-transparent border-b border-transparent"
    )}>
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold hover:opacity-90 transition-opacity">
          <Wand2 size={32} className="text-primary transform group-hover:rotate-12 transition-transform duration-300" />
          <span className={cn("drop-shadow-sm", isScrolled ? "text-foreground" : "text-white")}>WanderWise</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
