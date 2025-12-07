import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import type { Address } from "../../shared/schema";
import { MapPin, Home, Briefcase, MapPinned, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLocation } from "../../lib/store";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddAddress: (address: Omit<Address, "id">) => Promise<void>;
}

const addressIcons: Record<string, typeof Home> = {
  home: Home,
  work: Briefcase,
  other: MapPinned,
};

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddAddress,
}: AddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { location, requestLocation } = useLocation();
  
  // Form state
  const [label, setLabel] = useState<"home" | "work" | "other">("home");
  const [fullAddress, setFullAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const handleAddAddress = async () => {
    if (!fullAddress.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddAddress({
        userId: "", // Will be set by backend
        label,
        fullAddress,
        landmark: landmark || null,
        latitude: location.latitude ? String(location.latitude) : null,
        longitude: location.longitude ? String(location.longitude) : null,
        isDefault: addresses.length === 0,
      });
      setIsAddingNew(false);
      setFullAddress("");
      setLandmark("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const useCurrentLocation = async () => {
    await requestLocation();
    if (location.fullAddress) {
      setFullAddress(location.fullAddress);
    }
  };

  if (addresses.length === 0 && !isAddingNew) {
    return (
      <div className="text-center py-8" data-testid="no-addresses">
        <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No saved addresses</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add a delivery address to continue
        </p>
        <Button onClick={() => setIsAddingNew(true)} data-testid="button-add-first-address">
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="address-selector">
      <RadioGroup value={selectedId || ""} onValueChange={onSelect}>
        {addresses.map((address) => {
          const Icon = addressIcons[address.label.toLowerCase()] || MapPinned;
          
          return (
            <label
              key={address.id}
              htmlFor={address.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                selectedId === address.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover-elevate"
              )}
            >
              <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
              
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">{address.label}</span>
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {address.fullAddress}
                </p>
                {address.landmark && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Landmark: {address.landmark}
                  </p>
                )}
              </div>

              {selectedId === address.id && (
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </label>
          );
        })}
      </RadioGroup>

      {/* Add New Address */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" data-testid="button-add-address">
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Address Type */}
            <div className="space-y-2">
              <Label>Save as</Label>
              <div className="flex gap-2">
                {(["home", "work", "other"] as const).map((type) => {
                  const Icon = addressIcons[type];
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant={label === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLabel(type)}
                      data-testid={`address-type-${type}`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      <span className="capitalize">{type}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Use Current Location */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={useCurrentLocation}
              data-testid="button-use-current-location"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>

            {/* Full Address */}
            <div className="space-y-2">
              <Label htmlFor="fullAddress">Complete Address *</Label>
              <Textarea
                id="fullAddress"
                placeholder="House/Flat no., Building, Street, Area..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="min-h-20"
                data-testid="input-full-address"
              />
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Near by landmark..."
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                data-testid="input-landmark"
              />
            </div>
          </div>

          <Button
            onClick={handleAddAddress}
            className="w-full"
            disabled={!fullAddress.trim() || isSubmitting}
            data-testid="button-save-address"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Address"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}