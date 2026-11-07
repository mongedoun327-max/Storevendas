import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { BadgeTone } from './StatusBadge';

type Trend = 'up' | 'down' | 'flat';

const accentRing: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]',
  brand: 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  ai: 'bg-[var(--color-ai)] text-[var(--color-ai-ink)]',
};

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  /** Optional lucide icon component. */
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  /** Tone for the icon chip and default delta color. */
  tone?: BadgeTone;
  /** Percentage/label describing change vs. previous period. */
  delta?: string;
  trend?: Trend;
  /** Secondary context line, e.g. "vs. semana passada". */
  hint?: string;
  onClick?: () => void;
  /** Entrance animation order for staggered dashboards. */
  index?: number;
  className?: string;
}

const trendConfig: Record<
  Trend,
  { icon: React.ComponentType<{ className?: string; size?: number }>; color: string }
> = {
  up: { icon: ArrowUpRight, color: 'text-[var(--color-success)]' },
  down: { icon: ArrowDownRight, color: 'text-[var(--color-danger)]' },
  flat: { icon: Minus, color: 'text-[var(--color-ink-muted)]' },
};

/**
 * MetricCard — canonical KPI tile. Shows value, an at-a-glance delta with
 * directional icon, and optional context, with a subtle staggered entrance.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  delta,
  trend = 'flat',
  hint,
  onClick,
  index = 0,
  className,
}) => {
  const TrendIcon = trendConfig[trend].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: 'easeOut' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'group rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200',
        onClick &&
          'cursor-pointer hover:border-[var(--color-line-strong)] hover:shadow-[var(--shadow-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-200 group-hover:scale-105',
              accentRing[tone],
            )}
          >
            <Icon size={18} />
          </div>
        )}
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold',
              trendConfig[trend].color,
            )}
          >
            <TrendIcon size={13} />
            {delta}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p
        data-numeric
        className="mt-1 text-2xl font-black leading-tight tracking-tight text-[var(--color-ink)]"
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[11px] font-medium text-[var(--color-ink-faint)]">
          {hint}
        </p>
      )}
    </motion.div>
  );
};
