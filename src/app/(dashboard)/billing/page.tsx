"use client";

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PricingCard } from "@/components/ui/PricingCard";
import { Card } from "@/components/ui/Card";
import ActiveLicenseCard from "@/components/sections/billing/ActiveLicenseCard";
import SetupGuide from "@/components/sections/billing/SetupGuide";
import { useCheckout } from "@/hooks/useCheckout";
import { CheckoutWorkflow } from "@/components/custom/checkout/CheckoutWorkflow";

export default function BillingPage() {
  const {
    showCheckout,
    startCheckout,
    cancelCheckout,
  } = useCheckout(3000);

  const planFeatures = {
    standard: [
      { text: "5 Active Licenses", included: true },
      { text: "Basic AI Generation", included: true },
      { text: "Advanced Forensics", included: false },
      { text: "API Priority Access", included: false },
    ],
    pro: [
      { text: "Unlimited Licenses", included: true },
      { text: "Neural Core Engine", included: true },
      { text: "24/7 Threat Monitoring", included: true },
      { text: "Multi-device Sync", included: true },
    ],
    custom: [
      { text: "Bespoke infrastructure and on-premise solutions for high-security environments.", included: true },
    ],
  };

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-x-hidden max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="font-display-lg text-display-lg mb-base text-primary font-bold">License &amp; Subscription</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Manage your premium AI security tools, view activation statuses, and upgrade your plan to unlock more precise crafting capabilities.
          </p>
        </div>
        <div className="flex items-center gap-sm bg-surface-container-high p-sm rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-label-md font-bold text-on-surface">Standard Plan</p>
            <p className="text-label-sm text-on-surface-variant font-medium">Active until Oct 2025</p>
          </div>
        </div>
      </header>

      {/* Plans Comparison */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-md mb-xl">
        <Card className="lg:col-span-12" animateHover={false}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-lg gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold">Compare Plans</h2>
            <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/20">
              <button className="px-6 py-2 rounded-full bg-white shadow-sm font-label-md transition-all font-semibold">Monthly</button>
              <button className="px-6 py-2 rounded-full text-on-surface-variant font-label-md hover:text-primary transition-all font-semibold">Yearly (Save 20%)</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <PricingCard
              name="Standard"
              subtitle="Individual"
              price="$49"
              period="/month"
              features={planFeatures.standard}
              ctaText="Current Plan"
            />
            <PricingCard
              name="Enterprise Pro"
              subtitle="Professional"
              price="$129"
              period="/month"
              features={planFeatures.pro}
              isRecommended
              ctaText="Upgrade Now"
              onCtaClick={startCheckout}
            />
            <PricingCard
              name="Custom"
              subtitle="Tailored"
              price="Contact"
              period=""
              features={planFeatures.custom}
              ctaText="Contact Sales"
            />
          </div>
        </Card>
      </section>

      {/* License Management & Setup Guides */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md items-start">
        <ActiveLicenseCard />
        <SetupGuide />
      </section>

      {/* SECURE CHECKOUT WORKFLOW */}
      <CheckoutWorkflow
        isOpen={showCheckout}
        onClose={cancelCheckout}
        planName="Enterprise Pro"
        price="$129.00"
      />

      {/* Shared Footer */}
      <footer className="bg-surface border-t border-outline-variant/20 py-xl px-lg mt-xl">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex flex-col gap-xs items-center md:items-start">
            <span className="font-label-md text-label-md font-bold text-primary select-none">DicePVC AI</span>
            <span className="text-on-surface-variant text-label-sm">© 2026 DicePVC AI. Precision Crafted Security.</span>
          </div>
          <div className="flex gap-lg font-semibold">
            <a className="text-on-surface-variant text-label-sm hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant text-label-sm hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="text-on-surface-variant text-label-sm hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Security</a>
            <a className="text-on-surface-variant text-label-sm hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
