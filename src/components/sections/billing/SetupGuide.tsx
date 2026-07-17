"use client";

import React from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function SetupGuide() {
  return (
    <Card className="space-y-md" animateHover>
      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Quick Setup</h2>
      <div className="space-y-lg">
        <div className="flex gap-md">
          <span className="w-8 h-8 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-label-md shadow-sm">1</span>
          <div>
            <p className="text-label-md font-bold text-on-surface">Download Binary</p>
            <p className="text-label-sm text-on-surface-variant mt-xs leading-normal">Get the latest DicePVC Core from our docs portal.</p>
          </div>
        </div>
        <div className="flex gap-md">
          <span className="w-8 h-8 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-label-md shadow-sm">2</span>
          <div>
            <p className="text-label-md font-bold text-on-surface">Run Activation</p>
            <p className="text-label-sm text-on-surface-variant mt-xs leading-normal">Execute `dicepvc --activate` in your terminal shell.</p>
          </div>
        </div>
        <div className="flex gap-md">
          <span className="w-8 h-8 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-label-md shadow-sm">3</span>
          <div>
            <p className="text-label-md font-bold text-on-surface">Input License</p>
            <p className="text-label-sm text-on-surface-variant mt-xs leading-normal">Paste your Master Key when prompted by the CLI.</p>
          </div>
        </div>
      </div>
      <div className="p-md bg-primary-fixed/30 rounded-2xl border border-primary/20 mt-lg">
        <p className="text-label-sm text-on-primary-fixed-variant flex items-center gap-xs font-bold">
          <Info className="w-4 h-4" /> Pro Tip
        </p>
        <p className="text-label-sm text-on-primary-fixed-variant mt-base leading-normal">
          Enterprise Pro users get priority SSH tunnel activation support.
        </p>
      </div>
    </Card>
  );
}
