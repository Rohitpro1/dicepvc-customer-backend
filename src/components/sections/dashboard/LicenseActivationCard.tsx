"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LicenseActivationCard() {
  const [serialKey, setSerialKey] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend license verification endpoint when available
  };

  return (
    <Card className="flex flex-col gap-md" animateHover>
      <h3 className="font-label-md text-label-md text-outline uppercase font-bold tracking-widest">
        Quick Activation
      </h3>
      <form onSubmit={handleVerify} className="space-y-sm flex-1 flex flex-col justify-between">
        <div className="space-y-sm">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Enter serial key to activate new batch hardware.
          </p>
          <Input 
            placeholder="XXXX - XXXX - XXXX" 
            className="font-mono text-center" 
            value={serialKey}
            onChange={(e) => setSerialKey(e.target.value)}
            required
          />
        </div>
        <Button className="w-full mt-2" type="submit">
          Verify License Key
        </Button>
      </form>
      <div className="p-sm bg-surface-container-high rounded-xl flex items-center gap-sm">
        <Info className="text-primary w-5 h-5 flex-shrink-0" />
        <p className="font-label-sm text-label-sm text-on-primary-fixed-variant leading-normal">
          Bulk activation available for Enterprise Tier customers.
        </p>
      </div>
    </Card>
  );
}
