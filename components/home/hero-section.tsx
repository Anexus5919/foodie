"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Star, Truck } from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80";

const trustStats = [
  { icon: Star, value: "4.8", label: "Avg Rating" },
  { icon: Clock, value: "25 mins", label: "Avg Delivery" },
  { icon: Truck, value: "10,000+", label: "Restaurants" },
];

const popularCuisines = [
  "Pizza",
  "Burgers",
  "Biryani",
  "Chinese",
  "North Indian",
  "South Indian",
  "Desserts",
  "Italian",
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCuisineClick = (cuisine: string) => {
    router.push(`/search?cuisine=${encodeURIComponent(cuisine)}`);
  };

  return (
    // FIX: Changed 'h-[80vh]' to 'h-auto' and added 'pb-20'.
    // This allows the background to stretch if the content gets pushed down.
    <section
      className="relative h-[91vh] h-auto flex items-center pb-20"
      data-testid="hero-section"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Delicious food spread"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="w-full px-4 md:px-20 relative z-10">
        <div className="max-w-2xl pt-24">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Hungry? We've got <br />
            <span className="text-orange-500">you covered</span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-lg font-medium">
            Order food from your favorite restaurants and get it delivered to
            your doorstep in minutes.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex gap-2 mb-10 shadow-2xl rounded-xl bg-white/5 p-1 backdrop-blur-sm border border-white/10 max-w-lg"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 text-base bg-white border-0 text-black placeholder:text-gray-500 rounded-lg focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
            >
              Search
            </Button>
          </form>

          {/* Popular Cuisines */}
          <div className="mb-10">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Popular Cuisines
            </p>
            <div className="flex flex-wrap gap-3">
              {popularCuisines.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-gray-200 hover:bg-white/10 hover:border-white/40 cursor-pointer px-4 py-2 transition-all font-normal text-sm"
                  onClick={() => handleCuisineClick(cuisine)}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats Divider */}
          <div className="flex items-center gap-10 pt-6 border-t border-white/10">
            {trustStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
