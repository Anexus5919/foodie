import { NextResponse } from "next/server";
import { storage } from "../../../lib/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Destructure everything including potential direct restaurantId
    const { orderId, restaurantId, restaurantRating, deliveryRating, dishRatings, comment, userId } = body;

    const reviews = [];

    // CASE 1: Review from "My Orders" (Has orderId)
    if (orderId) {
        const order = await storage.getOrder(orderId);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // A. Dish Specific Reviews
        if (dishRatings) {
            for (const [dishId, rating] of Object.entries(dishRatings)) {
                reviews.push(await storage.createDishReview({
                    dishId: dishId as string,
                    userId: order.userId,
                    orderId: orderId,
                    rating: Number(rating),
                    comment: comment, // Applied comment to all for simplicity in demo
                } as any));
            }
        }

        // B. Restaurant Rating (General)
        // Attach this to the first dish in the order so it appears on the restaurant page
        if (restaurantRating && order.items && order.items.length > 0) {
             reviews.push(await storage.createDishReview({
                dishId: order.items[0].dishId,
                userId: order.userId,
                orderId: orderId,
                rating: restaurantRating,
                comment: comment || "Restaurant Rating",
            } as any));
        }
    } 
    // CASE 2: Direct Review from Restaurant Page (Has restaurantId)
    else if (restaurantId) {
       // Find a valid dishId to attach this review to
       const dishes = await storage.getDishes(restaurantId);
       const targetDishId = dishes[0]?.id; 

       if (targetDishId) {
          reviews.push(await storage.createDishReview({
            dishId: targetDishId,
            userId: userId || "anonymous",
            rating: restaurantRating,
            comment: comment,
            orderId: null, // No order ID
          } as any));
       }
    }

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Review submit error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}