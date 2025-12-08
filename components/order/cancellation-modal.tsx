"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isCancelling: boolean;
}

const REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Taking too long",
  "Found a better price",
  "Other"
];

export function CancellationModal({ open, onOpenChange, onConfirm, isCancelling }: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  const handleConfirm = () => {
    const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
    if (finalReason) {
      onConfirm(finalReason);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            Please select a reason for cancellation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {REASONS.map((reason) => (
            <div key={reason} className="flex items-center space-x-2">
              <Checkbox 
                id={reason} 
                checked={selectedReason === reason}
                onCheckedChange={() => setSelectedReason(reason)}
              />
              <Label htmlFor={reason} className="cursor-pointer w-full" onClick={() => setSelectedReason(reason)}>
                {reason}
              </Label>
            </div>
          ))}

          {selectedReason === "Other" && (
            <Textarea
              placeholder="Please tell us the reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCancelling}>
            Keep Order
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!selectedReason || (selectedReason === "Other" && !otherReason.trim()) || isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}