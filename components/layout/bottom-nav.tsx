"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Package, User } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/orders", icon: Package, label: "Orders" },
  { href: "/profile", icon: User, label: "Account" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on restaurant or delivery partner dashboards
  // Ensure pathname is not null before checking
  if (pathname?.startsWith("/restaurant/") || pathname?.startsWith("/delivery/")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname?.startsWith(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                <span className="text-xs font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}