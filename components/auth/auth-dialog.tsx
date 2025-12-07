"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../lib/store";
import { signInWithGoogle, isFirebaseConfigured } from "../../lib/firebase";
import { apiRequest } from "../../lib/queryClient";
import { Loader2, Mail, Phone } from "lucide-react";
import { SiGoogle } from "react-icons/si";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "signup" | "phone">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { setUser } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured()) {
      // Demo mode - create a demo user
      const demoUser = {
        id: "demo-user-" + Date.now(),
        email: "demo@foodie.com",
        name: "Demo User",
        phone: null,
        role: "customer",
        avatarUrl: null,
        firebaseUid: null,
      };
      setUser(demoUser);
      toast({
        title: "Demo Mode",
        description: "Signed in as a demo user. Configure Firebase for full authentication.",
      });
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        // Create or get user from backend
        const response = await apiRequest("POST", "/api/auth/google", {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "User",
          avatarUrl: firebaseUser.photoURL,
        });
        const user = await response.json();
        setUser(user);
        toast({
          title: "Welcome!",
          description: `Signed in as ${user.name}`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "signup" 
        ? { email, password, name, role: "customer" }
        : { email, password };
      
      const response = await apiRequest("POST", endpoint, payload);
      const user = await response.json();
      setUser(user);
      toast({
        title: mode === "signup" ? "Account created!" : "Welcome back!",
        description: `Signed in as ${user.name}`,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Please check your credentials and try again";
      toast({
        title: mode === "signup" ? "Registration failed" : "Login failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create an account"}
            {mode === "phone" && "Login with phone"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" && "Sign in to your account to continue"}
            {mode === "signup" && "Join Foodie to order your favorite food"}
            {mode === "phone" && "We'll send you a verification code"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            data-testid="button-google-signin"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SiGoogle className="h-4 w-4 mr-2" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          {(mode === "login" || mode === "signup") && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-auth"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          )}

          {/* Phone Login */}
          {mode === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    value="+91"
                    disabled
                    className="w-16"
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={isLoading || phone.length < 10}
                data-testid="button-send-otp"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send OTP
              </Button>
            </div>
          )}

          {/* Mode Switchers */}
          <div className="flex flex-col gap-2 pt-4">
            {mode !== "phone" && (
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setMode("phone")}
                data-testid="button-switch-phone"
              >
                <Phone className="h-4 w-4 mr-2" />
                Login with Phone instead
              </Button>
            )}
            
            {mode === "phone" && (
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setMode("login")}
                data-testid="button-switch-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Login with Email instead
              </Button>
            )}

            <Separator />

            {mode === "login" ? (
              <p className="text-center text-sm text-muted-foreground">
                Don&rsquo;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                  data-testid="button-switch-signup"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                  data-testid="button-switch-login"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}