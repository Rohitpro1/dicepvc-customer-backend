"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CreditCard, 
  Plus, 
  Layers, 
  Sliders 
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === "#") return false;
    return pathname === path;
  };

  const navItems = [
    { label: "Dash", href: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/orders", icon: CreditCard },
    { label: "Add", href: "#", icon: Plus, isMiddleButton: true },
    { label: "Wallet", href: "/wallet", icon: Layers },
    { label: "Admin", href: "/admin", icon: Sliders },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-t border-outline-variant/20 flex justify-around items-center px-md z-30" aria-label="Mobile Navigation">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        
        if (item.isMiddleButton) {
          return (
            <div key={idx} className="relative -top-6">
              <button 
                className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary-container active:scale-95 transition-transform cursor-pointer"
                aria-label="New PVC Request"
                type="button"
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          );
        }

        const active = isLinkActive(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              active ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
