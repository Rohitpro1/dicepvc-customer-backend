"use client";

import { useState } from "react";

/**
 * UI-only state management for the checkout modal.
 * The actual payment processing is handled by CheckoutWorkflow.tsx
 * via the Razorpay SDK and backend API calls.
 */
export function useCheckout() {
  const [showCheckout, setShowCheckout] = useState(false);

  const startCheckout = () => {
    setShowCheckout(true);
  };

  const cancelCheckout = () => {
    setShowCheckout(false);
  };

  return {
    showCheckout,
    startCheckout,
    cancelCheckout,
  };
}
