"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Unlock, Layers, ShieldCheck, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function Features() {
  return (
    <section className="py-xl max-w-container-max mx-auto px-md" id="features">
      <div className="text-center mb-xl space-y-xs">
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Engineered for Perfection</h2>
        <p className="text-on-surface-variant text-body-md max-w-xl mx-auto">
          Proprietary AI engines and workflow optimizations designed to make card generation 10x faster.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Feature 1: AI OCR */}
        <Card className="space-y-4 border border-white/20" animateHover>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 fill-primary/10" />
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">Advanced AI OCR</h3>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Instantly extract data from PDF scans with 99.9% accuracy, even from low-resolution files.
          </p>
        </Card>

        {/* Feature 2: PDF Unlocking */}
        <Card className="space-y-4 border border-white/20" animateHover>
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
            <Unlock className="w-6 h-6" />
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">Auto-Unlock</h3>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Proprietary logic to automatically handle password-protected Aadhaar PDFs without manual input.
          </p>
        </Card>

        {/* Feature 3: Bulk Processing */}
        <Card className="space-y-4 border border-white/20" animateHover>
          <div className="w-12 h-12 bg-tertiary/10 text-on-surface-variant rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">Massive Bulk Action</h3>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Process up to 500 cards in a single batch. Optimized for high-volume CSC centers.
          </p>
        </Card>

        {/* Feature 4: 5th Gen Support (Wide Card) */}
        <Card className="md:col-span-2 flex flex-col md:flex-row gap-md items-center border border-white/20" animateHover>
          <div className="space-y-4 flex-1">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 fill-primary/10" />
            </div>
            <h3 className="font-headline-sm font-bold text-on-surface">5th Gen Security Standards</h3>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              The only software in India that supports the latest 5th generation security hologram and QR layouts with perfect color calibration.
            </p>
          </div>
          <div className="w-full md:w-1/2 aspect-video rounded-xl bg-slate-100 overflow-hidden shadow-inner relative group">
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRxHras8T5u45sMrkccwGznGzVPSvjfFojIYjMYo8OgptUMEuGYzZpn6UsteTAnS9Z9JNgB-F4tQNOiQB3JVaj3BqCozBkv88SWIZqknlcRzT7kcXEO8a-Vk7QQFCIthtEastgXrUoKDjxbJ5d9svtGAxiVN_yhBeXvZdWSQE4hXcnIAlO7a672QHWnuLEzmknyGvFhqmKo0K86s4szN-BPqeTvqE0VP8w5aGvo7G2WjGKwU27BsGl')" 
              }}
            ></div>
          </div>
        </Card>

        {/* Feature 5: Printer Sync */}
        <Card className="space-y-4 border border-white/20" animateHover>
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
            <Printer className="w-6 h-6" />
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">Universal Print</h3>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            One-click printing for all leading PVC printer brands. No external drivers required.
          </p>
        </Card>
      </div>
    </section>
  );
}
