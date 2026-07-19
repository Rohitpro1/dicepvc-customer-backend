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
  const [activatedLicenseKey, setActivatedLicenseKey] = useState("");

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

  const handleCheckoutSubmit = async (userEmail: string, _card: string) => {
    setEmail(userEmail);
    setStep("pending");

    try {
      // Convert price to numerical amount in paise (e.g. "$129.00" -> 12900 paise)
      const numericalPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
      const amountInPaise = isNaN(numericalPrice) ? 12900 : Math.round(numericalPrice * 100);

      // Create Razorpay order on backend
      const res = await fetchWithRetry("/billing/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
      });

      const orderData = await res.json();

      // Configure Razorpay Standard Checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DicePVC AI",
        description: `Purchase ${planName} Plan`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          console.log("[Razorpay Success Callback] Handler invoked.");
          console.log("[Razorpay Success Callback] Response received:", JSON.stringify(response));

          if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
            console.error("[Razorpay Success Callback] Missing required signature parameters:", {
              order_id: !!response.razorpay_order_id,
              payment_id: !!response.razorpay_payment_id,
              signature: !!response.razorpay_signature
            });
          }

          setStep("pending");
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            console.log("[Razorpay Success Callback] Outgoing verify-payment payload:", JSON.stringify(verifyPayload));

            // Verify payment signature on backend
            const verifyRes = await fetchWithRetry("/billing/verify-payment", {
              method: "POST",
              body: JSON.stringify(verifyPayload),
            });

            console.log("[Razorpay Success Callback] verify-payment response status:", verifyRes.status);
            const verifyResData = await verifyRes.json();
            console.log("[Razorpay Success Callback] verify-payment response JSON:", JSON.stringify(verifyResData));

            setStep("success");
          } catch (err: any) {
            console.error("[Razorpay Success Callback] Exception during verification step:", err);
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
            setStep("checkout");
          },
        },
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

  /**
   * After payment success, fetch the real license key from backend
   * instead of using a hardcoded placeholder.
   */
  const handleProceedToLicense = async () => {
    setStep("license_loading");

    try {
      const res = await fetchWithRetry("/licenses/my");
      const licenses = await res.json();

      // Take the most recently created license key
      if (licenses && licenses.length > 0) {
        const latest = licenses[licenses.length - 1];
        setActivatedLicenseKey(latest.license_key || latest.key || "");
      } else {
        setActivatedLicenseKey("Pending generation…");
      }

      setStep("activated");
      if (onSuccess) onSuccess();
    } catch {
      // Fallback: proceed to activation even if license fetch fails
      setActivatedLicenseKey("License pending — check your dashboard.");
      setStep("activated");
      if (onSuccess) onSuccess();
    }
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
          licenseKey={activatedLicenseKey}
          onClose={handleCloseAll}
        />
      );
    default:
      return null;
  }
}
export default CheckoutWorkflow;
