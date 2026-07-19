"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  CreditCard, 
  Layers, 
  Wallet, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Plus,
  TrendingUp,
  Users,
  Terminal,
  Receipt,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SidebarProps {
  mode?: "customer" | "admin";
}

export default function Sidebar({ mode = "customer" }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === "#") return false;
    return pathname === path;
  };

  const customerLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/orders", icon: CreditCard },
    { label: "Subscriptions", href: "/billing", icon: Layers },
    { label: "Wallets", href: "/wallet", icon: Wallet },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const adminLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Software", href: "/admin/software", icon: Terminal },
    { label: "Plans", href: "/billing", icon: Receipt },
    { label: "Support", href: "/admin/support", icon: Headphones },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const currentLinks = mode === "admin" ? adminLinks : customerLinks;

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low/50 backdrop-blur-lg border-r border-outline-variant/20 p-md space-y-base z-30">
      {/* Brand Logo */}
      <div className="flex items-center gap-sm px-base mb-lg">
        <Link href="/" className="flex items-center gap-sm hover:opacity-85 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">DicePVC AI</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant font-medium opacity-70">
              {mode === "admin" ? "Super Admin" : "Premium Enterprise"}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-xs" aria-label="Main Navigation">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          const active = isLinkActive(link.href);
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-sm px-md py-sm rounded-xl transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-white/10"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : "stroke-[2px]"}`} aria-hidden="true" />
              <span className="font-label-md text-label-md">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <Button className="w-full flex items-center justify-center gap-xs py-sm">
        <Plus className="w-4 h-4" />
        New PVC Request
      </Button>

      {/* Footer Nav */}
      <div className="pt-base border-t border-outline-variant/20 space-y-xs">
        <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-white/10 transition-all rounded-xl cursor-pointer">
          <HelpCircle className="w-5 h-5" />
          <span className="font-label-md text-label-md">Support</span>
        </a>
        <Link
          href="/login"
          className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-white/10 transition-all rounded-xl text-error font-medium hover:text-error"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-label-md text-label-md">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
