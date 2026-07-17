"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/sections/landing/Navbar";
import Hero from "@/components/sections/landing/Hero";
import Features from "@/components/sections/landing/Features";
import HowItWorks from "@/components/sections/landing/HowItWorks";
import PrinterCarousel from "@/components/custom/PrinterCarousel";
import Testimonials from "@/components/sections/landing/Testimonials";
import FAQ from "@/components/sections/landing/FAQ";
import { PricingCard } from "@/components/ui/PricingCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function Home() {
  const plans = [
    {
      name: "Starter",
      subtitle: "For small CSC centers",
      price: "₹999",
      period: "/month",
      features: [
        { text: "500 Cards / month", included: true },
        { text: "Auto PDF Unlock", included: true },
        { text: "Email Support", included: true },
      ],
      isRecommended: false,
      ctaText: "Get Started",
    },
    {
      name: "Lifetime",
      subtitle: "Ultimate Precision",
      price: "₹9,999",
      period: "/one-time",
      features: [
        { text: "Unlimited Card Gen", included: true },
        { text: "5th Gen Features", included: true },
        { text: "Bulk Processing Pro", included: true },
        { text: "24/7 Priority Support", included: true },
        { text: "Lifetime Free Updates", included: true },
      ],
      isRecommended: true,
      ctaText: "Go Unlimited",
    },
    {
      name: "Professional",
      subtitle: "For growing print hubs",
      price: "₹2,499",
      period: "/month",
      features: [
        { text: "5,000 Cards / month", included: true },
        { text: "Bulk Batch Export", included: true },
        { text: "Priority WhatsApp", included: true },
      ],
      isRecommended: false,
      ctaText: "Get Started",
    },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary/20 selection:text-primary font-sans relative overflow-x-hidden">
      {/* Frosted Navigation Bar */}
      <Navbar />

      {/* Hero Section with Parallax tilt */}
      <Hero />

      {/* Trusted By Operators */}
      <section className="py-lg border-y border-outline-variant/10 bg-white/30">
        <div className="max-w-container-max mx-auto px-md text-center">
          <p className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-md font-semibold">
            Trusted by 12,000+ Printing Hubs Across India
          </p>
          <div className="flex flex-wrap justify-center items-center gap-xl opacity-40 grayscale hover:opacity-75 transition-all select-none">
            <span className="font-headline-sm font-bold text-outline">CSC OPERATOR</span>
            <span className="font-headline-sm font-bold text-outline">UTI ITSL</span>
            <span className="font-headline-sm font-bold text-outline">MAHA ONLINE</span>
            <span className="font-headline-sm font-bold text-outline">AP ONLINE</span>
            <span className="font-headline-sm font-bold text-outline">STUDIO ASSOC.</span>
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <ScrollReveal delay={0.1}>
        <Features />
      </ScrollReveal>

      {/* How It Works process steps */}
      <ScrollReveal delay={0.15}>
        <HowItWorks />
      </ScrollReveal>

      {/* Infinite scrolling printers banner */}
      <ScrollReveal delay={0.1}>
        <PrinterCarousel />
      </ScrollReveal>

      {/* Pricing comparison sections */}
      <ScrollReveal delay={0.1}>
        <section className="py-xl px-md bg-surface" id="pricing">
          <div className="max-w-container-max mx-auto text-center mb-xl space-y-xs">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Invest in Growth</h2>
            <p className="text-on-surface-variant text-body-md">Plans that scale with your business volume.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-base md:gap-md items-stretch">
            {plans.map((plan, idx) => (
              <Link key={idx} href="/login" className="block h-full">
                <PricingCard
                  name={plan.name}
                  subtitle={plan.subtitle}
                  price={plan.price}
                  period={plan.period}
                  features={plan.features}
                  isRecommended={plan.isRecommended}
                  ctaText={plan.ctaText}
                  floating={plan.isRecommended}
                />
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Reviews quotes */}
      <ScrollReveal delay={0.15}>
        <Testimonials />
      </ScrollReveal>

      {/* Frequently Asked Questions accordion */}
      <ScrollReveal delay={0.1}>
        <FAQ />
      </ScrollReveal>

      {/* Footer Branding Links */}
      <footer className="bg-surface border-t border-outline-variant/20 py-xl px-lg">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start gap-xl">
          <div className="max-w-xs space-y-4">
            <span className="font-label-md text-label-md font-bold text-primary block">DicePVC AI</span>
            <p className="text-on-surface-variant text-label-sm leading-relaxed">
              Precision Crafted Security for the next generation of identification printing. India's #1 trusted software for PVC generation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-xl">
            <div className="space-y-4">
              <p className="font-label-md font-bold text-on-surface">Product</p>
              <ul className="space-y-2 text-label-sm text-on-surface-variant font-medium">
                <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
                <li><a className="hover:text-primary transition-colors" href="#pricing">Pricing</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Enterprise</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="font-label-md font-bold text-on-surface">Resources</p>
              <ul className="space-y-2 text-label-sm text-on-surface-variant font-medium">
                <li><a className="hover:text-primary transition-colors" href="#">Docs</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Tutorials</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Support</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="font-label-md font-bold text-on-surface">Company</p>
              <ul className="space-y-2 text-label-sm text-on-surface-variant font-medium">
                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-container-max mx-auto pb-md px-lg text-center md:text-left text-on-surface-variant text-label-sm font-medium border-t border-outline-variant/10 pt-4 mt-xl">
          © 2026 DicePVC AI. Precision Crafted Security.
        </div>
      </footer>
    </div>
  );
}
