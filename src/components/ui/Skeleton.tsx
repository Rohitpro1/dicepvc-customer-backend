"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-2xl bg-surface-container-high/50 border border-outline-variant/10 w-full min-h-[48px]",
        className
      )}
    />
  );
}
export default Skeleton;
