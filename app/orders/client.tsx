"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { OrderCard } from "../../components/order/order-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { ShoppingBag, Loader2 } from "lucide-react";
import type { Order } from "../../shared/schema";
import Link from "next/link";

interface OrderWithDetails extends Order {
  restaurant?: { name: string; imageUrl?: string | null };
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">{message}</h3>
    <Button variant="outline" asChild className="mt-2">
      <Link href="/">Browse Restaurants</Link>
    </Button>
  </div>
);

export default function OrdersClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch Orders with polling
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/orders?userId=${user?.id}`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Cancel Order Mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "cancelled",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });

  // Delete Order Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order log deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter Orders
  const activeOrders = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready", "picked_up", "on_the_way"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {/* Active Orders Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <EmptyState message="No active orders" />
          ) : (
            activeOrders.map((order) => (
              <OrderCard 
                key={order.id}
                order={order}
                onCancel={() => cancelOrderMutation.mutate(order.id)}
                isCancelling={cancelOrderMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* Delivered Orders Tab */}
        <TabsContent value="delivered" className="space-y-4">
          {deliveredOrders.length === 0 ? (
            <EmptyState message="No past orders" />
          ) : (
            deliveredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDelete={() => deleteOrderMutation.mutate(order.id)}
              />
            ))
          )}
        </TabsContent>

        {/* Cancelled Orders Tab */}
        <TabsContent value="cancelled" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <EmptyState message="No cancelled orders" />
          ) : (
            cancelledOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDelete={() => deleteOrderMutation.mutate(order.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}