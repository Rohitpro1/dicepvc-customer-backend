"use client";

import React from "react";
import { CheckCircle2, Receipt, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PaymentSuccessProps {
  email: string;
  amount: string;
  onNext: () => void;
}

export function PaymentSuccess({
  email,
  amount,
  onNext,
}: PaymentSuccessProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl transition-all duration-500">
      <div className="max-w-md w-full p-md">
        <Card className="text-center space-y-lg border-secondary/20 bg-secondary/5 p-lg rounded-[32px] shadow-2xl" animateHover={false}>
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-secondary/25 select-none">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          <div className="space-y-base">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Payment Successful</h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              We've processed your checkout of <span className="font-bold text-on-surface">{amount}</span>. A detailed receipt has been sent to <span className="font-bold text-on-surface">{email || "your email"}</span>.
            </p>
          </div>

          <div className="bg-white p-md rounded-2xl border border-outline-variant/10 flex items-center gap-sm select-none">
            <Receipt className="text-outline w-5 h-5 flex-shrink-0" />
            <div className="text-left font-label-sm">
              <p className="font-bold text-on-surface leading-none">Transaction ID: pay_8J239XLZ88</p>
              <p className="text-[10px] text-on-surface-variant mt-[2px] leading-none">Gateway: Razorpay Secure</p>
            </div>
          </div>

          <Button className="w-full py-4 font-semibold flex items-center justify-center gap-xs" onClick={onNext}>
            Proceed to License Generation <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
export default PaymentSuccess;
