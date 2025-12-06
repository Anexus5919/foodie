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
} from "@/lib/store";
import type { User, CartItemWithDetails, Restaurant, Address } from "../shared/schema";

// Cart Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const addItem = useCallback((item: CartItemWithDetails) => {
    setItems((prev) => {
      // Check if adding from different restaurant
      if (restaurantId && item.restaurantId !== restaurantId) {
        // Clear cart and add new item
        setRestaurantId(item.restaurantId);
        setRestaurant(item.restaurant || null);
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
  }, []);

  const getTotal = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const deliveryFee = restaurant ? Number(restaurant.deliveryFee) : 0;
    const taxes = subtotal * 0.05; // 5% GST
    const total = subtotal + deliveryFee + taxes;
    return { subtotal, deliveryFee, taxes, total };
  }, [items, restaurant]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: { items, restaurantId, restaurant },
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    // Check for stored user session
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("foodie_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem("foodie_user");
        }
      }
    }
    setIsLoading(false);
  }, []);

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
          enableHighAccuracy: true, // <--- CHANGED: Set to true for GPS
          timeout: 20000,           // <--- CHANGED: Increased timeout for GPS lock
          maximumAge: 0             // <--- CHANGED: Do not use cached position
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
      } catch (geocodeError) {
        setLocationState({
          latitude,
          longitude,
          city: "Current Location",
          area: "Location Detected",
          fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      }
    } catch (error: any) {
      if (error.code === 1) console.error("Location Error: Permission Denied");
      else if (error.code === 2) console.error("Location Error: Position Unavailable");
      else if (error.code === 3) console.error("Location Error: Timeout");
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
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("foodie_theme") as "light" | "dark";
      if (stored) {
        setThemeState(stored);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("foodie_theme", theme);
  }, [theme]);

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