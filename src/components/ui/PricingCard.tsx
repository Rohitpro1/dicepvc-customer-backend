"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Card } from "./Card";

export interface PricingCardProps {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  features: Array<{ text: string; included: boolean }>;
  isRecommended?: boolean;
  ctaText: string;
  onCtaClick?: () => void;
  className?: string;
  floating?: boolean;
}

export function PricingCard({
  name,
  subtitle,
  price,
  period,
  features,
  isRecommended = false,
  ctaText,
  onCtaClick,
  className,
  floating = false,
}: PricingCardProps) {
  return (
    <Card
      floating={floating}
      animateHover
      className={cn(
        "flex flex-col p-md border transition-all h-full space-y-6 bg-surface-container-lowest/50 rounded-[32px] overflow-visible",
        isRecommended && "border-2 border-primary bg-primary/5 shadow-2xl relative transform scale-105 z-10",
        className
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
          Recommended
        </div>
      )}

      <div>
        <span className={cn(
          "text-label-sm font-bold uppercase tracking-widest block mb-xs",
          isRecommended ? "text-primary" : "text-on-surface-variant"
        )}>
          {name}
        </span>
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{name}</h3>
        <p className="text-on-surface-variant text-label-md">{subtitle}</p>
        <div className="flex items-baseline gap-xs mt-md">
          <span className="text-headline-md font-bold text-primary">{price}</span>
          <span className="text-on-surface-variant text-label-md">{period}</span>
        </div>
      </div>

      <ul className="space-y-sm flex-1 font-label-md text-on-surface-variant">
        {features.map((feat, idx) => (
          <li 
            key={idx} 
            className={cn(
              "flex items-start gap-base text-body-md",
              !feat.included && "text-on-surface-variant/40"
            )}
          >
            {feat.included ? (
              <Check className="text-secondary w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{feat.text}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isRecommended ? "primary" : "outline"}
        className={cn("w-full shadow-md", isRecommended && "shadow-primary/20")}
        onClick={onCtaClick}
        disabled={ctaText === "Current Plan"}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
