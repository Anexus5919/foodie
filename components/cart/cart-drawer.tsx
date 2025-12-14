"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useCart } from "../../lib/store";
import { useToast } from "../../hooks/use-toast";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
  Store,
  Clock,
  Percent,
  Package 
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { cart, updateQuantity, clearCart, getTotal, itemCount, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const { toast } = useToast();

  const totals = getTotal();

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    
    // Demo coupon logic
    if (couponCode.toUpperCase() === "FIRST50") {
      const discountAmount = Math.min(totals.subtotal * 0.5, 100);
      applyCoupon(couponCode.toUpperCase(), discountAmount);
      toast({
        title: "Coupon applied!",
        description: `You saved ${discountAmount.toFixed(2)}`,
      });
    } else if (couponCode.toUpperCase() === "FLAT100") {
      if (totals.subtotal >= 300) {
        applyCoupon(couponCode.toUpperCase(), 100);
        toast({
          title: "Coupon applied!",
          description: "You saved 100",
        });
      } else {
        toast({
          title: "Minimum order required",
          description: "Add items worth 300 to apply this coupon",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid coupon",
        description: "This coupon code is not valid",
        variant: "destructive",
      });
    }
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast({
      title: "Coupon removed",
    });
  };

  if (cart.items.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Your Cart</SheetTitle>
              {/* My Orders Button in Empty State */}
              <Button variant="outline" size="sm" asChild onClick={() => onOpenChange(false)}>
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-1" />
                  My Orders
                </Link>
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Looks like you haven&rsquo;t added anything to your cart yet. Browse restaurants and add some delicious food!
            </p>
            <Button onClick={() => onOpenChange(false)} data-testid="button-browse-restaurants">
              Browse Restaurants
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between gap-4">
            <span>Your Cart ({itemCount} items)</span>
             <div className="flex gap-2">
                {/* MY ORDERS BUTTON */}
                <Button variant="outline" size="sm" asChild onClick={() => onOpenChange(false)}>
                  <Link href="/orders">
                    <Package className="h-4 w-4 mr-1" />
                    My Orders
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-clear-cart"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
             </div>
          </SheetTitle>
        </SheetHeader>

        {/* Restaurant Info */}
        {cart.restaurant && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
            <Store className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{cart.restaurant.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {/* Hardcoded to 2 mins as requested */}
                2 mins delivery
              </p>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-3 border-b last:border-0"
                data-testid={`cart-item-${item.id}`}
              >
                {/* Veg/Non-veg indicator */}
                <div
                  className={cn(
                    "h-4 w-4 border-2 flex items-center justify-center rounded-sm flex-shrink-0 mt-1",
                    item.dish?.isVeg
                      ? "border-green-600"
                      : "border-red-600"
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      item.dish?.isVeg ? "bg-green-600" : "bg-red-600"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.dish?.name}</h4>
                  
                  {/* Customizations */}
                  {item.customizations && item.customizations.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.customizations
                        .flatMap((c) => c.selectedOptions.map((o) => o.name))
                        .join(", ")}
                    </p>
                  )}
                  
                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      &ldquo;{item.specialInstructions}&rdquo;
                    </p>
                  )}

                  <p className="font-semibold mt-1">
                    {Number(item.totalPrice).toFixed(2)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-primary/10 rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    data-testid={`button-decrease-${item.id}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    data-testid={`button-increase-${item.id}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Section */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Apply Coupon</span>
            </div>

            {cart.appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-green-600">{cart.appliedCoupon}</p>
                    <p className="text-xs text-green-600/80">You saved {cart.discount.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700"
                  data-testid="button-remove-coupon"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  data-testid="input-coupon"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  data-testid="button-apply-coupon"
                >
                  Apply
                </Button>
              </div>
            )}

            {/* Available Coupons */}
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Available coupons:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setCouponCode("FIRST50")}>
                  FIRST50 - 50% off (max 100)
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setCouponCode("FLAT100")}>
                  FLAT100 - 100 off on 300+
                </Badge>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bill Summary */}
        <div className="border-t pt-4 mt-4 space-y-2">
          <h4 className="font-semibold mb-3">Bill Details</h4>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item Total</span>
            <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span>{totals.deliveryFee === 0 ? "FREE" : totals.deliveryFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes & Charges</span>
            <span>{totals.taxes.toFixed(2)}</span>
          </div>

          {cart.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{cart.discount.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold">
            <span>To Pay</span>
            <span>{totals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button 
          className="w-full mt-4" 
          size="lg" 
          data-testid="button-checkout" 
          asChild 
          onClick={() => onOpenChange(false)}
        >
          <Link href="/checkout">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}