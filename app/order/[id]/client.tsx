"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { OrderTimeline } from "../../../components/order/order-timeline";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { ChevronLeft, Phone, Home } from "lucide-react";
import Link from "next/link";
import type { Order, OrderItem, OrderStatusType } from "../../../shared/schema";

const DeliveryMap = dynamic(
  () => import("../../../components/map/delivery-map").then((mod) => mod.DeliveryMap),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted animate-pulse" />
  }
);

interface OrderDetail extends Order {
  restaurant?: {
    name: string;
    imageUrl: string | null;
    location: { lat: number; lng: number };
  };
  deliveryCoordinates?: { lat: number; lng: number } | null;
}

export default function OrderClient({ id }: { id: string }) {
  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["/api/orders", id],
    refetchInterval: 2000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const items = (order.items || []) as OrderItem[];
  const status = order.status as OrderStatusType;
  const isDelivered = status === "delivered";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-xs text-muted-foreground">
            {order.restaurant?.name}
          </p>
        </div>
      </div>

      <div className="container mx-auto p-4 grid gap-6 lg:grid-cols-3">
        
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-0 shadow-lg h-[60vh] lg:h-[70vh] relative rounded-xl">
            <DeliveryMap
              className="w-full h-full"
              restaurantLocation={order.restaurant?.location}
              deliveryLocation={order.deliveryCoordinates || undefined}
              partnerLocation={order.deliveryPartnerLocation || undefined}
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-4 rounded-lg shadow-lg border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg flex items-center gap-2">
                    {isDelivered ? (
                      <>
                        <Home className="h-5 w-5 text-green-600" />
                        Delivered
                      </>
                    ) : status === 'picked_up' ? (
                      'On the way'
                    ) : (
                      'Preparing your food'
                    )}
                  </p>
                  {!isDelivered && (
                    <p className="text-sm text-muted-foreground">
                      {order.estimatedDeliveryTime 
                        ? `Arriving in ${order.estimatedDeliveryTime} mins` 
                        : "Calculating time..."}
                    </p>
                  )}
                  {isDelivered && (
                     <p className="text-sm text-muted-foreground">Order completed</p>
                  )}
                </div>
                {order.deliveryPartnerId && !isDelivered && (
                  <Button 
                    size="icon" 
                    className="rounded-full bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(`tel:+919876543210`)} 
                  >
                    <Phone className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Status</h3>
            <OrderTimeline 
              status={status} 
              timestamps={{
                acceptedAt: order.acceptedAt ? String(order.acceptedAt) : null,
                preparingAt: order.preparingAt ? String(order.preparingAt) : null,
                readyAt: order.readyAt ? String(order.readyAt) : null,
                pickedUpAt: order.pickedUpAt ? String(order.pickedUpAt) : null,
                deliveredAt: order.deliveredAt ? String(order.deliveredAt) : null
              }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.dishName}</span>
                  <span className="font-medium">{Number(item.totalPrice).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}