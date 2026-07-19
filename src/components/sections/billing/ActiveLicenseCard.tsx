"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Copy, Laptop, Monitor, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useActiveLicenses } from "@/hooks/useQueryHooks";

export default function ActiveLicenseCard() {
  const [licenseVisible, setLicenseVisible] = useState(false);
  const { data: licenses, isLoading } = useActiveLicenses();

  const license = licenses?.[0];

  const handleCopyLicense = () => {
    if (license?.key) {
      navigator.clipboard.writeText(license.key);
    }
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 flex items-center justify-center min-h-[200px]" animateHover>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!license) {
    return (
      <Card className="lg:col-span-2 flex flex-col items-center justify-center gap-sm min-h-[200px]" animateHover>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Active License</h2>
        <p className="text-on-surface-variant font-body-md">Subscribe to a plan to receive your license key.</p>
      </Card>
    );
  }

  const expiresFormatted = license.expiresAt
    ? new Date(license.expiresAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "N/A";

  return (
    <Card className="lg:col-span-2 flex flex-col gap-md" animateHover>
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">My Active License</h2>
        <span className={`px-3 py-1 text-label-sm rounded-full font-bold ${
          license.status === "active"
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-error-container text-on-error-container"
        }`}>
          {license.status === "active" ? "Valid License" : license.status}
        </span>
      </div>

      <div className="bg-inverse-surface text-white rounded-2xl p-lg relative overflow-hidden mb-xs">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md relative z-10">
          <div className="space-y-xs">
            <p className="text-label-sm text-white/60 uppercase tracking-widest font-semibold">Master Activation Key</p>
            <div className="flex items-center gap-sm">
              <code className="font-headline-sm text-headline-sm tracking-widest text-primary-fixed-dim font-mono">
                {licenseVisible ? license.key : "•••• - •••• - •••• - ••••"}
              </code>
              <button 
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-white" 
                onClick={() => setLicenseVisible(!licenseVisible)}
                type="button"
              >
                {licenseVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-sm">
            <Button variant="secondary" className="flex items-center gap-xs text-white" onClick={handleCopyLicense}>
              <Copy className="w-4 h-4" />
              <span className="text-label-sm">Copy</span>
            </Button>
          </div>
        </div>
        <div className="mt-lg pt-lg border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-md relative z-10 text-white/80">
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Status</p>
            <p className="text-label-md font-bold text-secondary-fixed">{license.status.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Expires</p>
            <p className="text-label-md font-bold">{expiresFormatted}</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Devices</p>
            <p className="text-label-md font-bold">{license.activeDevices} / {license.maxDevices} Used</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Plan</p>
            <p className="text-label-md font-bold">{license.plan}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
