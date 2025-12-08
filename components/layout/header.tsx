"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../components/ui/sheet";
import {
  ChevronDown,
  Search,
  ShoppingCart,
  User,
  Menu,
  Sun,
  Moon,
  Crosshair,
  Loader2,
  Store,
  Utensils,
  Heart
} from "lucide-react";

import { useAuth, useLocation, useCart, useTheme } from "../../lib/store";
import { CartDrawer } from "../../components/cart/cart-drawer";
import { AuthDialog } from "../../components/auth/auth-dialog";
import { cn } from "../../lib/utils";

// Mock data including Dosa Club
const SUGGESTIONS = [
  { type: 'restaurant', name: 'Tandoori Nights', id: 'rest-1' },
  { type: 'restaurant', name: 'Pizza Paradise', id: 'rest-2' },
  { type: 'restaurant', name: 'Dragon Wok', id: 'rest-3' },
  { type: 'restaurant', name: 'Green Bowl', id: 'rest-4' },
  { type: 'restaurant', name: 'Burger Barn', id: 'rest-5' },
  { type: 'restaurant', name: 'Dosa Club', id: 'rest-6' }, // Added
  { type: 'dish', name: 'Biryani', id: 'biryani' },
  { type: 'dish', name: 'Pizza', id: 'pizza' },
  { type: 'dish', name: 'Burger', id: 'burger' },
  { type: 'dish', name: 'Dosa', id: 'dosa' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setUser } = useAuth();
  const { location: userLocation, setLocation, isLoading: locationLoading } = useLocation();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof SUGGESTIONS>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Strict "Starts With" Filter Logic
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length > 0) {
      const filtered = SUGGESTIONS.filter(item => 
        item.name.toLowerCase().includes(query)
      ).sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const aStarts = nameA.startsWith(query);
        const bStarts = nameB.startsWith(query);

        // Priority 1: Starts with query
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Priority 2: Alphabetical
        return nameA.localeCompare(nameB);
      }).slice(0, 5);
      
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [manualAddress, setManualAddress] = useState({
    pincode: "",
    city: "",
    area: "",
    landmark: "",
  });

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !scrolled;
  const textColorClass = !mounted || theme === "light" ? "text-black" : isTransparent ? "text-white" : "text-foreground";
  const iconColorClass = !mounted || theme === "light" ? "text-black" : isTransparent ? "text-white" : "text-foreground";
  const hoverClass = isTransparent ? "hover:bg-white/10" : "hover:bg-accent";

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (item: typeof SUGGESTIONS[0]) => {
    setShowSuggestions(false);
    setSearchQuery(""); 
    if (item.type === 'restaurant') {
      router.push(`/restaurant/${item.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(item.name)}`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    router.push("/");
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "FoodieApp/1.0", "Accept-Language": "en-US,en;q=0.5" } }
      );
      if (!res.ok) throw new Error("Failed to fetch address details");
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.state_district || addr.state || "Unknown City";
      const area = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "Current Location";
      const pincode = addr.postcode || "";
      setLocation({
        city,
        area,
        fullAddress: data.display_name || `${area}, ${city}`,
        latitude,
        longitude,
      });
      setIsLocationModalOpen(false);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const geoError = error as GeolocationPositionError;
        if (geoError.code === 1) alert("Location permission denied.");
        else if (geoError.code === 2) alert("Location unavailable.");
        else if (geoError.code === 3) alert("Location request timed out.");
      } else {
        console.error("Location error:", error);
        alert("Unable to detect location.");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.area && manualAddress.city) {
      setLocation({
        city: manualAddress.city,
        area: manualAddress.area,
        fullAddress: `${manualAddress.area}, ${
          manualAddress.landmark ? manualAddress.landmark + ", " : ""
        }${manualAddress.city} - ${manualAddress.pincode}`,
      });
      setIsLocationModalOpen(false);
    }
  };

  return (
    <>
      <header className={cn("sticky top-0 z-50 w-full transition-all duration-300 border-b", isTransparent ? "bg-transparent shadow-none border-transparent" : "bg-background/95 backdrop-blur shadow-sm border-border")}>
        <div className="w-full px-4 md:px-20">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* LOGO */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative h-10 w-10">
                    <Image src="/logo.svg" alt="Foodie Logo" fill className="object-contain" priority />
                </div>
                <span className="text-2xl font-bold text-orange-500 cursor-pointer tracking-tight">Foodie</span>
              </Link>

              {/* Location Trigger */}
              <div onClick={() => setIsLocationModalOpen(true)} className={cn("flex items-center gap-2 cursor-pointer transition-colors group px-2 py-1 rounded-md", hoverClass)}>
                 <div className="flex items-center gap-1">
                   <span className={cn("text-sm font-bold max-w-[200px] truncate border-b-2 border-transparent group-hover:border-current transition-colors", textColorClass)}>{mounted ? userLocation.area : "Select Location"}</span>
                   <ChevronDown className="h-4 w-4 text-orange-500" />
                 </div>
              </div>
            </div>

            {/* SEARCH */}
            {!isHomePage && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8" ref={searchRef}>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search for restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                    className="w-full pl-10 bg-muted/50 focus-visible:bg-background h-10"
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg overflow-hidden py-1 z-50">
                      {filteredSuggestions.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                          onClick={() => handleSuggestionClick(item)}
                        >
                          {item.type === 'restaurant' ? <Store className="h-4 w-4 text-orange-500" /> : <Utensils className="h-4 w-4 text-muted-foreground" />}
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center gap-6">
              {mounted && (
                <Button variant="ghost" size="icon" onClick={toggleTheme} className={cn(hoverClass, iconColorClass)}>
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              )}

              <Button variant="ghost" className={cn("relative font-medium", hoverClass, textColorClass)} onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {itemCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-600 border-none text-white">{itemCount}</Badge>}
              </Button>

              {mounted && (
                isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("hidden sm:flex items-center gap-2 font-medium", hoverClass, textColorClass)}>
                        <User className="h-5 w-5" />
                        <span className="max-w-24 truncate">{user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                      <DropdownMenuItem asChild><Link href="/favorites" className="cursor-pointer"><Heart className="h-4 w-4 mr-2" /> My Favorites</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/orders" className="cursor-pointer"><Store className="h-4 w-4 mr-2" /> My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer"><User className="h-4 w-4 mr-2" /> Profile</Link></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button onClick={() => setIsAuthOpen(true)} className="hidden sm:flex px-8 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 border-none">Sign in</Button>
                )
              )}

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("sm:hidden", iconColorClass, hoverClass)}>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right"></SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

       <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
           <div className="space-y-6 py-4">
             <div onClick={!isDetecting ? handleDetectLocation : undefined} className={cn("flex items-center gap-4 p-4 border border-orange-500/30 bg-orange-500/5 rounded-lg cursor-pointer hover:bg-orange-500/10 transition-colors", isDetecting && "opacity-70 cursor-wait")}>
               <div className="bg-orange-500 p-2 rounded-full text-white">{isDetecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}</div>
               <div><h3 className="text-orange-600 font-bold">{isDetecting ? "Detecting..." : "Detect Current Location"}</h3><p className="text-xs text-muted-foreground">Using GPS</p></div>
             </div>
             <div className="flex items-center gap-2"><div className="h-px bg-border flex-1"></div><span className="text-muted-foreground text-xs uppercase">Or enter manually</span><div className="h-px bg-border flex-1"></div></div>
             <form onSubmit={handleManualSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" placeholder="110001" value={manualAddress.pincode} onChange={(e) => setManualAddress({...manualAddress, pincode: e.target.value})} /></div>
                 <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" placeholder="New Delhi" value={manualAddress.city} onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})} /></div>
               </div>
               <div className="space-y-2"><Label htmlFor="area">Area / Sector / Locality</Label><Input id="area" placeholder="Connaught Place" value={manualAddress.area} onChange={(e) => setManualAddress({...manualAddress, area: e.target.value})} /></div>
               <div className="space-y-2"><Label htmlFor="landmark">Landmark (Optional)</Label><Input id="landmark" placeholder="Near Metro Station" value={manualAddress.landmark} onChange={(e) => setManualAddress({...manualAddress, landmark: e.target.value})} /></div>
               <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">Save Location</Button>
             </form>
           </div>
        </DialogContent>
      </Dialog>

      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}