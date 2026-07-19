"use client";

import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  ShieldCheck, 
  DollarSign,
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Loader2 
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchWithRetry } from "@/lib/api/client";
import { CheckoutWorkflow } from "@/components/custom/checkout/CheckoutWorkflow";

export default function WalletPage() {
  const [balance, setBalance] = useState(24500);
  const [reloadAmount, setReloadAmount] = useState("5000");
  const [showCheckout, setShowCheckout] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: "TXN-88A92", type: "credit", name: "Wallet Top-up", date: "Jul 18, 2026", amount: 5000, status: "completed" },
    { id: "TXN-42A10", type: "debit", name: "Premium PVC Batch Order", date: "Jul 15, 2026", amount: 12900, status: "completed" },
    { id: "TXN-11X02", type: "credit", name: "Admin Refund Credit", date: "Jul 10, 2026", amount: 3500, status: "completed" },
    { id: "TXN-09M88", type: "debit", name: "Device Limit Extension Upgrade", date: "Jun 28, 2026", amount: 2400, status: "completed" },
  ]);

  useEffect(() => {
    // Load Razorpay Checkout script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleQuickSelect = (amount: number) => {
    setReloadAmount(amount.toString());
  };

  const handleAddFunds = () => {
    setShowCheckout(true);
  };

  const handleAddFundsSuccess = () => {
    const loadedAmount = parseInt(reloadAmount) || 5000;
    setBalance((prev) => prev + loadedAmount);
    
    // Add transaction locally to log
    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "credit",
      name: "Wallet Top-up",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: loadedAmount,
      status: "completed"
    };
    
    setTransactions((prev) => [newTx, ...prev]);
    setShowCheckout(false);
  };

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Wallet" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">My Wallet</h1>
          <p className="text-on-surface-variant font-body-md">
            Manage your credits, top up your balance via secure Razorpay interface, and review support billing logs.
          </p>
        </div>

        {/* Balance and Reload Area */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-md items-stretch">
          {/* Wallet Balance Card */}
          <Card className="lg:col-span-5 bg-inverse-surface text-white p-lg relative overflow-hidden flex flex-col justify-between" animateHover={false}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
            
            <div className="relative z-10 flex justify-between items-start w-full">
              <div className="space-y-[4px]">
                <p className="text-label-sm text-white/60 uppercase tracking-widest font-semibold">Available Credit Balance</p>
                <h2 className="text-display-lg font-extrabold tracking-tight">₹{balance.toLocaleString()}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-fixed-dim" />
              </div>
            </div>

            <div className="relative z-10 pt-lg mt-lg border-t border-white/15 flex justify-between items-center text-label-sm text-white/80">
              <div className="flex items-center gap-xs">
                <ShieldCheck className="w-4 h-4 text-secondary-fixed-dim" />
                <span className="font-semibold">Auto-Renewal Ready</span>
              </div>
              <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Enterprise VIP
              </span>
            </div>
          </Card>

          {/* Quick Reload Form */}
          <Card className="lg:col-span-7 flex flex-col justify-between p-lg" animateHover>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-xs">Top Up Balance</h3>
              <p className="text-on-surface-variant font-body-md mb-md">
                Load credit funds to your account instantly using local payment instruments.
              </p>

              <div className="space-y-sm">
                <div className="flex gap-sm">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input
                      type="number"
                      value={reloadAmount}
                      onChange={(e) => setReloadAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-surface-container/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleAddFunds}
                    className="flex items-center gap-xs font-semibold px-md"
                  >
                    <Plus className="w-4 h-4" /> Add Credits
                  </Button>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-base select-none">
                  {[2000, 5000, 10000, 25000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickSelect(amount)}
                      className={`px-sm py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        reloadAmount === amount.toString()
                          ? "bg-primary/10 text-primary border-primary"
                          : "bg-surface-container-low border-outline-variant/15 text-on-surface-variant hover:bg-surface-container"
                      }`}
                      type="button"
                    >
                      + ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Transaction History and Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-md">
          {/* Recent Wallet Transactions */}
          <Card className="lg:col-span-8 p-lg" animateHover>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-md">Recent Transactions</h3>
            <div className="space-y-base">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-sm border border-outline-variant/10 rounded-xl hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex items-center gap-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "credit" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                    }`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-label-md font-bold text-on-surface">{tx.name}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium">ID: {tx.id} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-label-md ${
                      tx.type === "credit" ? "text-secondary" : "text-on-surface"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"} ₹{tx.amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cards & Security info */}
          <Card className="lg:col-span-4 p-lg flex flex-col justify-between gap-md" animateHover>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-sm">Secure Checkout</h3>
              <p className="text-on-surface-variant font-body-md leading-relaxed">
                DicePVC partner payment gateways utilize 256-bit bank-grade TLS encryption models. Your card details are never cached.
              </p>
            </div>
            
            <div className="bg-surface-container-high/50 p-sm rounded-2xl border border-outline-variant/10 flex items-center gap-sm shadow-sm select-none">
              <CreditCard className="text-primary w-10 h-10 stroke-[1.5px]" />
              <div>
                <p className="text-label-sm font-bold text-on-surface">Payment System Active</p>
                <p className="text-[10px] text-on-surface-variant leading-none mt-xs">Powered by Razorpay payment nodes</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* RZP Wallet Integration Checkout */}
      <CheckoutWorkflow
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        planName="Wallet Credit Load"
        price={`₹${reloadAmount}.00`}
        onSuccess={handleAddFundsSuccess}
      />
    </main>
  );
}
