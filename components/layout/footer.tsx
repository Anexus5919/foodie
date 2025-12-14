"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Instagram, 
  Linkedin,
  Github,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("🚀 Sending subscription request for:", email);
      
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      console.log("📥 Response status:", response.status);
      
      const data = await response.json();
      console.log("📦 Response data:", data);

      // Check if the response indicates success
      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.details || "Failed to subscribe");
      }
      
      toast({
        title: "Subscribed Successfully!",
        description: `A confirmation mail has been sent to ${email}`,
        action: <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-white" /></div>
      });
      setEmail("");
      
    } catch (error: any) {
      console.error("❌ Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not subscribe at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-card border-t mt-auto hidden md:block" data-testid="footer">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <Link href="/">
              <span className="text-2xl font-bold text-orange-500 cursor-pointer">
                Foodie
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover the best food & drinks in your city. Order from your favorite 
              restaurants and get it delivered to your doorstep.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="icon" className="hover:text-blue-700 hover:border-blue-700 transition-colors" asChild>
                <a href="https://www.linkedin.com/in/anexus/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </Button>
              <Button variant="outline" size="icon" className="hover:text-black hover:border-black transition-colors" asChild>
                <a href="https://github.com/Anexus5919" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button variant="outline" size="icon" className="hover:text-pink-600 hover:border-pink-600 transition-colors" asChild>
                <a href="https://www.instagram.com/anexus5919/?next=%2F" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                About Us
              </Link>
              <Link href="/partner" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Partner with Us
              </Link>
              <Link href="/delivery-partner" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Become a Delivery Partner
              </Link>
              <Link href="/careers" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Careers
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Blog
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Privacy Policy
              </Link>
              <Link href="/refund" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Refund Policy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-orange-500 transition-colors w-fit">
                Cookie Policy
              </Link>
            </nav>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                123 Food Street, Bangalore, India
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-orange-500 flex-shrink-0" />
                +91 1234567890
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-orange-500 flex-shrink-0" />
                support@foodie.com
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm">Subscribe to our newsletter</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Foodie. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Made with love in India ❤️</span>
          </div>
        </div>
      </div>
    </footer>
  );
}