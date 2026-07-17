"use client";

import React from "react";
import { Laptop, Activity, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function ClientSyncCard() {
  return (
    <Card className="flex flex-col justify-between" animateHover>
      <div>
        <div className="flex justify-between items-start mb-sm">
          <span className="px-sm py-xs bg-secondary/10 text-secondary text-label-sm font-bold rounded-full uppercase tracking-wider flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Sync Active
          </span>
          <Laptop className="text-outline w-5 h-5" />
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs font-bold">Client Workstation</h3>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Local printing daemon connected to neural network hubs.
        </p>
      </div>

      <div className="mt-md pt-md border-t border-outline-variant/20 space-y-md">
        <div className="grid grid-cols-2 gap-sm text-label-sm">
          <div>
            <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">Client Version</p>
            <p className="font-bold text-on-surface">dicepvc-cli v2.4.1</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">Local Ping</p>
            <p className="font-bold text-secondary">14ms (Optimal)</p>
          </div>
        </div>
        <div className="flex items-center gap-sm p-sm bg-surface-container rounded-xl border border-outline-variant/10 select-none">
          <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/15 flex-shrink-0" />
          <div>
            <p className="text-label-sm font-bold text-on-surface leading-none">Evolis Primacy 2</p>
            <p className="text-[10px] text-on-surface-variant mt-[2px] leading-none">Printer status online &amp; calibrated</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
