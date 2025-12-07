import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { 
  CreditCard, 
  Wallet, 
  Banknote,
  Smartphone,
  Shield,
  Check,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type PaymentMethod = "upi" | "card" | "wallet" | "cod";

interface PaymentOptionsProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  upiId?: string;
  onUpiIdChange?: (id: string) => void;
}

const paymentMethods = [
  {
    id: "upi" as const,
    name: "UPI",
    description: "Pay using any UPI app",
    icon: Smartphone,
    popular: true,
    apps: ["GPay", "PhonePe", "Paytm", "BHIM"],
  },
  {
    id: "card" as const,
    name: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay",
    icon: CreditCard,
    popular: false,
  },
  {
    id: "wallet" as const,
    name: "Wallet",
    description: "Paytm, PhonePe, Amazon Pay",
    icon: Wallet,
    popular: false,
  },
  {
    id: "cod" as const,
    name: "Cash on Delivery",
    description: "Pay when you receive",
    icon: Banknote,
    popular: false,
  },
];

export function PaymentOptions({
  selectedMethod,
  onMethodChange,
  upiId = "",
  onUpiIdChange,
}: PaymentOptionsProps) {
  const [showUpiInput, setShowUpiInput] = useState(false);

  const handleMethodChange = (method: PaymentMethod) => {
    onMethodChange(method);
    if (method === "upi") {
      setShowUpiInput(true);
    } else {
      setShowUpiInput(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="payment-options">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-green-600" />
        <span className="text-sm text-muted-foreground">
          100% secure payments
        </span>
      </div>

      <RadioGroup
        value={selectedMethod}
        onValueChange={(v) => handleMethodChange(v as PaymentMethod)}
      >
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <label
              htmlFor={method.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                selectedMethod === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover-elevate"
              )}
            >
              <RadioGroupItem value={method.id} id={method.id} />
              
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <method.icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.name}</span>
                  {method.popular && (
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>

              {selectedMethod === method.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </label>

            {/* UPI Input */}
            {method.id === "upi" && selectedMethod === "upi" && showUpiInput && (
              <div className="mt-3 ml-14 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => onUpiIdChange?.(e.target.value)}
                    data-testid="input-upi-id"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {method.apps?.map((app) => (
                    <Badge
                      key={app}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                    >
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Card Input (simplified for demo) */}
            {method.id === "card" && selectedMethod === "card" && (
              <div className="mt-3 ml-14 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    data-testid="input-card-number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      data-testid="input-card-expiry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      data-testid="input-card-cvv"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Selection */}
            {method.id === "wallet" && selectedMethod === "wallet" && (
              <div className="mt-3 ml-14">
                <div className="grid grid-cols-3 gap-2">
                  {["Paytm", "PhonePe", "Amazon Pay"].map((wallet) => (
                    <button
                      key={wallet}
                      className="p-3 rounded-lg border hover-elevate text-center text-sm"
                      data-testid={`wallet-${wallet.toLowerCase().replace(" ", "-")}`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COD Info */}
            {method.id === "cod" && selectedMethod === "cod" && (
              <div className="mt-3 ml-14 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Please keep exact change ready for faster delivery
                </p>
              </div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}