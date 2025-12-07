import Link from "next/link";
import { Button } from "../components/ui/button";
import { UtensilsCrossed, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Icon Circle */}
      <div className="relative">
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-orange-100 dark:bg-orange-900/20 p-8 rounded-full">
          <UtensilsCrossed className="h-20 w-20 text-orange-500" />
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
          4<span className="text-orange-500">0</span>4
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold">Page Not Cooked Yet</h2>
        <p className="text-muted-foreground text-lg">
          The page you are looking for is either under construction, moved to a new location, or simply doesn&rsquo;t exist on our menu.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center">
        <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-2">
          <Link href="/search">
            <Search className="mr-2 h-4 w-4" />
            Browse Menu
          </Link>
        </Button>
      </div>
    </div>
  );
}