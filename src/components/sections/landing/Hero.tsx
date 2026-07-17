"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, CheckCircle2, Printer } from "lucide-react";
import ShaderCanvas from "@/components/custom/ShaderCanvas";
import { Button } from "@/components/ui/Button";
import { useParallax } from "@/hooks/useParallax";

export default function Hero() {
  const { rotation, handleMouseMove } = useParallax(15);

  return (
    <header 
      onMouseMove={handleMouseMove}
      className="relative min-h-[921px] flex flex-col items-center justify-center pt-32 pb-xl px-md overflow-hidden"
    >
      {/* Animated Shader Canvas Background */}
      <div className="absolute inset-0 w-full h-full -z-10 opacity-30">
        <ShaderCanvas className="w-full h-full" />
      </div>
      
      {/* Atmosphere Vignette */}
      <div className="absolute inset-0 bg-gradient-to-tr from-inverse-surface/5 via-transparent to-transparent pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl text-center space-y-md z-10"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-label-sm uppercase tracking-widest font-semibold">
          v5.2 Platinum Edition
        </span>
        <h1 className="font-display-lg text-display-lg md:text-[64px] font-extrabold tracking-tight leading-[1.05] text-on-surface">
          India's Most Advanced <br />{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Aadhaar PVC Card
          </span>{" "}
          Generation
        </h1>
        <p className="text-on-surface-variant text-body-lg max-w-2xl mx-auto leading-relaxed">
          The enterprise-standard for Aadhaar PVC printing. Intelligent OCR processing, seamless printer integration, and bulk automation for modern printing hubs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">Start Free Trial</Button>
          </Link>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            View Demo
          </Button>
        </div>
      </motion.div>

      {/* Floating UI Preview with 3D Tilt Parallax */}
      <div className="relative mt-xl w-full max-w-5xl h-64 md:h-[450px] z-10 flex justify-center">
        <motion.div 
          style={{ 
            transformStyle: "preserve-3d",
            perspective: 1000,
            rotateY: rotation.x, 
            rotateX: -rotation.y 
          }}
          transition={{ type: "spring", stiffness: 100, damping: 25 }}
          className="w-[80%] aspect-video bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl relative"
        >
          <div 
            className="w-full h-full bg-cover bg-center rounded-lg shadow-inner" 
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPpChEu19o1C-WBiSpQSFi9gE--dRNStVXwYL_9pS_Q9XP8Blp_Fdd2QsabNHQ54TBBBXsA5f2p2epnuveF7zmHdUsOtNNr9-h0Tbg52SAN6C8JwrthLOBXnXMqMcqagbTg9Nk_rnydWShFM572BSSLvyVnPxTiCtW83--7wBtSON1W8BJnG_c1-6czPGGRd17YVv32nf0T9BoEoFn-zZ_GC4mysosJF34TlS_5MEyF53wnH1P938R')" 
            }}
          ></div>
          
          {/* Floating Detail Badge 1 */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="hidden lg:flex absolute -top-8 -right-8 glass-card p-4 rounded-xl shadow-xl w-64 items-center gap-3 border border-white/20"
          >
            <CheckCircle2 className="w-6 h-6 text-secondary fill-secondary/10" />
            <div className="flex-1">
              <span className="font-label-md block font-bold">OCR Verification</span>
              <div className="w-full h-1.5 bg-secondary/20 rounded-full overflow-hidden mt-1">
                <div className="w-full h-full bg-secondary"></div>
              </div>
            </div>
          </motion.div>

          {/* Floating Detail Badge 2 */}
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="hidden lg:flex absolute bottom-8 -left-12 glass-card p-4 rounded-xl shadow-xl w-56 items-center gap-3 border border-white/20"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Printer className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md font-bold">Printer Ready</span>
              <span className="text-[10px] text-on-surface-variant font-semibold">Evolis Primacy 2</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
