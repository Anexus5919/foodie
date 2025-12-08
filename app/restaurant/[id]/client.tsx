"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Skeleton } from "../../../components/ui/skeleton";
import { MenuCategorySection, CategorySidebar, MenuCategorySkeleton } from "../../../components/restaurant/menu-category";
import { useCart, useAuth } from "../../../lib/store";
import type { Restaurant, Dish, MenuCategory } from "../../../shared/schema";
import {
  Star, Clock, MapPin, ChevronLeft, Search, Share2, Heart, Percent, ShoppingCart, ArrowRight, Loader2
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";

export default function RestaurantClient({ id }: { id: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Review Form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { cart, itemCount, getTotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("foodie_favorites") || "[]");
    setIsFavorite(favs.includes(id));
  }, [id]);

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem("foodie_favorites") || "[]");
    let newFavs;
    if (isFavorite) {
      newFavs = favs.filter((fid: string) => fid !== id);
      toast({ title: "Removed from Favorites" });
    } else {
      newFavs = [...favs, id];
      toast({ title: "Added to Favorites" });
    }
    localStorage.setItem("foodie_favorites", JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Foodie", text: `Check out ${restaurant?.name}!`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    }
  };

  const handleDirectReviewSubmit = async () => {
    if (!isAuthenticated) {
        toast({ title: "Please sign in", description: "You need to be logged in to review.", variant: "destructive" });
        return;
    }
    if (reviewRating === 0) {
        toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
        return;
    }

    setIsSubmittingReview(true);
    try {
        const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                restaurantId: id,
                userId: user?.id,
                restaurantRating: reviewRating,
                comment: reviewComment,
            }),
        });

        if (!res.ok) throw new Error("Failed to submit");

        toast({ title: "Review Submitted", description: "Thanks for your feedback!" });
        setReviewRating(0);
        setReviewComment("");
        // REFRESH REVIEWS
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", id, "reviews"] });
    } catch (error) {
        toast({ title: "Error", description: "Could not submit review.", variant: "destructive" });
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({ queryKey: ["/api/restaurants", id], enabled: !!id });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({ queryKey: ["/api/restaurants", id, "categories"], enabled: !!id });
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({ queryKey: ["/api/restaurants", id, "dishes"], enabled: !!id });

  // FETCH REAL REVIEWS
  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/restaurants", id, "reviews"],
    queryFn: async () => {
        const res = await fetch(`/api/restaurants/${id}/reviews`);
        if (!res.ok) return [];
        return res.json();
    },
    enabled: !!id
  });

  // ... (Dish filtering logic same as before) ...
  const dishesByCategory: Record<string, Dish[]> = {};
  dishes.forEach((dish) => {
    const categoryId = dish.categoryId || "uncategorized";
    if (!dishesByCategory[categoryId]) dishesByCategory[categoryId] = [];
    dishesByCategory[categoryId].push(dish);
  });
  
  const dishCounts: Record<string, number> = {};
  categories.forEach((cat) => { dishCounts[cat.id] = dishesByCategory[cat.id]?.length || 0; });
  
  const filteredDishesByCategory: Record<string, Dish[]> = {};
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    Object.entries(dishesByCategory).forEach(([catId, catDishes]) => {
      const filtered = catDishes.filter(dish => dish.name.toLowerCase().includes(query));
      if (filtered.length > 0) filteredDishesByCategory[catId] = filtered;
    });
  }
  const displayDishesByCategory = searchQuery.trim() ? filteredDishesByCategory : dishesByCategory;

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const menuTop = menuRef.current?.offsetTop || 0;
      setIsSticky(window.scrollY > menuTop - 100);
      categories.forEach((cat) => {
        const element = document.getElementById(`category-${cat.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) setActiveCategory(cat.id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const isLoading = restaurantLoading || categoriesLoading || dishesLoading;
  const totals = getTotal();
  const showCartBar = cart.restaurantId === id && itemCount > 0;

  if (isLoading || !restaurant) {
    return <div className="min-h-screen pb-20"><div className="relative h-64 bg-muted"><Skeleton className="w-full h-full" /></div></div>;
  }

  return (
    <div className="min-h-screen pb-24" data-testid="restaurant-page">
      <div className="relative h-64 md:h-80">
        <img src={restaurant.coverImageUrl || restaurant.imageUrl || ""} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur" onClick={toggleFavorite}>
              <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "")} />
            </Button>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {restaurant.hasOffers && restaurant.offerText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3">
            <div className="container mx-auto flex items-center gap-2"><Percent className="h-5 w-5" /><span className="font-semibold">{restaurant.offerText}</span></div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-background rounded-xl p-6 shadow-lg border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-muted-foreground mb-3">{restaurant.cuisines?.join(", ")}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md font-semibold"><Star className="h-4 w-4 fill-current" /><span>{Number(restaurant.rating).toFixed(1)}</span></div>
                <span className="text-muted-foreground">{restaurant.reviewCount} reviews</span>
                <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /><span>{restaurant.deliveryTime} mins</span></div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{restaurant.address}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8" ref={menuRef}>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-48 flex-shrink-0">
             <div className={cn("transition-all", isSticky && "sticky top-20")}>
               <CategorySidebar categories={categories} dishCounts={dishCounts} activeCategory={activeCategory} onCategoryClick={scrollToCategory} />
             </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              {categories.map((category) => {
                const categoryDishes = displayDishesByCategory[category.id];
                if (!categoryDishes || categoryDishes.length === 0) return null;
                return <MenuCategorySection key={category.id} category={category} dishes={categoryDishes} restaurant={restaurant} />;
              })}
              
              {/* REVIEWS SECTION */}
              <div className="mt-12 pt-8 border-t" id="reviews-section">
                <h3 className="text-xl font-bold mb-6">Ratings & Reviews</h3>
                
                {/* List */}
                <div className="space-y-6 mb-8">
                  {reviews.length === 0 ? (
                     <div className="p-8 text-center border rounded-xl bg-muted/20">
                        <p className="text-muted-foreground">No reviews yet. Order now and be the first to review!</p>
                     </div>
                  ) : (
                    reviews.map((review: any) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8"><AvatarFallback>U</AvatarFallback></Avatar>
                            <span className="font-medium text-sm">Verified User</span>
                            </div>
                            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                            <span>{review.rating}</span><Star className="h-3 w-3 fill-current" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))
                  )}
                </div>

                {/* Direct Review Form */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-lg mb-4">Write a Review</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm">Rate:</span>
                       <div className="flex">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button key={star} onClick={() => setReviewRating(star)} type="button">
                             <Star className={cn("h-6 w-6 transition-colors", star <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30")} />
                           </button>
                         ))}
                       </div>
                    </div>
                    <Textarea 
                      placeholder="Share your experience..." 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="resize-none"
                    />
                    <Button onClick={handleDirectReviewSubmit} disabled={isSubmittingReview}>
                      {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg md:hidden">
          <Link href="/checkout">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"><ShoppingCart className="h-5 w-5" /></div>
                <div><p className="font-semibold">{itemCount} items</p><p className="text-sm text-primary-foreground/80">{totals.total.toFixed(2)}</p></div>
              </div>
              <Button variant="secondary">View Cart <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}