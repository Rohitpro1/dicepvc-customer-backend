"use client";

import { useState } from "react";

export interface SelectedPlan {
  id: string;
  name: string;
  price: string;
}

/**
 * UI-only state management for the checkout modal.
 * The actual payment processing is handled by CheckoutWorkflow.tsx
 * via the Razorpay SDK and backend API calls.
 */
export function useCheckout() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  const startCheckout = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const cancelCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  return {
    showCheckout,
    selectedPlan,
    startCheckout,
    cancelCheckout,
  };
}
