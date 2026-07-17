"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Standard error logger webhook destination
    console.error("Unhandled runtime boundary error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-md bg-surface relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -z-10 top-0 right-0 w-[500px] h-[500px] bg-error/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-md w-full">
        <Card className="text-center space-y-lg border-error/20 bg-error/5 p-lg rounded-[32px] shadow-2xl" animateHover={false}>
          <div className="w-20 h-20 bg-error rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-error/25 select-none">
            <AlertOctagon className="w-12 h-12" />
          </div>

          <div className="space-y-base">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Application Crash</h1>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              We encountered an unexpected runtime error inside the application core.
            </p>
            {error.message && (
              <div className="p-sm bg-white rounded-xl border border-error/10 text-error font-label-sm leading-normal text-left select-all overflow-x-auto max-h-32">
                <code className="text-[11px] font-mono">{error.message}</code>
              </div>
            )}
          </div>

          <div className="flex gap-md pt-base">
            <Button className="flex-1 py-4 font-semibold flex items-center justify-center gap-xs" onClick={() => reset()}>
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
            <Button variant="outline" className="flex-1 py-4 font-semibold" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
