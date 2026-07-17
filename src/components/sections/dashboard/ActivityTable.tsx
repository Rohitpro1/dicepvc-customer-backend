"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, ChevronRight, Info, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePaymentHistory } from "@/hooks/useQueryHooks";
import { BASE_URL } from "@/lib/api/client";

export default function ActivityTable() {
  const [filter, setFilter] = useState<"All" | "Completed" | "Processing" | "Failed">("All");
  const { data: paymentsData, isLoading } = usePaymentHistory(1, 10);

  if (isLoading) {
    return (
      <Card className="xl:col-span-2 flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </Card>
    );
  }

  const payments = paymentsData?.results || [];

  const activities = payments.map((p: any) => {
    let status = "Completed";
    let statusClass = "bg-secondary/10 text-secondary";
    
    if (p.status === "failed") {
      status = "Failed";
      statusClass = "bg-error/10 text-error";
    } else if (p.status === "refunded") {
      status = "Failed"; // Map refunds to failed/inactive or handle custom style
      statusClass = "bg-amber-100/50 text-amber-700";
    } else if (p.status === "created" || p.status === "pending") {
      status = "Processing";
      statusClass = "bg-primary/10 text-primary";
    }
    
    return {
      id: `#TX-${p.id.slice(-6).toUpperCase()}`,
      rawId: p.id,
      type: p.method ? `${p.method.toUpperCase()} Checkout` : "Card Payment",
      date: new Date(p.created_at || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      status,
      statusClass,
      amount: `₹${p.amount}`
    };
  });

  const filteredActivities = activities.filter((act: any) => {
    if (filter === "All") return true;
    return act.status === filter;
  });

  const handleDownloadInvoice = (paymentId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${BASE_URL}/billing/invoices/${paymentId}/download${token ? `?token=${token}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="xl:col-span-2 flex flex-col justify-between" animateHover>
      <div>
        <div className="flex justify-between items-center mb-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Recent Billing Activity</h3>
          <Link href="/billing" className="text-primary font-label-md hover:underline font-semibold flex items-center gap-1 select-none">
            View Invoices <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-base border-b border-outline-variant/10 pb-base mb-md select-none">
          {(["All", "Completed", "Processing", "Failed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-sm py-1 rounded-full font-label-sm text-[11px] transition-all cursor-pointer ${
                filter === tab 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "text-on-surface-variant hover:text-primary font-semibold"
              }`}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredActivities.length === 0 ? (
          <div className="py-xl text-center space-y-md select-none">
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto text-secondary shadow-md shadow-secondary/5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-[4px]">
              <p className="font-label-md font-bold text-on-surface">No Activity Found</p>
              <p className="text-label-sm text-on-surface-variant max-w-xs mx-auto leading-normal">
                There are no transaction records marked as {filter.toLowerCase()} in your history.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/30 font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  <th className="pb-sm px-sm font-semibold">Transaction ID</th>
                  <th className="pb-sm px-sm font-semibold">Method</th>
                  <th className="pb-sm px-sm font-semibold">Date</th>
                  <th className="pb-sm px-sm font-semibold">Status</th>
                  <th className="pb-sm px-sm font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-label-md text-label-md">
                {filteredActivities.map((act: any) => (
                  <tr key={act.id} className="group hover:bg-primary/5 transition-colors border-t border-outline-variant/10 first:border-t-0">
                    <td className="py-md px-sm font-bold text-on-surface">{act.id}</td>
                    <td className="py-md px-sm text-on-surface-variant">{act.type}</td>
                    <td className="py-md px-sm text-on-surface-variant">{act.date}</td>
                    <td className="py-md px-sm">
                      <span className={`px-sm py-1 rounded-full font-semibold text-xs ${act.statusClass}`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-md px-sm text-right">
                      {act.status === "Completed" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-outline group-hover:text-primary" 
                          aria-label="Download PDF Invoice"
                          onClick={() => handleDownloadInvoice(act.rawId)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {act.status === "Processing" && (
                        <Button variant="ghost" size="icon" className="text-outline group-hover:text-primary" aria-label="More Info">
                          <Info className="w-4 h-4" />
                        </Button>
                      )}
                      {act.status === "Failed" && (
                        <Button variant="ghost" size="icon" className="text-outline group-hover:text-error" aria-label="Retry payment">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
