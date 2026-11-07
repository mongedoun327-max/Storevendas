import React from 'react';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  meta?: string;
  featured?: boolean;
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  meta,
  featured = false,
  className = '',
  onClick,
}) => {
  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`kpi ${featured ? 'kpi--featured' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value" data-numeric="true">
        {value}
      </strong>
      {meta ? <span className="kpi__meta">{meta}</span> : <div />}
    </article>
  );
};

export default KpiCard;
