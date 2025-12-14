"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  CartContext,
  AuthContext,
  LocationContext,
  ThemeContext,
  FilterContext,
  defaultFilters,
  type FilterState,
} from "../lib/store";
import type { User, CartItemWithDetails, Restaurant, Address } from "../shared/schema";

// Cart Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  // Global discount state
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const applyCoupon = useCallback((code: string, amount: number) => {
    setAppliedCoupon(code);
    setDiscount(amount);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscount(0);
  }, []);

  const addItem = useCallback((item: CartItemWithDetails) => {
    setItems((prev) => {
      // Check if adding from different restaurant
      if (restaurantId && item.restaurantId !== restaurantId) {
        // Clear cart and add new item
        setRestaurantId(item.restaurantId);
        setRestaurant(item.restaurant || null);
        // Reset coupon when restaurant changes
        setDiscount(0);
        setAppliedCoupon(null);
        return [item];
      }
      
      if (!restaurantId) {
        setRestaurantId(item.restaurantId);
        setRestaurant(item.restaurant || null);
      }

      // Check if item already exists (same dish + same customizations)
      const existingIndex = prev.findIndex(
        (i) =>
          i.dishId === item.dishId &&
          JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
          totalPrice: String(
            Number(updated[existingIndex].unitPrice) *
              (updated[existingIndex].quantity + item.quantity)
          ),
        };
        return updated;
      }

      return [...prev, item];
    });
  }, [restaurantId]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== itemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurant(null);
        // Reset coupon if cart becomes empty
        setDiscount(0);
        setAppliedCoupon(null);
      }
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalPrice: String(Number(item.unitPrice) * quantity),
            }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurant(null);
    setDiscount(0);
    setAppliedCoupon(null);
  }, []);

  const getTotal = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    
    // Delivery fee constraints
    let deliveryFee = 0;
    if (subtotal > 0) {
      deliveryFee = subtotal < 150 ? 50 : 0;
    }

    const taxes = subtotal * 0.05; // 5% GST
    
    // Ensure discount doesn't exceed payable amount (excluding delivery fee usually, but simplicity here)
    const validDiscount = Math.min(discount, subtotal + taxes);
    
    const total = Math.max(0, subtotal + deliveryFee + taxes - validDiscount);
    
    return { subtotal, deliveryFee, taxes, discount: validDiscount, total };
  }, [items, discount]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: { items, restaurantId, restaurant, discount, appliedCoupon },
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        getTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize state from localStorage during initial render
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("foodie_user");
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          localStorage.removeItem("foodie_user");
        }
      }
    }
    return null;
  });
  const [isLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleSetUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem("foodie_user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("foodie_user");
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser: handleSetUser,
        selectedAddress,
        setSelectedAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Location Provider
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    city: "Bangalore",
    area: "Select Location",
    fullAddress: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const setLocation = useCallback((newLocation: Partial<typeof location>) => {
    setLocationState((prev) => ({ ...prev, ...newLocation }));
  }, []);

  const requestLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
       console.warn("Geolocation not supported by this browser.");
       return;
    }
    
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode using Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        setLocationState({
          latitude,
          longitude,
          city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
          area: data.address?.suburb || data.address?.neighbourhood || data.address?.road || "Current Location",
          fullAddress: data.display_name || "",
        });
      } catch {
        setLocationState({
          latitude,
          longitude,
          city: "Current Location",
          area: "Location Detected",
          fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      }
    } catch (error: unknown) {
      const err = error as GeolocationPositionError | Error;
      if ('code' in err && err.code === 1) console.error("Location Error: Permission Denied");
      else if ('code' in err && err.code === 2) console.error("Location Error: Position Unavailable");
      else if ('code' in err && err.code === 3) console.error("Location Error: Timeout");
      else console.error("Location Error:", error);

      // Fallback
      setLocationState({
        latitude: 12.9716,
        longitude: 77.5946,
        city: "Bangalore",
        area: "Koramangala",
        fullAddress: "Koramangala, Bangalore, Karnataka (Fallback)",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{ location, setLocation, requestLocation, isLoading }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// Theme Provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    // Initialize theme from localStorage or system preference
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("foodie_theme") as "light" | "dark" | null;
    if (stored) return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("foodie_theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Filter Provider
export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const activeFilterCount =
    (filters.cuisines.length > 0 ? 1 : 0) +
    (filters.isVegOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.priceRange[0] > 1 || filters.priceRange[1] < 4 ? 1 : 0) +
    (filters.hasOffers ? 1 : 0) +
    (filters.maxDeliveryTime !== null ? 1 : 0);

  return (
    <FilterContext.Provider
      value={{ filters, setFilters, resetFilters, activeFilterCount }}
    >
      {children}
    </FilterContext.Provider>
  );
}

// Combined Providers
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <FilterProvider>
            <CartProvider>{children}</CartProvider>
          </FilterProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}