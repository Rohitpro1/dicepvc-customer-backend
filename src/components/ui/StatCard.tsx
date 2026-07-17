"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { useCounter } from "@/hooks/useCounter";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  footerText?: string;
  progress?: number;
  borderLeftColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendType = "neutral",
  footerText,
  progress,
  borderLeftColor,
  className,
  children,
}: StatCardProps) {
  // Automatically animate if it's a number
  const animatedValue = typeof value === "number" ? useCounter(value) : value;

  return (
    <Card 
      className={cn(
        "flex flex-col gap-sm p-md",
        borderLeftColor && `border-l-4 border-l-${borderLeftColor}`,
        className
      )}
      animateHover
    >
      <div className="flex justify-between items-start">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold">
          {label}
        </p>
        {trend && (
          <span 
            className={cn(
              "font-label-sm font-semibold",
              trendType === "positive" && "text-secondary",
              trendType === "negative" && "text-error",
              trendType === "neutral" && "text-on-surface-variant"
            )}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mt-xs">
        <p className="font-headline-sm text-headline-sm font-extrabold text-on-surface leading-none">
          {typeof value === "number" ? animatedValue.toLocaleString() : value}
        </p>
        
        {icon && <div className="text-outline-variant">{icon}</div>}
        
        {footerText && (
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            {footerText}
          </span>
        )}
      </div>

      {children}

      {progress !== undefined && (
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000" 
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          ></div>
        </div>
      )}
    </Card>
  );
}
