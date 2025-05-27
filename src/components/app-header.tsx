import { Wand2 } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Wand2 size={28} />
          <span>WanderWise</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
