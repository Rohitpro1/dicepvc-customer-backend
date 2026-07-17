"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function ConciergeCard() {
  return (
    <Card className="flex flex-col justify-between" animateHover>
      <div>
        <div className="flex justify-between items-start mb-sm">
          <span className="px-sm py-xs bg-secondary/10 text-secondary text-label-sm font-bold rounded-full uppercase tracking-wider">
            Support Active
          </span>
          <HelpCircle className="text-outline w-5 h-5" />
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs font-bold">Concierge Status</h3>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Your dedicated account manager is currently online. Average response time: <span className="font-bold text-on-surface">4 mins</span>
        </p>
      </div>
      <div className="mt-md pt-md border-t border-outline-variant/20">
        <div className="flex items-center gap-sm mb-xs">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
            New Announcement
          </p>
        </div>
        <p className="font-label-md text-label-md text-on-surface font-medium">
          Scheduled maintenance on Global Server Node 4 this Sunday.
        </p>
      </div>
    </Card>
  );
}
