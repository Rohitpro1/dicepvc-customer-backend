"use client";

import React from "react";
import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PaymentFailedProps {
  onRetry: () => void;
  onClose: () => void;
  errorDetail?: string;
}

export function PaymentFailed({
  onRetry,
  onClose,
  errorDetail = "Insufficient balance or invalid credit card parameter details. Please check card balances and try again.",
}: PaymentFailedProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl transition-all duration-500">
      <div className="max-w-md w-full p-md">
        <Card className="text-center space-y-lg border-error/20 bg-error/5 p-lg rounded-[32px] shadow-2xl" animateHover={false}>
          <div className="w-20 h-20 bg-error rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-error/25 select-none">
            <AlertTriangle className="w-12 h-12" />
          </div>

          <div className="space-y-base">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Payment Failed</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              We were unable to complete your checkout transaction. Gateway reported:
            </p>
            <div className="p-sm bg-white rounded-xl border border-error/10 text-error font-label-sm leading-normal text-left flex items-start gap-xs select-none">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-[2px]" />
              <span>{errorDetail}</span>
            </div>
          </div>

          <div className="flex gap-md pt-base">
            <Button className="flex-1 py-4 font-semibold flex items-center justify-center gap-xs" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 animate-spin-reverse" /> Retry Payment
            </Button>
            <Button variant="outline" className="flex-1 py-4 font-semibold" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default PaymentFailed;
