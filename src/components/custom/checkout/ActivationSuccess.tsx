"use client";

import React from "react";
import { ShieldCheck, Mail, Copy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ActivationSuccessProps {
  licenseKey: string;
  onClose: () => void;
}

export function ActivationSuccess({
  licenseKey,
  onClose,
}: ActivationSuccessProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(licenseKey);
    alert("License key copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl transition-all duration-500">
      <div className="max-w-xl w-full p-md">
        <Card className="text-center space-y-lg border-primary/20 bg-primary/5 p-lg rounded-[32px] shadow-2xl" animateHover={false}>
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-secondary/25 select-none">
            <ShieldCheck className="w-12 h-12" />
          </div>

          <div className="space-y-base">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Activation Ready!</h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              Your Enterprise Pro subscription is now active. Cryptographic licenses have been verified.
            </p>
          </div>

          <div className="bg-white p-lg rounded-2xl border border-primary/10 shadow-inner">
            <p className="text-label-sm text-on-surface-variant font-bold uppercase tracking-widest mb-sm select-none">Your New License Key</p>
            <div className="flex items-center gap-sm bg-primary/5 p-md rounded-xl border border-primary/10">
              <code className="flex-1 font-headline-sm text-primary tracking-widest font-mono text-center">
                {licenseKey}
              </code>
              <button 
                className="w-10 h-10 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary transition-all cursor-pointer"
                onClick={handleCopy}
                title="Copy License"
                type="button"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-md font-medium select-none">
              Expires: Oct 12, 2025 • Priority Support Active
            </p>
          </div>

          <div className="flex gap-md pt-md">
            <Button className="flex-1 py-4 font-semibold" onClick={onClose}>
              Go to Dashboard
            </Button>
            <Button variant="outline" className="flex-1 py-4 font-semibold">
              Download Guide
            </Button>
          </div>

          <div className="flex items-center justify-center gap-base px-4 py-2 bg-secondary/10 text-secondary rounded-full w-fit mx-auto font-label-sm font-bold select-none">
            <Mail className="w-4 h-4" />
            <span>Email Confirmation Sent</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default ActivationSuccess;
