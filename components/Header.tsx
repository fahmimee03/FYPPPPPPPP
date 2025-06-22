// app/components/Header.tsx
import Link from "next/link";
// Assuming button.tsx is in app/components/ui/ and your components.json + tsconfig are aligned
import { Button } from "./ui/button";
import { LayoutGrid, Mic } from "lucide-react";

export default function Header() { // <--- CRITICAL: Make sure it's 'export default function'
  return (
    <header className="bg-slate-100 dark:bg-slate-800 shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
          <Mic className="mr-2 h-7 w-7 text-blue-600" /> VoiceAssist
        </Link>
        <div>
          <Button variant="ghost" asChild>
            <Link href="/" className="mr-2">
              Assistant
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/report">
              <LayoutGrid className="mr-1 h-5 w-5" /> Reports
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}