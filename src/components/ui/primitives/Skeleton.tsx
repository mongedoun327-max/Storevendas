import React from 'react';
import { cn } from '../../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton — content-shaped loading placeholder. Compose these to mirror
 * the real layout instead of showing a generic spinner.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn(
      'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)]',
      className,
    )}
    {...props}
  />
);

/** Ready-made skeleton matching the MetricCard footprint. */
export const MetricCardSkeleton: React.FC = () => (
  <div className="rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-9 rounded-[var(--radius-md)]" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <Skeleton className="mt-4 h-3 w-24" />
    <Skeleton className="mt-3 h-7 w-32" />
  </div>
);

/** Ready-made skeleton for table rows. */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 4,
}) => (
  <div className="flex items-center gap-4 px-4 py-3.5">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-3.5', i === 0 ? 'w-1/3' : 'flex-1')}
      />
    ))}
  </div>
);
