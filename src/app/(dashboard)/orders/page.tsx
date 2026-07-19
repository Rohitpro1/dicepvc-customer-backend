"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  ExternalLink, 
  Download, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePaymentHistory } from "@/hooks/useQueryHooks";
import { BASE_URL } from "@/lib/api/client";
import Skeleton from "@/components/ui/Skeleton";

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const { data: paymentsData, isLoading } = usePaymentHistory(1, 20);

  const handleDownloadInvoice = (paymentId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${BASE_URL}/billing/invoices/${paymentId}/download${token ? `?token=${token}` : ""}`;
    window.open(url, "_blank");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "captured":
      case "active":
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-error" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "captured":
      case "active":
        return "bg-secondary/10 text-secondary";
      case "failed":
        return "bg-error/10 text-error";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const payments = paymentsData?.results || [];

  const filteredOrders = payments.filter((p: any) => {
    const matchesSearch = 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.method && p.method.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "All") return matchesSearch;
    if (statusFilter === "Completed") return matchesSearch && p.status === "captured";
    if (statusFilter === "Pending") return matchesSearch && (p.status === "created" || p.status === "pending");
    if (statusFilter === "Failed") return matchesSearch && p.status === "failed";
    
    return matchesSearch;
  });

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Orders" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">My Orders</h1>
          <p className="text-on-surface-variant font-body-md">
            View status, track shipments, and download tax invoices for your premium PVC orders and license acquisitions.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-base justify-between items-stretch sm:items-center bg-surface-container-low/40 backdrop-blur-md p-sm rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search by Order ID or Payment Method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-base overflow-x-auto">
            {["All", "Completed", "Pending", "Failed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-label-sm text-xs transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-primary text-white font-bold"
                    : "bg-white/40 border border-outline-variant/15 text-on-surface hover:bg-white/70 font-semibold"
                }`}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / Table */}
        {isLoading ? (
          <div className="space-y-md">
            <Skeleton className="h-[80px]" />
            <Skeleton className="h-[80px]" />
            <Skeleton className="h-[80px]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-xl text-center space-y-md min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="space-y-xs">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Orders Found</h3>
              <p className="text-on-surface-variant font-body-md max-w-sm">
                No purchases or hardware requests match your search criteria.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-md">
            {filteredOrders.map((order: any) => {
              const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <Card 
                  key={order.id} 
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md border border-outline-variant/10 p-md"
                  animateHover
                >
                  <div className="flex-1 space-y-sm">
                    <div className="flex items-center gap-sm">
                      <span className="font-mono text-label-md font-extrabold text-primary">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-label-sm font-bold rounded-full flex items-center gap-xs ${getStatusClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status === "captured" ? "Completed" : order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-md pt-xs">
                      <div>
                        <p className="text-[10px] text-outline uppercase font-semibold">Date</p>
                        <p className="font-bold text-label-md text-on-surface">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-outline uppercase font-semibold">Amount</p>
                        <p className="font-extrabold text-label-md text-on-surface">₹{order.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-outline uppercase font-semibold">Product Type</p>
                        <p className="font-bold text-label-md text-on-surface">SaaS Subscription</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-outline uppercase font-semibold">Payment Method</p>
                        <p className="font-bold text-label-md text-on-surface">{order.method?.toUpperCase() || "RAZORPAY"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-sm w-full md:w-auto pt-sm md:pt-0 border-t border-outline-variant/10 md:border-t-0 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="flex items-center gap-xs font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Invoice
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-xs font-semibold"
                    >
                      <Truck className="w-4 h-4" />
                      Track Shipment
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
