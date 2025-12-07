import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useCart } from "../../lib/store";
import { useToast } from "../../hooks/use-toast";
import type { Dish, Restaurant, SelectedCustomization, DishCustomization } from "../../shared/schema";
import { Star, Plus, Minus, Flame, Award, Sparkles, Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../../components/ui/skeleton";

interface DishCardProps {
  dish: Dish;
  restaurant: Restaurant;
}

export function DishCard({ dish, restaurant }: DishCardProps) {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const { addItem, cart } = useCart();
  const { toast } = useToast();

  const customizations = dish.customizations as DishCustomization[] | null;
  const hasCustomizations = customizations && customizations.length > 0;

  const calculateTotalPrice = () => {
    let total = Number(dish.price);
    selectedCustomizations.forEach((customization) => {
      customization.selectedOptions.forEach((option: { price: number }) => {
        total += option.price;
      });
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    // Check if adding from a different restaurant
    if (cart.restaurantId && cart.restaurantId !== restaurant.id) {
      toast({
        title: "Clear cart?",
        description: "Your cart contains items from another restaurant. Clear it to add this item.",
        variant: "destructive",
      });
      return;
    }

    if (hasCustomizations) {
      setIsCustomizeOpen(true);
      return;
    }

    addItemToCart();
  };

  const addItemToCart = () => {
    const totalPrice = calculateTotalPrice();
    
    addItem({
      id: `${dish.id}-${Date.now()}`,
      userId: "",
      dishId: dish.id,
      restaurantId: restaurant.id,
      quantity,
      customizations: selectedCustomizations,
      specialInstructions: specialInstructions || null,
      unitPrice: String(totalPrice / quantity),
      totalPrice: String(totalPrice),
      dish,
      restaurant,
    });

    toast({
      title: "Added to cart",
      description: `${quantity}x ${dish.name} added`,
    });

    // Reset state
    setIsCustomizeOpen(false);
    setQuantity(1);
    setSelectedCustomizations([]);
    setSpecialInstructions("");
  };

  const handleCustomizationChange = (
    customizationName: string,
    optionName: string,
    optionPrice: number,
    isMultiSelect: boolean
  ) => {
    setSelectedCustomizations((prev) => {
      const existingIndex = prev.findIndex((c) => c.name === customizationName);
      
      if (existingIndex === -1) {
        // Add new customization
        return [
          ...prev,
          {
            name: customizationName,
            selectedOptions: [{ name: optionName, price: optionPrice }],
          },
        ];
      }

      const updated = [...prev];
      const existing = updated[existingIndex];

      if (isMultiSelect) {
        // Toggle option in multi-select
        const optionExists = existing.selectedOptions.some(
          (o: { name: string; price: number }) => o.name === optionName
        );
        if (optionExists) {
          existing.selectedOptions = existing.selectedOptions.filter(
            (o: { name: string; price: number }) => o.name !== optionName
          );
          if (existing.selectedOptions.length === 0) {
            updated.splice(existingIndex, 1);
          }
        } else {
          existing.selectedOptions.push({ name: optionName, price: optionPrice });
        }
      } else {
        // Single select - replace
        existing.selectedOptions = [{ name: optionName, price: optionPrice }];
      }

      return updated;
    });
  };

  const isOptionSelected = (customizationName: string, optionName: string) => {
    const customization = selectedCustomizations.find(
      (c) => c.name === customizationName
    );
    return customization?.selectedOptions.some(
      (o: { name: string; price: number }) => o.name === optionName
    ) || false;
  };

  // Spice level indicators
  const spiceLevelColors = ["text-green-500", "text-yellow-500", "text-orange-500", "text-red-500", "text-red-700"];

  return (
    <>
      <div
        className="flex gap-4 py-4 border-b last:border-0"
        data-testid={`dish-card-${dish.id}`}
      >
        {/* Dish Info */}
        <div className="flex-1 min-w-0">
          {/* Veg/Non-veg indicator */}
          <div className="flex items-start gap-2 mb-2">
            <div
              className={cn(
                "h-4 w-4 border-2 flex items-center justify-center rounded-sm flex-shrink-0 mt-0.5",
                dish.isVeg ? "border-green-600" : "border-red-600"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  dish.isVeg ? "bg-green-600" : "bg-red-600"
                )}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {dish.isBestseller && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Award className="h-3 w-3 mr-1" />
                  Bestseller
                </Badge>
              )}
              {dish.isNew && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
              {dish.isChefSpecial && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Chef&rsquo;s Special
                </Badge>
              )}
              {dish.isHealthy && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Heart className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-base mb-1">{dish.name}</h3>

          {/* Price */}
          <p className="font-bold mb-2">{Number(dish.price).toFixed(2)}</p>

          {/* Rating */}
          {Number(dish.rating) > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-green-600">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-semibold">
                  {Number(dish.rating).toFixed(1)}
                </span>
              </div>
              {dish.reviewCount && dish.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({dish.reviewCount} reviews)
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {dish.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {dish.description}
            </p>
          )}

          {/* Spice Level */}
          {dish.spiceLevel && dish.spiceLevel > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: dish.spiceLevel }).map((_, i) => (
                <Flame
                  key={i}
                  className={cn("h-3.5 w-3.5", spiceLevelColors[Math.min(i, 4)])}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {dish.spiceLevel <= 2 ? "Mild" : dish.spiceLevel <= 3 ? "Medium" : "Spicy"}
              </span>
            </div>
          )}

          {/* Customizable indicator */}
          {hasCustomizations && (
            <p className="text-xs text-muted-foreground mt-2">Customizable</p>
          )}
        </div>

        {/* Dish Image & Add Button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-muted">
            {dish.imageUrl ? (
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-2xl font-bold text-primary/30">
                  {dish.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant={dish.isAvailable ? "outline" : "secondary"}
            className="w-28"
            onClick={handleAddToCart}
            disabled={!dish.isAvailable}
            data-testid={`button-add-${dish.id}`}
          >
            {dish.isAvailable ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            ) : (
              "Unavailable"
            )}
          </Button>
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dish.name}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-4">
              {customizations?.map((customization, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{customization.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {customization.required ? "Required" : "Optional"}
                        {customization.maxSelections > 1 &&
                          ` • Select up to ${customization.maxSelections}`}
                      </p>
                    </div>
                  </div>

                  {customization.maxSelections === 1 ? (
                    <RadioGroup
                      value={
                        selectedCustomizations
                          .find((c) => c.name === customization.name)
                          ?.selectedOptions[0]?.name || ""
                      }
                      onValueChange={(value) => {
                        const option = customization.options.find(
                          (o: { name: string; price: number }) => o.name === value
                        );
                        if (option) {
                          handleCustomizationChange(
                            customization.name,
                            option.name,
                            option.price,
                            false
                          );
                        }
                      }}
                    >
                      {customization.options.map((option: { name: string; price: number }) => (
                        <div
                          key={option.name}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option.name}
                              id={`${customization.name}-${option.name}`}
                            />
                            <Label htmlFor={`${customization.name}-${option.name}`}>
                              {option.name}
                            </Label>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm">+{option.price}</span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {customization.options.map((option: { name: string; price: number }) => (
                        <div
                          key={option.name}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${customization.name}-${option.name}`}
                              checked={isOptionSelected(
                                customization.name,
                                option.name
                              )}
                              onCheckedChange={() =>
                                handleCustomizationChange(
                                  customization.name,
                                  option.name,
                                  option.price,
                                  true
                                )
                              }
                            />
                            <Label htmlFor={`${customization.name}-${option.name}`}>
                              {option.name}
                            </Label>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm">+{option.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {idx < customizations.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {/* Special Instructions */}
              <div>
                <Label htmlFor="instructions" className="font-semibold">
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="E.g., No onions, extra spicy..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="mt-2"
                  data-testid="input-special-instructions"
                />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          {/* Quantity & Add to Cart */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 bg-muted rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                data-testid="button-decrease-quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
                data-testid="button-increase-quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={addItemToCart} data-testid="button-add-to-cart-modal">
              Add to Cart • {calculateTotalPrice().toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Skeleton loader
export function DishCardSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b">
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="w-28 h-24 rounded-lg" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}