import { Check, Clock, ChefHat, Package, Truck, Home } from "lucide-react";
import { cn } from "../../lib/utils";
import type { OrderStatusType } from "../../shared/schema";

interface OrderTimelineProps {
  status: OrderStatusType;
  timestamps?: {
    createdAt?: string | null;
    acceptedAt?: string | null;
    preparingAt?: string | null;
    readyAt?: string | null;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
  };
}

const stages = [
  { status: "accepted", label: "Order Accepted", description: "Restaurant has accepted your order", icon: Check },
  { status: "preparing", label: "Preparing", description: "Your food is being prepared", icon: ChefHat },
  { status: "ready", label: "Ready for Pickup", description: "Order is ready for delivery partner", icon: Package },
  { status: "picked_up", label: "Picked Up", description: "Delivery partner has picked up your order", icon: Truck },
  { status: "delivered", label: "Delivered", description: "Order has been delivered", icon: Home },
];

const statusOrder: Record<string, number> = {
  pending: 0, accepted: 1, preparing: 2, ready: 3, picked_up: 4, on_the_way: 4, delivered: 5, cancelled: -1,
};

export function OrderTimeline({ status, timestamps }: OrderTimelineProps) {
  const currentStageIndex = statusOrder[status] || 0;
  const isFinal = status === 'delivered';

  const getTimestamp = (stageStatus: string) => {
    if (!timestamps) return null;
    switch (stageStatus) {
      case "accepted": return timestamps.acceptedAt;
      case "preparing": return timestamps.preparingAt;
      case "ready": return timestamps.readyAt;
      case "picked_up": return timestamps.pickedUpAt;
      case "delivered": return timestamps.deliveredAt;
      default: return null;
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  };

  if (status === "cancelled") {
    return <div className="p-6 bg-destructive/10 rounded-lg text-center"><p className="text-destructive font-semibold">Order Cancelled</p></div>;
  }

  return (
    <div className="space-y-4" data-testid="order-timeline">
      {stages.map((stage, index) => {
        const stageIndex = statusOrder[stage.status];
        const isCompleted = currentStageIndex > stageIndex;
        // Logic fix: Only show active animation if we haven't reached the final delivered state
        const isActive = currentStageIndex === stageIndex && !isFinal;
        
        const timestamp = getTimestamp(stage.status);
        const formattedTime = formatTime(timestamp ?? null);

        return (
          <div key={stage.status} className="flex gap-4">
            {/* Icon Column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                  // If completed OR if this specific stage is 'delivered' and the order is 'delivered'
                  isCompleted || (status === 'delivered' && stage.status === 'delivered')
                    ? "bg-green-600 border-green-600 text-white"
                    : isActive
                    ? "bg-primary border-primary text-primary-foreground animate-pulse"
                    : "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted || (status === 'delivered' && stage.status === 'delivered') ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <stage.icon className="h-5 w-5" />
                )}
              </div>

              {/* Connecting Line */}
              {index < stages.length - 1 && (
                <div className={cn("w-0.5 flex-1 min-h-8 mt-2", isCompleted ? "bg-green-600" : "bg-muted")} />
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn("font-medium", isCompleted || isActive || status === 'delivered' ? "text-foreground" : "text-muted-foreground")}>
                  {stage.label}
                </h4>
                {formattedTime && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formattedTime}
                  </span>
                )}
              </div>
              <p className={cn("text-sm", isActive ? "text-muted-foreground" : "text-muted-foreground/60")}>
                {stage.description}
              </p>

              {/* Active stage animation - HIDDEN if delivered */}
              {isActive && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs text-primary font-medium">In Progress</span>
                </div>
              )}
              
              {/* Show Completed text only on the final node */}
              {status === 'delivered' && stage.status === 'delivered' && (
                 <span className="text-xs text-green-600 font-medium block mt-1">Completed</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}