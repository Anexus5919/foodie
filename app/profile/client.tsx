"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/store";
import { useTheme } from "../../lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { MapPin, Phone, Mail, LogOut, Trash2, Plus, Moon, Sun, Loader2 } from "lucide-react";
import type { Address } from "../../shared/schema";

export default function ProfileClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", fullAddress: "", landmark: "" });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, authLoading, router]);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/addresses?userId=${user?.id}`);
      return res.json();
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/addresses/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address deleted" });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/addresses", { ...newAddress, userId: user?.id, isDefault: addresses.length === 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddressModalOpen(false);
      setNewAddress({ label: "Home", fullAddress: "", landmark: "" });
      toast({ title: "Address added successfully" });
    },
  });

  const handleLogout = () => {
    setUser(null);
    router.push("/");
    toast({ title: "Logged out successfully" });
  };

  if (authLoading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="text-2xl bg-orange-100 text-orange-600">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{user.email}</span></div>
            {user.phone && <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{user.phone}</span></div>}
            <Separator className="my-4" />
            <Button variant="destructive" className="w-full" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved Addresses</CardTitle>
              <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add New</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Address</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Label</Label><Input value={newAddress.label} onChange={(e) => setNewAddress({...newAddress, label: e.target.value})} placeholder="Home, Work..." /></div>
                    <div className="space-y-2"><Label>Address</Label><Textarea value={newAddress.fullAddress} onChange={(e) => setNewAddress({...newAddress, fullAddress: e.target.value})} placeholder="Full address" /></div>
                    <Button className="w-full" onClick={() => addAddressMutation.mutate()} disabled={!newAddress.fullAddress}>Save Address</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? <p className="text-center text-muted-foreground py-8">No addresses saved.</p> : addresses.map((addr) => (
                <div key={addr.id} className="flex justify-between p-4 border rounded-lg">
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-1" />
                    <div><p className="font-semibold capitalize">{addr.label}</p><p className="text-sm text-muted-foreground">{addr.fullAddress}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAddressMutation.mutate(addr.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}