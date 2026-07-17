"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export function LicenseGenerationLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl transition-all duration-500">
      <div className="flex flex-col items-center gap-md select-none">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="text-center space-y-xs">
          <h2 className="font-headline-md text-headline-md text-primary font-bold animate-pulse">Generating License...</h2>
          <p className="text-on-surface-variant font-medium">Syncing cryptographic key blocks with Neural Core infrastructure</p>
        </div>
      </div>
    </div>
  );
}
export default LicenseGenerationLoading;
