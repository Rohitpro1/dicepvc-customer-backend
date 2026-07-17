"use client";

import React from "react";
import { motion } from "framer-motion";

export default function RevenueChart() {
  const points = [
    { x: 200, y: 230, label: "MAY 08", val: "$1.2M", color: "#0058bc" },
    { x: 400, y: 180, label: "MAY 15", val: "$1.4M", color: "#0058bc" },
    { x: 600, y: 150, label: "MAY 22", val: "$1.5M", color: "#00C7BE" },
    { x: 800, y: 200, label: "MAY 30", val: "$1.3M", color: "#00C7BE" },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 chart-gradient" />

      {/* SVG Drawing Area */}
      <svg
        className="absolute bottom-0 left-0 w-full h-2/3"
        preserveAspectRatio="none"
        viewBox="0 0 1000 300"
      >
        <defs>
          <linearGradient id="chartLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0058bc" />
            <stop offset="100%" stopColor="#00C7BE" />
          </linearGradient>
          <linearGradient id="chartFillGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0058bc" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0058bc" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded Area underneath the path */}
        <motion.path
          d="M0,250 Q100,200 200,230 T400,180 T600,150 T800,200 T1000,120 V300 H0 Z"
          fill="url(#chartFillGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Animated Line Path */}
        <motion.path
          d="M0,250 Q100,200 200,230 T400,180 T600,150 T800,200 T1000,120"
          fill="none"
          stroke="url(#chartLineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Interactive Circles */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <motion.circle
              cx={pt.x}
              cy={pt.y}
              r="6"
              fill={pt.color}
              stroke="#ffffff"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + idx * 0.15, type: "spring", stiffness: 300 }}
              whileHover={{ r: 9, strokeWidth: 3 }}
              className="cursor-pointer"
            />
          </g>
        ))}
      </svg>

      {/* Axis Dates */}
      <div className="absolute bottom-4 left-0 w-full px-md flex justify-between text-on-surface-variant/30 font-label-sm pointer-events-none select-none">
        <span>MAY 01</span>
        <span>MAY 08</span>
        <span>MAY 15</span>
        <span>MAY 22</span>
        <span>MAY 30</span>
      </div>
    </div>
  );
}
