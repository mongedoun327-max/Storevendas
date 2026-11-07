import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional leading icon shown in a branded chip. */
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  /** Optional status/element rendered next to the title. */
  badge?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — standard title block used at the top of every view so all
 * pages share the same rhythm, icon treatment, and action placement.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  badge,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: 'easeOut' }}
    className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
      className,
    )}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-ink)] text-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-black tracking-tight text-[var(--color-ink)] text-balance">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-ink-muted)] text-pretty">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
    )}
  </motion.div>
);
