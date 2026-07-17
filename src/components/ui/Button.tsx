"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  animateScale?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      animateScale = true,
      children,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer relative overflow-hidden";

    const variants = {
      primary: "primary-gradient text-white shadow-lg shadow-primary/20 hover:saturate-120",
      secondary: "secondary-glass text-on-surface hover:bg-white/20 border border-white/20 backdrop-blur-md",
      outline: "border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors bg-white/40",
      ghost: "text-on-surface hover:bg-surface-container/50",
      link: "text-primary hover:underline underline-offset-4 font-semibold",
      danger: "bg-error text-on-error hover:bg-error/90 shadow-md shadow-error/15",
    };

    const sizes = {
      sm: "px-sm py-xs text-label-sm",
      md: "px-md py-3 text-label-md",
      lg: "px-lg py-4 text-headline-sm",
      icon: "h-10 w-10 rounded-full",
    };

    const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

    const isShineEnabled = variant === "primary" || variant === "danger";

    if (animateScale && !props.disabled) {
      const hoverAnim = shouldReduceMotion ? {} : { y: -1.5, scale: 1.015 };
      const tapAnim = shouldReduceMotion ? {} : { scale: 0.965 };

      return (
        <motion.button
          ref={ref as any}
          className={combinedClassName}
          whileHover={hoverAnim}
          whileTap={tapAnim}
          {...(props as any)}
        >
          {/* Glass Shine sliding element */}
          {isShineEnabled && (
            <motion.span
              variants={{
                initial: { x: "-100%" },
                hover: { x: "250%" }
              }}
              transition={{
                duration: 1.2,
                ease: "easeInOut",
              }}
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none z-0"
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-xs">
            {children}
          </span>
        </motion.button>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
