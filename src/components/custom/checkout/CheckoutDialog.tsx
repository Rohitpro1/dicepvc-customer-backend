"use client";

import React, { useState } from "react";
import { CreditCard, X, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, card: string, exp: string, cvv: string) => void;
  price: string;
  planName: string;
}

export function CheckoutDialog({
  isOpen,
  onClose,
  onSubmit,
  price,
  planName,
}: CheckoutDialogProps) {
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, cardNumber, expiry, cvv);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header={
        <div className="bg-[#3399cc] p-md text-white flex justify-between items-center select-none">
          <div className="flex items-center gap-sm">
            <CreditCard className="w-5 h-5 text-white" />
            <span className="font-bold tracking-tight">DicePVC Secure Checkout</span>
          </div>
          <button 
            className="text-white hover:bg-white/10 rounded-full p-1 cursor-pointer" 
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-md">
        <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase font-semibold">Plan selected</p>
            <p className="font-bold text-headline-sm text-on-surface">{planName}</p>
          </div>
          <p className="text-headline-sm font-bold text-primary">{price}</p>
        </div>
        
        <div className="space-y-md mb-lg">
          <div className="space-y-xs">
            <label className="text-label-sm text-on-surface-variant font-bold" htmlFor="checkout-email">Billing Email</label>
            <Input 
              id="checkout-email"
              type="email"
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          <div className="space-y-xs">
            <label className="text-label-sm text-on-surface-variant font-bold" htmlFor="checkout-card">Card Details</label>
            <Input 
              id="checkout-card"
              placeholder="Card Number" 
              value={cardNumber} 
              onChange={(e) => setCardNumber(e.target.value)} 
              icon={<CreditCard className="w-5 h-5" />}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-label-sm text-on-surface-variant font-bold" htmlFor="checkout-expiry">Expiry</label>
              <Input 
                id="checkout-expiry"
                placeholder="MM / YY" 
                value={expiry} 
                onChange={(e) => setExpiry(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-xs">
              <label className="text-label-sm text-on-surface-variant font-bold" htmlFor="checkout-cvv">CVV</label>
              <Input 
                id="checkout-cvv"
                placeholder="•••" 
                type="password" 
                value={cvv} 
                onChange={(e) => setCvv(e.target.value)} 
                required
              />
            </div>
          </div>
        </div>

        <Button className="w-full bg-[#3399cc] hover:bg-[#2888b8] text-white py-4 flex items-center justify-center gap-sm shadow-lg shadow-[#3399cc]/20 font-semibold" type="submit">
          Pay Now <ArrowRight className="w-4 h-4" />
        </Button>
        
        <div className="mt-md flex items-center justify-center gap-xs select-none">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Secured by</span>
          <img 
            alt="Razorpay logo" 
            className="w-4 h-4 grayscale opacity-50" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLtWDPtixLuC8IBhEg2u4Zxgjqp2I0XjJgdL84DRmmKKRfIjGq4GnkqaQ77DE4wvIxYP56fQT-wf8eljiWrY3Ku3uB-rnKeDXnnrf_-LkT_KDmFBCBLR77L_VPVEg3vZWfzOLPskxGtG3ashk5406ThNIXWxgveF2qZjJRvUdy4tjrNiGzqOzl-w0ueDXhq47i3HxxgoUZmErstQRE6hpJ6AD6h5wkVsoV7kloY0_sdgYr8r8nEQip"
          />
          <span className="text-[10px] font-bold text-on-surface-variant">Razorpay</span>
        </div>
      </form>
    </Dialog>
  );
}
export default CheckoutDialog;
