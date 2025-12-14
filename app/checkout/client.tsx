"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useCart } from "../../lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddressSelector } from "../../components/checkout/address-selector";
import { PaymentOptions, type PaymentMethod } from "../../components/checkout/payment-options";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useToast } from "../../hooks/use-toast";
import { ToastAction } from "../../components/ui/toast";
import { ArrowLeft, Loader2, ShieldCheck, MapPin } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import type { Address } from "../../shared/schema";
import Link from "next/link";

export default function CheckoutClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, getTotal, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart.items.length) {
      router.push("/");
    }
  }, [cart.items.length, router]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to be logged in to place an order",
        variant: "destructive",
        action: (
          <ToastAction altText="Sign In" onClick={() => router.push("/")}>
            Sign In
          </ToastAction>
        ),
      });
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router, toast]);

  // Fetch Addresses
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/addresses?userId=${user?.id}`);
      return res.json();
    },
  });

  // Set default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: async (newAddress: Omit<Address, "id">) => {
      const res = await apiRequest("POST", "/api/addresses", {
        ...newAddress,
        userId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add address", variant: "destructive" });
    },
  });

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: "Select Address",
        description: "Please select a delivery address to continue",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "upi" && !upiId) {
      toast({
        title: "Enter UPI ID",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      const totals = getTotal();

      // Simulate Payment Gateway Delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const orderPayload = {
        userId: user!.id,
        restaurantId: cart.restaurantId,
        addressId: selectedAddressId,
        deliveryAddress: selectedAddress?.fullAddress || "",
        items: cart.items.map(item => ({
          dishId: item.dishId,
          dishName: item.dish?.name || "Unknown Item",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          customizations: item.customizations,
          specialInstructions: item.specialInstructions
        })),
        subtotal: totals.subtotal.toFixed(2),
        deliveryFee: totals.deliveryFee.toFixed(2),
        taxes: totals.taxes.toFixed(2),
        total: totals.total.toFixed(2),
        paymentMethod,
        paymentStatus: "paid", // In a real app, this comes from the gateway
        status: "pending",
        deliveryPartnerLocation: cart.restaurant ? { 
           lat: Number(cart.restaurant.latitude), 
           lng: Number(cart.restaurant.longitude) 
        } : null
      };

      const res = await apiRequest("POST", "/api/orders", orderPayload);
      const newOrder = await res.json();

      if (newOrder.error) throw new Error(newOrder.error);

      clearCart();
      toast({
        title: "Order Placed! 🎉",
        description: "Your food is on the way.",
        action: (
          <ToastAction altText="View Orders" onClick={() => router.push("/orders")}>
            View Orders
          </ToastAction>
        ),
      });
      
      router.push(`/order/${newOrder.id}`);
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Order Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totals = getTotal();

  if (!cart.items.length) return null;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 pt-4">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Address Section */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Select Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <AddressSelector
                  addresses={addresses}
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAddAddress={async (addr) => {
                    await addAddressMutation.mutateAsync(addr as typeof addr);
                  }}
                />
              </CardContent>
            </Card>

            {/* 2. Payment Section */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PaymentOptions
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  upiId={upiId}
                  onUpiIdChange={setUpiId}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4 border-b bg-muted/20">
                <CardTitle className="text-lg">Order Summary</CardTitle>
                {cart.restaurant && (
                   <p className="text-sm text-muted-foreground">{cart.restaurant.name}</p>
                )}
              </CardHeader>
              
              <CardContent className="pt-6">
                <ScrollArea className="h-[200px] pr-4 mb-4">
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex gap-2">
                           <span className="font-medium text-muted-foreground">{item.quantity}x</span>
                           <span className="line-clamp-2">{item.dish?.name}</span>
                        </div>
                        <span className="font-medium">
                          {Number(item.totalPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Item Total</span>
                    <span>{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>{totals.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes (5%)</span>
                    <span>{totals.taxes.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>To Pay</span>
                    <span>{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-md"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  data-testid="button-place-order"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${totals.total.toFixed(2)}`
                  )}
                </Button>

                <div className="mt-4 flex justify-center">
                   <p className="text-xs text-muted-foreground flex items-center gap-1">
                     <ShieldCheck className="h-3 w-3" />
                     Safe & Secure Payment
                   </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}