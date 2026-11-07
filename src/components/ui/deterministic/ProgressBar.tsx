import React from "react";

type ForbiddenVisualProps = {
  color?: never;
  backgroundColor?: never;
  bg?: never;
  borderColor?: never;
  gradient?: never;
};

export interface ProgressBarProps extends ForbiddenVisualProps {
  currentValue: number;
  targetValue: number;
  onDarkSurface?: boolean;
  ariaLabel: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentValue,
  targetValue,
  onDarkSurface = false,
  ariaLabel,
  className = "",
}) => {
  const rawPercent =
    targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const clampedWidth = Math.min(100, Math.max(0, rawPercent));

  return (
    <div
      className={`${
        onDarkSurface ? "progress-track progress-track--on-dark" : "progress-track"
      } ${className}`.trim()}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(rawPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={
          onDarkSurface ? "progress-fill progress-fill--accent" : "progress-fill"
        }
        style={{ width: `${clampedWidth.toFixed(2)}%` }}
      />
    </div>
  );
};
