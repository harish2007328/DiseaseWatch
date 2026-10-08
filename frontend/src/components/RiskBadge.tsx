import React from 'react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical' | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'sm', showDot = true }) => {
  const normLevel = (level || 'low').toLowerCase();

  const styles = {
    low: {
      bg: 'bg-[#F2F3F5] text-[#374151] border-[#E5E7EB]',
      dot: 'bg-[#6B7280]',
      label: 'Low',
    },
    medium: {
      bg: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
      dot: 'bg-[#D97706]',
      label: 'Medium',
    },
    high: {
      bg: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
      label: 'High',
    },
    critical: {
      bg: 'bg-[#FEF2F2] text-[#7F1D1D] border-[#FCA5A5]',
      dot: 'bg-[#991B1B]',
      label: 'Critical',
    },
  }[normLevel] || {
    bg: 'bg-[#F2F3F5] text-[#374151] border-[#E5E7EB]',
    dot: 'bg-[#6B7280]',
    label: normLevel,
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-xs px-3 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] border ${styles.bg} ${sizeClasses} tracking-tight`}
    >
      {showDot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      )}
      <span>{styles.label}</span>
    </span>
  );
};
