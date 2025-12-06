import { Metadata } from "next";
import { storage } from "@/lib/storage";
import RestaurantClient from "./client";

// SEO: Generate metadata dynamically based on restaurant ID
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  // FIX: Await params before accessing properties
  const { id } = await params;
  const restaurant = await storage.getRestaurant(id);
  
  if (!restaurant) {
    return {
      title: "Restaurant Not Found | Foodie",
    };
  }

  return {
    title: `${restaurant.name} | Foodie`,
    description: `Order food online from ${restaurant.name} in ${restaurant.address}. View menu, reviews, and offers.`,
    openGraph: {
      images: [restaurant.imageUrl || ""],
    },
  };
}

export default async function RestaurantPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // FIX: Await params here as well
  const { id } = await params;
  
  // Pass the ID to the client component
  return <RestaurantClient id={id} />;
}