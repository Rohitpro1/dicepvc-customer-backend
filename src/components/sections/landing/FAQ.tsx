"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does it support all printer brands?",
      a: "Yes, DicePVC is designed with a universal print driver. It supports Evolis, Zebra, Fargo, Datacard, Hiti, and even local thermal inkjet printers with specialized PVC trays."
    },
    {
      q: "Is the software compliant with data security?",
      a: "Absolutely. All processing happens locally on your machine. We do not store any Aadhaar data or PDF files on our servers. Your privacy and your customers' security are our priority."
    },
    {
      q: "Can I use it on multiple computers?",
      a: "Professional and Lifetime plans allow for multiple device activations. The Lifetime plan supports up to 3 simultaneous workstations for high-volume hubs."
    }
  ];

  return (
    <section className="py-xl px-md max-w-4xl mx-auto" id="faq">
      <h2 className="font-headline-md text-headline-md text-center font-bold mb-xl text-on-surface">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx}
            className="glass-card rounded-2xl border border-white/20 overflow-hidden transition-all duration-300"
          >
            <button 
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="w-full text-left p-md font-headline-sm font-semibold cursor-pointer flex justify-between items-center select-none text-on-surface hover:text-primary transition-colors focus:outline-none"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-outline transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-primary" : ""}`} />
            </button>
            <motion.div 
              initial={false}
              animate={{ height: openFaq === idx ? "auto" : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-md pb-md text-on-surface-variant leading-relaxed font-body-md border-t border-outline-variant/10 pt-4">
                {faq.a}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
