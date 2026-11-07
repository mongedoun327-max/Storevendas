import React from "react";

type ForbiddenVisualProps = {
  color?: never;
  backgroundColor?: never;
  bg?: never;
  borderColor?: never;
  icon?: never;
  leftIcon?: never;
  rightIcon?: never;
  showDot?: never;
  dotColor?: never;
  gradient?: never;
};

export interface KpiCardProps extends ForbiddenVisualProps {
  label: string;
  value: string;
  meta?: string;
  featured?: boolean;
  className?: string;
  progress?: never;
  badge?: never;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  meta,
  featured = false,
  className = "",
}) => {
  return (
    <article className={`${featured ? "kpi kpi--featured" : "kpi"} ${className}`.trim()}>
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value" data-numeric="true">
        {value}
      </strong>
      {meta ? <span className="kpi__meta">{meta}</span> : null}
    </article>
  );
};
