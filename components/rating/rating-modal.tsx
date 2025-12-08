"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import { Star, Upload, X, Loader2, Store, Bike, Utensils } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any; // Using any here for flexibility with the mixed schema types
  onSubmit: (data: any) => Promise<void>;
}

export function RatingModal({
  open,
  onOpenChange,
  order,
  onSubmit,
}: RatingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // State for ratings
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [dishRatings, setDishRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (restaurantRating === 0 && deliveryRating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate the restaurant or delivery partner",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        orderId: order.id,
        restaurantRating,
        deliveryRating,
        dishRatings,
        comment,
      });
      toast({
        title: "Reviews submitted!",
        description: "Thank you for your feedback",
      });
      onOpenChange(false);
    } catch {
      toast({
        title: "Failed to submit",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    size = "md" 
  }: { 
    value: number; 
    onChange: (v: number) => void;
    size?: "sm" | "md" | "lg"
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
          type="button"
        >
          <Star 
            className={cn(
              "transition-colors",
              size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6",
              star <= value 
                ? "text-yellow-500 fill-yellow-500" // Yellow when rated
                : "text-muted-foreground/30 fill-none"
            )} 
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-muted-foreground w-8">
        {value > 0 ? `${value}/5` : ""}
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate your Order</DialogTitle>
          <DialogDescription>
            Order #{order.id.slice(0, 8)} from {order.restaurant?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="restaurant" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="dishes">Dishes</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          {/* 1. Restaurant Rating */}
          <TabsContent value="restaurant" className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4 bg-muted/20 p-6 rounded-xl border border-dashed">
              <Store className="h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold text-lg">How was {order.restaurant?.name}?</h3>
              <StarRating value={restaurantRating} onChange={setRestaurantRating} size="lg" />
            </div>
            
            <div className="space-y-2">
              <Label>Share your experience</Label>
              <Textarea 
                placeholder="Was the packaging good? How was the taste?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* 2. Dish Ratings */}
          <TabsContent value="dishes" className="space-y-4 py-4">
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.dishName}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                  </div>
                  <StarRating 
                    value={dishRatings[item.dishId] || 0} 
                    onChange={(v) => setDishRatings(prev => ({ ...prev, [item.dishId]: v }))}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 3. Delivery Rating */}
          <TabsContent value="delivery" className="space-y-6 py-4">
             <div className="flex flex-col items-center justify-center space-y-4 bg-muted/20 p-6 rounded-xl border border-dashed">
              <Bike className="h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Rate the Delivery</h3>
              <p className="text-xs text-muted-foreground -mt-2">Did the partner arrive on time?</p>
              <StarRating value={deliveryRating} onChange={setDeliveryRating} size="lg" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Reviews"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}