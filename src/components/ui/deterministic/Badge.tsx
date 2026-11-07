import React from "react";

type ForbiddenVisualProps = {
  color?: never;
  backgroundColor?: never;
  bg?: never;
  borderColor?: never;
  icon?: never;
  leftIcon?: never;
  rightIcon?: never;
  showDot?: never;
  dotColor?: never;
  gradient?: never;
};

export type BadgeVariant =
  | "neutral"
  | "priority-high"
  | "success"
  | "warning"
  | "danger";

export interface BadgeProps extends ForbiddenVisualProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "neutral", label, className = "" }) => {
  const variantClass =
    variant === "neutral" ? "badge" : `badge badge--${variant}`;
  return <span className={`${variantClass} ${className}`.trim()}>{label}</span>;
};
