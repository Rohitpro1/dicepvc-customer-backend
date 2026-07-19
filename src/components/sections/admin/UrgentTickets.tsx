"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useSupportTickets } from "@/hooks/useQueryHooks";
import { Loader2 } from "lucide-react";

export default function UrgentTickets() {
  const { data: tickets, isLoading } = useSupportTickets();

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center min-h-[200px]" animateHover>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  // Filter or sort to show critical/high priority first, or just show top 3
  const urgentTickets = (tickets || [])
    .slice()
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
      return bPriority - aPriority;
    })
    .slice(0, 3);

  return (
    <Card animateHover>
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Urgent Tickets</h3>
        <a className="text-primary font-label-sm hover:underline font-semibold" href="#">View All</a>
      </div>
      <div className="space-y-base">
        {urgentTickets.length === 0 ? (
          <p className="text-label-md text-on-surface-variant py-md text-center">No urgent tickets at this time.</p>
        ) : (
          urgentTickets.map((t) => {
            const isHigh = t.priority === "Critical" || t.priority === "High";
            const timeFormatted = t.createdAt 
              ? new Date(t.createdAt).toLocaleDateString()
              : "N/A";

            return (
              <div 
                key={t.id} 
                className={cn(
                  "p-sm rounded-xl flex items-center justify-between border",
                  isHigh 
                    ? "border-error/20 bg-error-container/10" 
                    : "border-outline-variant/30 hover:bg-white/50 hover:border-white/20 transition-all"
                )}
              >
                <div className="flex items-center gap-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isHigh ? "bg-error" : "bg-secondary-fixed-dim"
                  )}></div>
                  <div>
                    <p className="font-label-md font-bold text-on-surface">{t.subject}</p>
                    <p className="font-label-sm text-on-surface-variant">Priority: {t.priority} • Category: {t.category}</p>
                  </div>
                </div>
                <span className="text-on-surface-variant font-label-sm font-semibold">{timeFormatted}</span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
