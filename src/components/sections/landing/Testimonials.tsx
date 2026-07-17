"use client";

import React from "react";
import { Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function Testimonials() {
  return (
    <section className="py-xl bg-white border-y border-outline-variant/10" id="testimonials">
      <div className="max-w-container-max mx-auto px-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
          <div className="space-y-md">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg font-bold leading-tight text-on-surface">
              What Printing Professionals Say
            </h2>
            <p className="text-on-surface-variant text-body-lg">
              Used by government CSC operators, photo studios, and commercial printers in 28 states.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-300 shadow-sm" />
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-400 shadow-sm" />
              </div>
              <span className="font-label-md font-bold text-on-surface">4.9/5 from 12k hub owners</span>
            </div>
          </div>
          <div className="space-y-md">
            <Card className="p-md rounded-2xl relative shadow-sm border border-white/20" animateHover>
              <Quote className="w-16 h-16 text-primary/10 absolute top-4 right-4" />
              <p className="text-body-md italic mb-4 text-on-surface-variant relative z-10 leading-relaxed">
                "DicePVC transformed my workflow. We used to manually crop every Aadhaar card, which took minutes per card. Now, we process 100 cards in seconds. The print quality is unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">RK</div>
                <div>
                  <p className="font-label-md font-bold text-on-surface">Rajesh Kumar</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">CSC Hub Owner, Lucknow</p>
                </div>
              </div>
            </Card>
            <Card className="p-md rounded-2xl relative shadow-sm translate-x-4 border border-white/20 bg-white/50" animateHover>
              <p className="text-body-md italic mb-4 text-on-surface-variant relative z-10 leading-relaxed">
                "The 5th Gen support is amazing. It makes the cards look exactly like the original high-security ones. My customers are much happier with the professional look."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">AS</div>
                <div>
                  <p className="font-label-md font-bold text-on-surface">Ananya Sharma</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Digital Photo Studio, Pune</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
