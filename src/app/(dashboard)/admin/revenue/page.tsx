"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Search, 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  usePaymentHistory, 
  useRefundPaymentMutation, 
  useAdminStats 
} from "@/hooks/useQueryHooks";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminRevenuePage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentHistory(page, 15);
  const refundMutation = useRefundPaymentMutation();

  const handleRefund = (paymentId: string) => {
    if (confirm("Are you sure you want to refund this payment? This action is irreversible.")) {
      refundMutation.mutate(paymentId);
    }
  };

  const payments = paymentsData?.results || [];
  const totalPages = paymentsData?.pages || 1;

  const filteredPayments = payments.filter((p: any) => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.user_id && p.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusClass = (status: string) => {
    switch (status) {
      case "captured":
      case "active":
        return "bg-secondary/10 text-secondary";
      case "failed":
        return "bg-error/10 text-error";
      case "refunded":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Revenue Analytics" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">Revenue Ledger</h1>
          <p className="text-on-surface-variant font-body-md">
            Review live transaction ledger, issue prompt refunds, and track administrative platform earnings.
          </p>
        </div>

        {/* Mini stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <Card className="flex items-center justify-between p-md" animateHover>
            <div>
              <p className="text-[10px] text-outline uppercase font-semibold">Total Gross Earnings</p>
              <h3 className="font-headline-md font-extrabold text-primary">
                ₹{stats?.total_revenue ? stats.total_revenue.toLocaleString() : "0"}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </Card>
          <Card className="flex items-center justify-between p-md" animateHover>
            <div>
              <p className="text-[10px] text-outline uppercase font-semibold">Paying Customers</p>
              <h3 className="font-headline-md font-extrabold text-secondary">
                {stats?.active_subscriptions || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </Card>
          <Card className="flex items-center justify-between p-md" animateHover>
            <div>
              <p className="text-[10px] text-outline uppercase font-semibold">Total Platform Serials</p>
              <h3 className="font-headline-md font-extrabold text-on-surface">
                {stats?.total_licenses || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-outline">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>
        </section>

        {/* Filters */}
        <div className="flex bg-surface-container-low/40 backdrop-blur-md p-sm rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search ledger by transaction ID or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Ledger Table */}
        {paymentsLoading ? (
          <Skeleton className="h-[250px]" />
        ) : (
          <Card className="p-lg" animateHover={false}>
            <div className="overflow-x-auto w-full">
              {filteredPayments.length === 0 ? (
                <p className="text-label-md text-on-surface-variant py-md text-center">No platform transactions found.</p>
              ) : (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                      <th className="pb-sm px-base font-semibold">Transaction ID</th>
                      <th className="pb-sm px-base font-semibold">Customer ID</th>
                      <th className="pb-sm px-base font-semibold">Date</th>
                      <th className="pb-sm px-base font-semibold">Status</th>
                      <th className="pb-sm px-base font-semibold">Gross Amount</th>
                      <th className="pb-sm px-base text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-label-md">
                    {filteredPayments.map((p: any) => {
                      const formattedDate = new Date(p.created_at || Date.now()).toLocaleDateString();
                      const isRefunded = p.status === "refunded";
                      const canRefund = p.status === "captured";

                      return (
                        <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-white/40 transition-colors last:border-0">
                          <td className="py-md px-base font-mono text-xs font-bold text-primary">
                            #{p.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="py-md px-base text-xs text-on-surface-variant">
                            {p.user_id}
                          </td>
                          <td className="py-md px-base text-on-surface-variant">
                            {formattedDate}
                          </td>
                          <td className="py-md px-base">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusClass(p.status)}`}>
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-md px-base font-extrabold text-on-surface">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="py-md px-base text-right">
                            {canRefund && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={refundMutation.isPending}
                                onClick={() => handleRefund(p.id)}
                                className="flex items-center gap-xs text-xs font-semibold text-error border-error/20 hover:bg-error-container/10 ml-auto"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Refund
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-sm pt-md border-t border-outline-variant/10 mt-md select-none">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-label-sm text-xs font-bold text-on-surface-variant">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
