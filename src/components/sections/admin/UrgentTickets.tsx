"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function UrgentTickets() {
  const tickets = [
    { title: "Database Latency Apex Ltd.", meta: "Assigned to: Sarah J.", time: "4m ago", priority: "high" },
    { title: "Bulk License Seat Inquiry", meta: "Unassigned", time: "1h ago", priority: "medium" },
    { title: "PVC Render Glitch", meta: "Assigned to: Mike K.", time: "3h ago", priority: "medium" },
  ];

  return (
    <Card animateHover>
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Urgent Tickets</h3>
        <a className="text-primary font-label-sm hover:underline font-semibold" href="#">View All</a>
      </div>
      <div className="space-y-base">
        {tickets.map((t, idx) => (
          <div 
            key={idx} 
            className={cn(
              "p-sm rounded-xl flex items-center justify-between border",
              t.priority === "high" 
                ? "border-error/20 bg-error-container/10" 
                : "border-outline-variant/30 hover:bg-white/50 hover:border-white/20 transition-all"
            )}
          >
            <div className="flex items-center gap-sm">
              <div className={cn(
                "w-2 h-2 rounded-full",
                t.priority === "high" ? "bg-error" : "bg-secondary-fixed-dim"
              )}></div>
              <div>
                <p className="font-label-md font-bold text-on-surface">{t.title}</p>
                <p className="font-label-sm text-on-surface-variant">{t.meta}</p>
              </div>
            </div>
            <span className="text-on-surface-variant font-label-sm font-semibold">{t.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
