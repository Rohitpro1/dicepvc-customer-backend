"use client";

import React, { useState } from "react";
import { Edit2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminPricingPanel() {
  const [basePrice, setBasePrice] = useState("4,999.00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend admin pricing endpoint when available
  };

  return (
    <Card className="md:col-span-4 flex flex-col justify-between" animateHover>
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-md">Quick Pricing</h3>
      <form onSubmit={handleSubmit} className="space-y-md flex-1 flex flex-col justify-between">
        <div className="space-y-md">
          <div className="space-y-xs">
            <label className="font-label-sm text-on-surface-variant uppercase font-semibold">Enterprise Base Price</label>
            <div className="flex items-center gap-sm">
              <span className="text-on-surface-variant font-bold">$</span>
              <input 
                className="flex-1 bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-headline-sm font-extrabold outline-none transition-all text-on-surface" 
                type="text" 
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-xs">
            <label className="font-label-sm text-on-surface-variant uppercase font-semibold">Active Promo Coupon</label>
            <div className="p-sm bg-surface-container/50 rounded-xl flex justify-between items-center border border-outline-variant/10">
              <code className="font-bold text-primary font-mono text-body-md">DICE_SUMMER_24</code>
              <Button variant="ghost" size="icon" className="text-primary w-8 h-8 hover:bg-primary/10">
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-md space-y-base pt-md border-t border-outline-variant/10">
          <div className="flex justify-between font-label-md">
            <span className="text-on-surface-variant font-semibold">Global Markup</span>
            <span className="font-bold text-secondary">+15%</span>
          </div>
          <Button className="w-full" type="submit">Apply Changes</Button>
        </div>
      </form>
    </Card>
  );
}
