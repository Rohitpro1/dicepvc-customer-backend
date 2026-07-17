"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VersionRollout() {
  const versions = [
    { name: "Stable Core v2.4.1", tag: "v2.4", status: "Production-Ready", state: "stable", cta: "Rollout" },
    { name: "Beta Alpha-9", tag: "v2.5", status: "Internal Testing Only", state: "beta", detail: "Deployed (8%)" },
    { name: "Legacy LTS", tag: "v2.3", status: "EOL in 45 Days", state: "lts", cta: "Archive" },
  ];

  return (
    <Card animateHover>
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Software Control</h3>
        <span className="bg-primary/10 text-primary text-[10px] px-sm py-xs rounded-full font-bold uppercase tracking-widest">
          Global Fleet
        </span>
      </div>
      <div className="space-y-base">
        {versions.map((ver, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between p-sm rounded-xl border border-transparent transition-all ${
              ver.state === "beta" 
                ? "bg-primary/5 border-primary/20" 
                : "hover:bg-white/50 hover:border-white/20"
            } ${ver.state === "lts" ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                ver.state === "beta" ? "bg-primary/20 text-primary" : "bg-surface-container text-on-surface-variant"
              }`}>
                {ver.tag}
              </div>
              <div>
                <p className="font-label-md text-on-surface font-bold">{ver.name}</p>
                <p className="font-label-sm text-on-surface-variant">{ver.status}</p>
              </div>
            </div>
            {ver.cta ? (
              <Button size="sm" variant={ver.state === "stable" ? "primary" : "outline"} className="rounded-full px-4">
                {ver.cta}
              </Button>
            ) : (
              <span className="px-md py-xs text-on-surface-variant font-label-sm italic">{ver.detail}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
