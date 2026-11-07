"use client";

import * as React from "react";
import { motion } from "motion/react";

export type AnimationType = "bounce" | "tilt" | "spin" | "pulse" | "glow";

type AnimatedIconProps = React.ComponentPropsWithoutRef<typeof motion.div> & {
  children: React.ReactNode;
  animation?: AnimationType;
};

const animationVariants: Record<AnimationType, any> = {
  bounce: {
    hover: {
      y: -3,
      scale: 1.1,
      transition: { type: "spring" as const, stiffness: 400, damping: 10 },
    },
  },
  tilt: {
    hover: {
      rotate: 15,
      scale: 1.1,
      transition: { type: "spring" as const, stiffness: 300, damping: 12 },
    },
  },
  spin: {
    hover: {
      rotate: 180,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  },
  pulse: {
    hover: {
      scale: [1, 1.18, 1],
      transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" as const },
    },
  },
  glow: {
    hover: {
      scale: 1.12,
      filter: "drop-shadow(0px 0px 8px rgba(225, 251, 21, 0.6))",
      transition: { duration: 0.2 },
    },
  },
};

export function AnimatedIcon({
  children,
  animation = "bounce",
  className,
  style,
  ...props
}: AnimatedIconProps) {
  return (
    <motion.div
      variants={animationVariants[animation]}
      whileHover="hover"
      className={`inline-flex items-center justify-center cursor-pointer ${className || ""}`}
      style={{ color: "#E1FB15", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedIcon;
