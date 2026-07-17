"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-container-max rounded-full border border-white/20 backdrop-blur-xl bg-white/70 shadow-xl shadow-black/5 z-50 flex justify-between items-center px-8 py-3">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary fill-primary/10" />
        <span className="font-headline-sm text-headline-sm font-bold text-primary">DicePVC</span>
      </div>
      <div className="hidden md:flex items-center gap-8 font-body-md text-body-md text-on-surface-variant font-medium">
        <a className="hover:text-primary transition-colors" href="#features">Features</a>
        <a className="hover:text-primary transition-colors" href="#pricing">Pricing</a>
        <a className="hover:text-primary transition-colors" href="#testimonials">Testimonials</a>
        <a className="hover:text-primary transition-colors" href="#faq">FAQ</a>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="hidden sm:block">Login</Button>
        </Link>
        <Link href="/login">
          <Button variant="primary" size="sm" className="px-6 rounded-full">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
}
