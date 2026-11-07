import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantMap: Record<Variant, string> = {
  primary:
    'bg-[var(--color-ink)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-ink)_88%,white)] shadow-[var(--shadow-xs)]',
  brand:
    'bg-[var(--color-brand)] text-[var(--color-brand-contrast)] hover:bg-[var(--color-brand-strong)] shadow-[var(--shadow-xs)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-ink-soft)] border border-[var(--color-line)] hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-line-strong)] shadow-[var(--shadow-xs)]',
  ghost:
    'bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-muted)]',
  danger:
    'bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,black)] shadow-[var(--shadow-xs)]',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[var(--radius-lg)]',
  icon: 'h-10 w-10 rounded-[var(--radius-md)]',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

/**
 * Button — the single button primitive for the app. Consolidates the many
 * ad-hoc button treatments into one consistent, accessible control.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {size !== 'icon' && children}
    </button>
  ),
);
Button.displayName = 'Button';
