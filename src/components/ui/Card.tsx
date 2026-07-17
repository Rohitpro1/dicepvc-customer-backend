"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animateHover?: boolean;
  floating?: boolean;
  variant?: "default" | "highlighted";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, animateHover = false, floating = false, variant = "default", children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const cardClassName = cn(
      "glass-card rounded-[24px] p-md lg:p-md relative overflow-hidden transition-shadow duration-300",
      variant === "highlighted" && "border-primary bg-primary/5 shadow-2xl shadow-primary/10",
      animateHover && "hover:shadow-2xl hover:shadow-primary/5",
      className
    );

    const isAnimated = animateHover || floating;

    if (isAnimated) {
      const hoverAnim = (animateHover && !shouldReduceMotion) ? { y: -5 } : {};
      
      const floatAnim = (floating && !shouldReduceMotion) 
        ? { y: [0, -6, 0] } 
        : undefined;

      const floatTransition = (floating && !shouldReduceMotion) 
        ? {
            y: {
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }
          }
        : { type: "spring", stiffness: 150, damping: 20 };

      return (
        <motion.div
          ref={ref as any}
          className={cardClassName}
          animate={floatAnim}
          whileHover={hoverAnim}
          transition={floatTransition}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={cardClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
