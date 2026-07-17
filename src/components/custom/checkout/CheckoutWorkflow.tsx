"use client";

import React, { useState, useEffect } from "react";
import CheckoutDialog from "./CheckoutDialog";
import PaymentPending from "./PaymentPending";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailed from "./PaymentFailed";
import LicenseGenerationLoading from "./LicenseGenerationLoading";
import ActivationSuccess from "./ActivationSuccess";
import { fetchWithRetry } from "@/lib/api/client";

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
  const [errorDetail, setErrorDetail] = useState("Payment failed. Please try again.");

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

  if (!isOpen) return null;

  const handleCheckoutSubmit = async (userEmail: string, card: string) => {
    setEmail(userEmail);
    setStep("pending");

    try {
      // 1. Convert price to numerical amount in paise (e.g. "$129.00" -> 12900 paise)
      const numericalPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
      const amountInPaise = isNaN(numericalPrice) ? 12900 : Math.round(numericalPrice * 100);

      // 2. Create Razorpay order on backend
      const res = await fetchWithRetry("/billing/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: amountInPaise, currency: "INR" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create order on backend.");
      }

      const orderData = await res.json();

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TEchnNOLHizcDZ",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DicePVC AI",
        description: `Purchase ${planName} Plan`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          setStep("pending");
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetchWithRetry("/billing/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              setStep("success");
            } else {
              const errorData = await verifyRes.json();
              setErrorDetail(errorData.error || "Payment verification failed.");
              setStep("failed");
            }
          } catch (err: any) {
            setErrorDetail(err.message || "Payment verification failed.");
            setStep("failed");
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout modal closed by user.");
            setStep("checkout");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        setErrorDetail(resp.error.description || "Payment transaction failed.");
        setStep("failed");
      });
      rzp.open();

    } catch (err: any) {
      setErrorDetail(err.message || "Failed to initiate payment session.");
      setStep("failed");
    }
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
          errorDetail={errorDetail}
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
