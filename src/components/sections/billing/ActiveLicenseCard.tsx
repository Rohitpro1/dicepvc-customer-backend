"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Copy, RefreshCw, Laptop, Monitor } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ActiveLicenseCard() {
  const [licenseVisible, setLicenseVisible] = useState(false);

  const handleCopyLicense = () => {
    navigator.clipboard.writeText("DICE - 8F2J - K9L2 - X02B");
    alert("License key copied to clipboard!");
  };

  return (
    <Card className="lg:col-span-2 flex flex-col gap-md" animateHover>
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">My Active License</h2>
        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-label-sm rounded-full font-bold">
          Valid License
        </span>
      </div>

      <div className="bg-inverse-surface text-white rounded-2xl p-lg relative overflow-hidden mb-xs">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md relative z-10">
          <div className="space-y-xs">
            <p className="text-label-sm text-white/60 uppercase tracking-widest font-semibold">Master Activation Key</p>
            <div className="flex items-center gap-sm">
              <code className="font-headline-sm text-headline-sm tracking-widest text-primary-fixed-dim font-mono">
                {licenseVisible ? "DICE - 8F2J - K9L2 - X02B" : "•••• - •••• - •••• - ••••"}
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
            <Button variant="secondary" className="flex items-center gap-xs text-white">
              <RefreshCw className="w-4 h-4" />
              <span className="text-label-sm">Renew</span>
            </Button>
          </div>
        </div>
        <div className="mt-lg pt-lg border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-md relative z-10 text-white/80">
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Status</p>
            <p className="text-label-md font-bold text-secondary-fixed">ACTIVE</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Expires</p>
            <p className="text-label-md font-bold">12 Oct 2025</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Devices</p>
            <p className="text-label-md font-bold">3 / 5 Used</p>
          </div>
          <div>
            <p className="text-label-sm text-white/50 font-semibold">Region</p>
            <p className="text-label-md font-bold">Global (WW)</p>
          </div>
        </div>
      </div>

      {/* Device Management */}
      <div className="space-y-sm mt-sm">
        <h3 className="font-label-md font-bold text-on-surface-variant flex items-center gap-xs select-none">
          <Laptop className="w-4 h-4" /> Registered Devices
        </h3>
        <div className="space-y-base">
          <div className="flex items-center justify-between p-sm rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors bg-white/40">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-label-md font-bold text-on-surface">MacBook Pro M3 (Workstation)</p>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Activated: 2 days ago</p>
              </div>
            </div>
            <button className="text-error font-label-sm hover:underline font-bold cursor-pointer" type="button">Deactivate</button>
          </div>
          <div className="flex items-center justify-between p-sm rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors bg-white/40">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <p className="text-label-md font-bold text-on-surface">Studio Desktop PC</p>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Activated: 1 month ago</p>
              </div>
            </div>
            <button className="text-error font-label-sm hover:underline font-bold cursor-pointer" type="button">Deactivate</button>
          </div>
        </div>
      </div>
    </Card>
  );
}
