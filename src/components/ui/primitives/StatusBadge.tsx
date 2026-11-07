import React from 'react';
import { cn } from '../../../lib/utils';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai';

const toneMap: Record<BadgeTone, string> = {
  neutral:
    'bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)] border-[var(--color-line)]',
  brand:
    'bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)] border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)]',
  success:
    'bg-[var(--color-success-soft)] text-[var(--color-success-ink)] border-[color-mix(in_srgb,var(--color-success)_22%,transparent)]',
  warning:
    'bg-[var(--color-warning-soft)] text-[var(--color-warning-ink)] border-[color-mix(in_srgb,var(--color-warning)_22%,transparent)]',
  danger:
    'bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)] border-[color-mix(in_srgb,var(--color-danger)_22%,transparent)]',
  info:
    'bg-[var(--color-info-soft)] text-[var(--color-info-ink)] border-[color-mix(in_srgb,var(--color-info)_22%,transparent)]',
  ai: 'bg-[var(--color-ai)] text-[var(--color-ai-ink)] border-transparent',
};

const dotMap: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-ink-faint)]',
  brand: 'bg-[var(--color-brand)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger)]',
  info: 'bg-[var(--color-info)]',
  ai: 'bg-[var(--color-ai-ink)]',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Renders a leading status dot. */
  dot?: boolean;
  /** Animates the dot (e.g. "live" / open cash session). */
  pulse?: boolean;
  size?: 'sm' | 'md';
}

/**
 * StatusBadge — one badge to represent all states across the app
 * (order status, payment method, stock level, live indicators…).
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  tone = 'neutral',
  dot = false,
  pulse = false,
  size = 'md',
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      toneMap[tone],
      className,
    )}
    {...props}
  >
    {dot && (
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              dotMap[tone],
            )}
          />
        )}
        <span
          className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotMap[tone])}
        />
      </span>
    )}
    {children}
  </span>
);
