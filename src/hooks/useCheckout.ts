"use client";

import { useState } from "react";

export function useCheckout(successDuration: number = 3000) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startCheckout = () => {
    setShowCheckout(true);
    setIsProcessing(false);
    setIsSuccess(false);
  };

  const cancelCheckout = () => {
    setShowCheckout(false);
  };

  const processPayment = (callback?: () => void) => {
    setShowCheckout(false);
    setIsProcessing(true);
    setIsSuccess(false);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      if (callback) callback();
    }, successDuration);
  };

  const reset = () => {
    setShowCheckout(false);
    setIsProcessing(false);
    setIsSuccess(false);
  };

  return {
    showCheckout,
    isProcessing,
    isSuccess,
    startCheckout,
    cancelCheckout,
    processPayment,
    reset,
  };
}
