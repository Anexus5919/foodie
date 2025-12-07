"use client";

import Link from "next/link"; // FIXED: Use Next.js Link
import { Card } from "../../components/ui/card";

const cuisines = [
  {
    name: "Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
    color: "from-red-500/20 to-orange-500/20",
  },
  {
    name: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    color: "from-amber-500/20 to-yellow-500/20",
  },
  {
    name: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
    color: "from-yellow-500/20 to-orange-500/20",
  },
  {
    name: "Chinese",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80",
    color: "from-red-500/20 to-pink-500/20",
  },
  {
    name: "North Indian",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    name: "South Indian",
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80",
    color: "from-green-500/20 to-yellow-500/20",
  },
  {
    name: "Desserts",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
    color: "from-pink-500/20 to-purple-500/20",
  },
  {
    name: "Healthy",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
    color: "from-green-500/20 to-emerald-500/20",
  },
];

export function CuisineGrid() {
  return (
    <section className="py-12" data-testid="cuisine-grid">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">What&rsquo;s on your mind?</h2>
            <p className="text-muted-foreground mt-1">Explore cuisines you love</p>
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {cuisines.map((cuisine) => (
            <Link
              key={cuisine.name}
              href={`/search?cuisine=${encodeURIComponent(cuisine.name)}`}
              className="block group" // Added class for proper hit area
            >
              <Card
                className={`cursor-pointer overflow-hidden hover-elevate transition-all duration-200`}
                data-testid={`cuisine-card-${cuisine.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="aspect-square relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cuisine.color}`} />
                  <img
                    src={cuisine.image}
                    alt={cuisine.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-2 text-center">
                  <span className="text-sm font-medium">{cuisine.name}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}