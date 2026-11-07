/**
 * WORSCOI POS — Design System primitives.
 * Import shared UI from a single entry point:
 *   import { Card, MetricCard, StatusBadge, Button } from '@/components/ui/primitives';
 */
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type { CardProps } from './Card';

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { MetricCard } from './MetricCard';
export type { MetricCardProps } from './MetricCard';

export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, BadgeTone } from './StatusBadge';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Skeleton, MetricCardSkeleton, TableRowSkeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';
