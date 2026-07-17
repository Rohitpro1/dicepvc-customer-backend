"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PrintVolumeChart() {
  const points = [
    { x: 0, y: 120, day: "1 Oct" },
    { x: 10, y: 80, day: "4 Oct" },
    { x: 20, y: 150, day: "7 Oct" },
    { x: 30, y: 100, day: "10 Oct" },
    { x: 40, y: 180, day: "13 Oct" },
    { x: 50, y: 140, day: "16 Oct" },
    { x: 60, y: 220, day: "19 Oct" },
    { x: 70, y: 190, day: "22 Oct" },
    { x: 80, y: 260, day: "25 Oct" },
    { x: 90, y: 240, day: "28 Oct" },
    { x: 100, y: 310, day: "31 Oct" },
  ];

  // Map coordinates to SVG viewbox (1000 x 350)
  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? "M" : "L"} ${p.x * 10} ${350 - p.y}`;
  }, "");

  // Area path closing coordinates
  const areaD = `${pathD} L 1000 350 L 0 350 Z`;

  return (
    <Card className="xl:col-span-2 flex flex-col justify-between p-md" animateHover={false}>
      <div className="flex justify-between items-center mb-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Print Volume</h3>
          <p className="text-on-surface-variant font-label-md">Daily PVC prints for this month</p>
        </div>
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/10">
          <Button size="sm" variant="ghost" className="px-4 py-1 rounded-full text-label-sm font-bold bg-white shadow-sm">Lines</Button>
          <Button size="sm" variant="ghost" className="px-4 py-1 rounded-full text-label-sm text-on-surface-variant hover:text-primary transition-all font-semibold">Bars</Button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-[220px] relative select-none mt-sm">
        <svg className="w-full h-full" viewBox="0 0 1000 350" preserveAspectRatio="none">
          <defs>
            <linearGradient id="printVolumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1="87.5" x2="1000" y2="87.5" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="0" y1="175" x2="1000" y2="175" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="0" y1="262.5" x2="1000" y2="262.5" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="4 4" />
          
          {/* Fill Area */}
          <path d={areaD} fill="url(#printVolumeGrad)" />
          
          {/* Line Path */}
          <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Circles at keys */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x * 10}
              cy={350 - p.y}
              r="5"
              fill="white"
              stroke="var(--color-primary)"
              strokeWidth="3"
              className="hover:r-7 transition-all cursor-pointer"
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant pt-md border-t border-outline-variant/10 mt-md">
        <span>1 Oct</span>
        <span>10 Oct</span>
        <span>20 Oct</span>
        <span>31 Oct</span>
      </div>
    </Card>
  );
}
