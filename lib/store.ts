"use client";

import { createContext, useContext } from "react";
import type { User, CartItemWithDetails, Restaurant, Address } from "../shared/schema";

// ==================== CART ====================
interface CartState {
  items: CartItemWithDetails[];
  restaurantId: string | null;
  restaurant: Restaurant | null;
  discount: number; // NEW
  appliedCoupon: string | null; // NEW
}

interface CartContextType {
  cart: CartState;
  addItem: (item: CartItemWithDetails) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, amount: number) => void; // NEW
  removeCoupon: () => void; // NEW
  getTotal: () => { subtotal: number; deliveryFee: number; taxes: number; total: number; discount: number }; // UPDATED
  itemCount: number;
}

export const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// ==================== AUTH ====================
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// ==================== LOCATION ====================
interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  area: string;
  fullAddress: string;
}

interface LocationContextType {
  location: LocationState;
  setLocation: (location: Partial<LocationState>) => void;
  requestLocation: () => Promise<void>;
  isLoading: boolean;
}

export const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
};

// ==================== THEME ====================
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

// ==================== FILTER ====================
export interface FilterState {
  cuisines: string[];
  isVegOnly: boolean;
  minRating: number;
  priceRange: number[];
  sortBy: "relevance" | "rating" | "deliveryTime" | "costLowToHigh" | "costHighToLow";
  hasOffers: boolean;
  maxDeliveryTime: number | null;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

export const FilterContext = createContext<FilterContextType | null>(null);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
};

export const defaultFilters: FilterState = {
  cuisines: [],
  isVegOnly: false,
  minRating: 0,
  priceRange: [1, 4],
  sortBy: "relevance",
  hasOffers: false,
  maxDeliveryTime: null,
};