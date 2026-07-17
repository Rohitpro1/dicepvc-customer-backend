"use client";

import React from "react";
import { CloudUpload, Sparkles, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function HowItWorks() {
  return (
    <section className="py-xl bg-surface-container-low/50 border-y border-outline-variant/10">
      <div className="max-w-container-max mx-auto px-md">
        <div className="text-center mb-xl space-y-xs">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">3 Simple Steps to Print</h2>
          <p className="text-on-surface-variant text-body-md">Efficiency that saves you hours every day.</p>
        </div>
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-lg">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -z-10"></div>
          
          {/* Step 1 */}
          <div className="flex-1 space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-white glass-card flex items-center justify-center mx-auto relative border border-white/20">
              <CloudUpload className="w-8 h-8 text-primary" />
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary/10">1</span>
            </div>
            <h4 className="font-headline-sm font-semibold text-on-surface">Upload PDF</h4>
            <p className="text-on-surface-variant text-label-md max-w-xs mx-auto leading-normal">Drag & drop your Aadhaar PDFs. DicePVC handles the rest.</p>
          </div>
          
          {/* Step 2 */}
          <div className="flex-1 space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-white glass-card flex items-center justify-center mx-auto relative border border-white/20">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary/10">2</span>
            </div>
            <h4 className="font-headline-sm font-semibold text-on-surface">AI Processing</h4>
            <p className="text-on-surface-variant text-label-md max-w-xs mx-auto leading-normal">Cards are automatically cropped, cleaned, and enhanced.</p>
          </div>
          
          {/* Step 3 */}
          <div className="flex-1 space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-white glass-card flex items-center justify-center mx-auto relative border border-white/20">
              <Printer className="w-8 h-8 text-primary" />
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary/10">3</span>
            </div>
            <h4 className="font-headline-sm font-semibold text-on-surface">Direct Print</h4>
            <p className="text-on-surface-variant text-label-md max-w-xs mx-auto leading-normal">Send to any PVC printer with perfect edge-to-edge alignment.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
