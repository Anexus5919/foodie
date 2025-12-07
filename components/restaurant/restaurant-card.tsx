"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import type { Restaurant } from "../../shared/schema";
import { Star, Clock, MapPin, Heart } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col hover-elevate group cursor-pointer border-border/50">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/20">
                {restaurant.name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {restaurant.hasOffers && (
              <Badge variant="destructive" className="font-semibold shadow-sm">
                Offer
              </Badge>
            )}
            {restaurant.isVeg && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 shadow-sm border-green-200">
                Pure Veg
              </Badge>
            )}
          </div>

          {/* Favorite Button (Prevent navigation when clicking this) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:bg-white/20 hover:text-white rounded-full h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add favorite logic here
            }}
          >
            <Heart className="h-5 w-5" />
          </Button>

          {/* Delivery Time Badge */}
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {restaurant.deliveryTime} mins
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold shadow-sm">
              <span>{Number(restaurant.rating).toFixed(1)}</span>
              <Star className="h-3 w-3 fill-current" />
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mb-2 line-clamp-1">
            {restaurant.cuisines.join(", ")}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-0 border-t bg-muted/5 text-xs text-muted-foreground flex justify-between items-center">
          {restaurant.offerText ? (
            <span className="text-blue-600 font-medium flex items-center gap-1">
              <span className="text-lg">🏷️</span> {restaurant.offerText}
            </span>
          ) : (
            <span>Min order ₹{restaurant.minOrderAmount}</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-48 bg-muted animate-pulse" />
      <CardContent className="p-4 flex-1 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-10" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Skeleton className="h-4 w-2/3" />
      </CardFooter>
    </Card>
  );
}