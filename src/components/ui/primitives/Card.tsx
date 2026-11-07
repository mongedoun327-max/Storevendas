import React from 'react';
import { cn } from '../../../lib/utils';

type Elevation = 'flat' | 'sm' | 'md' | 'lg';

const elevationMap: Record<Elevation, string> = {
  flat: 'shadow-none',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
  lg: 'shadow-[var(--shadow-lg)]',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Discreet elevation. Defaults to `sm`. */
  elevation?: Elevation;
  /** Adds an interactive hover/press treatment for clickable cards. */
  interactive?: boolean;
}

/**
 * Card — the base surface primitive for the WORSCOI design system.
 * Uses semantic surface/line tokens so every panel shares one look.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 'sm', interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface)]',
        elevationMap[elevation],
        interactive &&
          'cursor-pointer transition-all duration-200 hover:border-[var(--color-line-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.995]',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('flex flex-col gap-1 px-5 pt-5', className)}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      'text-sm font-bold tracking-tight text-[var(--color-ink)]',
      className,
    )}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn('text-xs leading-relaxed text-[var(--color-ink-muted)]', className)}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('px-5 py-4', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center gap-2 border-t border-[var(--color-hairline)] px-5 py-3.5',
      className,
    )}
    {...props}
  />
);
