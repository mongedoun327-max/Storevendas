import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'priority-high'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  label,
  className = '',
}) => {
  const variantClass =
    variant === 'neutral' ? 'badge' : `badge badge--${variant}`;

  return <span className={`${variantClass} ${className}`}>{label}</span>;
};

export default Badge;
