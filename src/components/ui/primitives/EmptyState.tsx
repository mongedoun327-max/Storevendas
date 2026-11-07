import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description?: string;
  /** Primary call to action (usually a button). */
  action?: React.ReactNode;
  /** Compact variant for inline/table empties. */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState — explains why there's no data and invites the next action,
 * instead of leaving a blank panel.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: 'easeOut' }}
    className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'gap-2 px-6 py-10' : 'gap-3 px-6 py-16',
      className,
    )}
  >
    {Icon && (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-faint)]',
          compact ? 'h-11 w-11' : 'h-14 w-14',
        )}
      >
        <Icon size={compact ? 20 : 26} />
      </div>
    )}
    <h3
      className={cn(
        'font-bold text-[var(--color-ink)]',
        compact ? 'text-sm' : 'text-base',
      )}
    >
      {title}
    </h3>
    {description && (
      <p className="max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)] text-pretty">
        {description}
      </p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </motion.div>
);
