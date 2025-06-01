
import { Wand2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle'; // Added

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold hover:opacity-90 transition-opacity">
          <Wand2 size={32} className="transform group-hover:rotate-12 transition-transform duration-300" />
          <span className="drop-shadow-sm">WanderWise</span>
        </Link>
        <ThemeToggle /> {/* Added ThemeToggle button */}
      </div>
    </header>
  );
}
