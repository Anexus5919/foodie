"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "lucide-react";

import { useAuth, useLocation, useCart, useTheme } from "@/lib/store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { location: userLocation, setLocation, isLoading: locationLoading } = useLocation();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [manualAddress, setManualAddress] = useState({
    pincode: "",
    city: "",
    area: "",
    landmark: "",
  });

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  const textColorClass =
    theme === "light"
      ? "text-black"
      : isTransparent
      ? "text-white"
      : "text-foreground";

  const iconColorClass =
    theme === "light"
      ? "text-black"
      : isTransparent
      ? "text-white"
      : "text-foreground";

  const hoverClass = isTransparent ? "hover:bg-white/10" : "hover:bg-accent";

  // ⭐ FINAL WORKING ACCURATE LOCATION FUNCTION ⭐
  const handleDetectLocation = async () => {
    try {
      // STEP 1 — Get GPS Coordinates
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });

      const { latitude, longitude } = pos.coords;

      // STEP 2 — Reverse Geocode using Nominatim (with required headers)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "FoodieApp (localhost)",
            "Accept-Language": "en",
          },
        }
      );

      const data = await res.json();

      if (!data.address) throw new Error("Invalid response");

      const addr = data.address;

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.state ||
        "Unknown City";

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        "Unknown Area";

      const pincode = addr.postcode || "";

      // ⭐ Set Final Location
      setLocation({
        city,
        area,
        fullAddress: `${area}, ${city} - ${pincode}`,
        latitude,
        longitude,
      });

      setIsLocationModalOpen(false);
    } catch (error) {
      console.error("Location error:", error);
      alert("Unable to fetch accurate location.");
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
      {/* HEADER */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b",
          isTransparent
            ? "bg-transparent shadow-none border-transparent"
            : "bg-background/95 backdrop-blur shadow-sm border-border"
        )}
      >
        <div className="w-full px-4 md:px-20">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* LOGO + LOCATION */}
            <div className="flex items-center gap-8">
              <Link href="/">
                <span className="text-2xl font-bold text-orange-500 cursor-pointer tracking-tight">
                  Foodie
                </span>
              </Link>

              <div
                onClick={() => setIsLocationModalOpen(true)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer transition-colors group px-2 py-1 rounded-md",
                  hoverClass
                )}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-sm font-bold max-w-[200px] truncate border-b-2 border-transparent group-hover:border-current transition-colors",
                      textColorClass
                    )}
                  >
                    {userLocation.area || "Setup your location"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-orange-500" />
                </div>
              </div>
            </div>

            {/* SEARCH BAR (not on home page) */}
            {!isHomePage && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search for restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 bg-muted/50 focus-visible:bg-background h-10"
                  />
                </div>
              </div>
            )}

            {/* RIGHT ACTION BUTTONS */}
            <div className="flex items-center gap-6">

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(hoverClass, iconColorClass)}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                className={cn("relative font-medium", hoverClass, textColorClass)}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-600 border-none text-white">
                    {itemCount}
                  </Badge>
                )}
              </Button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn("hidden sm:flex items-center gap-2 font-medium", hoverClass, textColorClass)}
                    >
                      <User className="h-5 w-5" />
                      <span className="max-w-24 truncate">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setIsAuthOpen(true)}
                  className="hidden sm:flex px-8 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 border-none"
                >
                  Sign in
                </Button>
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

      {/* LOCATION MODAL */}
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div 
              onClick={handleDetectLocation}
              className="flex items-center gap-4 p-4 border border-orange-500/30 bg-orange-500/5 rounded-lg cursor-pointer hover:bg-orange-500/10 transition-colors"
            >
              <div className="bg-orange-500 p-2 rounded-full text-white">
                {locationLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Crosshair className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-orange-600 font-bold">Detect Current Location</h3>
                <p className="text-xs text-muted-foreground">Using GPS</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px bg-border flex-1"></div>
              <span className="text-muted-foreground text-xs uppercase">Or enter manually</span>
              <div className="h-px bg-border flex-1"></div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input 
                    id="pincode" 
                    placeholder="110001" 
                    value={manualAddress.pincode}
                    onChange={(e) => setManualAddress({...manualAddress, pincode: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    placeholder="New Delhi" 
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area / Sector / Locality</Label>
                <Input 
                  id="area" 
                  placeholder="Connaught Place" 
                  value={manualAddress.area}
                  onChange={(e) => setManualAddress({...manualAddress, area: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input 
                  id="landmark" 
                  placeholder="Near Metro Station" 
                  value={manualAddress.landmark}
                  onChange={(e) => setManualAddress({...manualAddress, landmark: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Save Location
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
