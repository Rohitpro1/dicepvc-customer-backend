"use client";

import React, { useState } from "react";
import CheckoutDialog from "./CheckoutDialog";
import PaymentPending from "./PaymentPending";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailed from "./PaymentFailed";
import LicenseGenerationLoading from "./LicenseGenerationLoading";
import ActivationSuccess from "./ActivationSuccess";

interface CheckoutWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
  onSuccess?: () => void;
}

export function CheckoutWorkflow({
  isOpen,
  onClose,
  planName,
  price,
  onSuccess,
}: CheckoutWorkflowProps) {
  const [step, setStep] = useState<
    "checkout" | "pending" | "success" | "failed" | "license_loading" | "activated"
  >("checkout");

  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleCheckoutSubmit = (userEmail: string, card: string) => {
    setEmail(userEmail);
    setStep("pending");
    
    // Simulate Razorpay Gateway latency
    setTimeout(() => {
      // Direct mock logic: card number ending in '0000' triggers a failure for demo purposes
      if (card.endsWith("0000")) {
        setStep("failed");
      } else {
        setStep("success");
      }
    }, 2000);
  };

  const handleProceedToLicense = () => {
    setStep("license_loading");
    
    // Simulate Key Generation latency
    setTimeout(() => {
      setStep("activated");
      if (onSuccess) onSuccess();
    }, 2000);
  };

  const handleCloseAll = () => {
    setStep("checkout");
    onClose();
  };

  const handleRetry = () => {
    setStep("checkout");
  };

  switch (step) {
    case "checkout":
      return (
        <CheckoutDialog
          isOpen={isOpen}
          onClose={handleCloseAll}
          onSubmit={handleCheckoutSubmit}
          price={price}
          planName={planName}
        />
      );
    case "pending":
      return <PaymentPending />;
    case "success":
      return (
        <PaymentSuccess
          email={email}
          amount={price}
          onNext={handleProceedToLicense}
        />
      );
    case "failed":
      return (
        <PaymentFailed
          onRetry={handleRetry}
          onClose={handleCloseAll}
          errorDetail="Card transaction rejected by issuer. (Code: REF_403_DECLINED). Please retry with another card or payment option."
        />
      );
    case "license_loading":
      return <LicenseGenerationLoading />;
    case "activated":
      return (
        <ActivationSuccess
          licenseKey="PRO-4X92-KYL8-VM3Q"
          onClose={handleCloseAll}
        />
      );
    default:
      return null;
  }
}
export default CheckoutWorkflow;
