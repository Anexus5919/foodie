"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link"; // Changed from wouter
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuCategorySection, CategorySidebar, MenuCategorySkeleton } from "@/components/restaurant/menu-category";
import { useCart } from "@/lib/store";
import type { Restaurant, Dish, MenuCategory } from "@/shared/schema";
import {
  Star,
  Clock,
  MapPin,
  ChevronLeft,
  Search,
  Share2,
  Heart,
  Phone,
  Percent,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { cn } from "@/lib/utils";

export default function RestaurantClient({ id }: { id: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { cart, itemCount, getTotal } = useCart();

  // Fetch restaurant details
  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", id],
    enabled: !!id,
  });

  // Fetch menu categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/restaurants", id, "categories"],
    enabled: !!id,
  });

  // Fetch dishes
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/restaurants", id, "dishes"],
    enabled: !!id,
  });

  // Group dishes by category
  const dishesByCategory: Record<string, Dish[]> = {};
  dishes.forEach((dish) => {
    const categoryId = dish.categoryId || "uncategorized";
    if (!dishesByCategory[categoryId]) {
      dishesByCategory[categoryId] = [];
    }
    dishesByCategory[categoryId].push(dish);
  });

  // Dish counts for sidebar
  const dishCounts: Record<string, number> = {};
  categories.forEach((cat) => {
    dishCounts[cat.id] = dishesByCategory[cat.id]?.length || 0;
  });

  // Filter dishes by search
  const filteredDishesByCategory: Record<string, Dish[]> = {};
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    Object.entries(dishesByCategory).forEach(([catId, catDishes]) => {
      const filtered = catDishes.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.description?.toLowerCase().includes(query)
      );
      if (filtered.length > 0) {
        filteredDishesByCategory[catId] = filtered;
      }
    });
  }

  const displayDishesByCategory = searchQuery.trim()
    ? filteredDishesByCategory
    : dishesByCategory;

  // Scroll to category
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track active category on scroll
  useEffect(() => {
    const handleScroll = () => {
      const menuTop = menuRef.current?.offsetTop || 0;
      setIsSticky(window.scrollY > menuTop - 100);

      // Find active category
      categories.forEach((cat) => {
        const element = document.getElementById(`category-${cat.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveCategory(cat.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const isLoading = restaurantLoading || categoriesLoading || dishesLoading;
  const totals = getTotal();
  const showCartBar = cart.restaurantId === id && itemCount > 0;

  if (!restaurant || !restaurant.name) {
    return (
      <div className="flex h-screen items-center justify-center text-primary">
        <div className="text-xl font-bold">Loading Restaurant Data...</div>
      </div>
    );
  }

  if (isLoading || !restaurant) {
    return (
      <div className="min-h-screen pb-20">
        <div className="relative h-64 bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-background rounded-xl p-6 shadow-lg">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8">
          <MenuCategorySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" data-testid="restaurant-page">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80">
        {restaurant.coverImageUrl || restaurant.imageUrl ? (
          <img
            src={restaurant.coverImageUrl || restaurant.imageUrl || ""}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <span className="text-6xl font-bold text-primary/30">
            {/* usage of ?. ensures it doesn't crash if name is undefined */}
            {restaurant?.name?.charAt(0) || "F"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Offer Banner */}
        {restaurant.hasOffers && restaurant.offerText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3">
            <div className="container mx-auto flex items-center gap-2">
              <Percent className="h-5 w-5" />
              <span className="font-semibold">{restaurant.offerText}</span>
            </div>
          </div>
        )}
      </div>

      {/* Restaurant Info Card */}
      <div className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-background rounded-xl p-6 shadow-lg border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{restaurant.name}</h1>
              
              <p className="text-muted-foreground mb-3">
                {restaurant.cuisines?.join(", ") || "Multi-cuisine"}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md font-semibold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{Number(restaurant.rating).toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">
                  {restaurant.reviewCount} reviews
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.deliveryTime} mins</span>
                </div>
                <span className="text-muted-foreground">
                  {"$".repeat(restaurant.priceRange || 2)} for one
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{restaurant.address}</span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm">
                <Badge variant={restaurant.isOpen ? "default" : "secondary"}>
                  {restaurant.isOpen ? "Open Now" : "Closed"}
                </Badge>
                <span className="text-muted-foreground">
                  {restaurant.openingTime} - {restaurant.closingTime}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {restaurant.phone && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${restaurant.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://wa.me/${restaurant.phone.replace(/\D/g, "")}?text=Hi, I have a query about my order`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
                      WhatsApp
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="container mx-auto px-4 mt-8" ref={menuRef}>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-menu-search"
          />
        </div>

        <div className="flex gap-8">
          {/* Category Sidebar - Desktop */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <div className={cn("transition-all", isSticky && "sticky top-20")}>
              <CategorySidebar
                categories={categories}
                dishCounts={dishCounts}
                activeCategory={activeCategory}
                onCategoryClick={scrollToCategory}
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm">
                <div className="h-3 w-3 border-2 border-green-600 rounded-sm mr-2 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                </div>
                Veg
              </Button>
              <Button variant="outline" size="sm">
                <div className="h-3 w-3 border-2 border-red-600 rounded-sm mr-2 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                </div>
                Non-Veg
              </Button>
            </div>

            <div className="space-y-8">
              {categories.map((category) => {
                const categoryDishes = displayDishesByCategory[category.id];
                if (!categoryDishes || categoryDishes.length === 0) return null;

                return (
                  <MenuCategorySection
                    key={category.id}
                    category={category}
                    dishes={categoryDishes}
                    restaurant={restaurant}
                  />
                );
              })}

              {displayDishesByCategory["uncategorized"]?.length > 0 && (
                <MenuCategorySection
                  category={{ id: "uncategorized", name: "Other Items", restaurantId: restaurant.id, description: null, sortOrder: 999 }}
                  dishes={displayDishesByCategory["uncategorized"]}
                  restaurant={restaurant}
                />
              )}

              {Object.keys(displayDishesByCategory).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No dishes match your search" : "No dishes available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Cart Bar */}
      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg md:hidden">
          <Link href="/checkout">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{itemCount} items</p>
                  <p className="text-sm text-primary-foreground/80">
                    {totals.total.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button variant="secondary" data-testid="button-view-cart">
                View Cart
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}