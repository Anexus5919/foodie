import { NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await storage.getOrder(id);
  
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const restaurant = await storage.getRestaurant(order.restaurantId);
  
  // NEW: Fetch customer address to get delivery coordinates
  let deliveryCoordinates = null;
  if (order.addressId) {
    const address = await storage.getAddress(order.addressId);
    if (address && address.latitude && address.longitude) {
      deliveryCoordinates = { 
        lat: Number(address.latitude), 
        lng: Number(address.longitude) 
      };
    }
  }

  return NextResponse.json({
    ...order,
    restaurant: restaurant
      ? { 
          name: restaurant.name, 
          imageUrl: restaurant.imageUrl,
          // Pass restaurant coordinates
          location: {
            lat: Number(restaurant.latitude),
            lng: Number(restaurant.longitude)
          }
        }
      : undefined,
    deliveryCoordinates, // Pass customer coordinates
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const body = await request.json();
  const updated = await storage.updateOrder(id, body);
  
  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// Added DELETE method
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await storage.deleteOrder(id);
  return NextResponse.json({ success: true });
}