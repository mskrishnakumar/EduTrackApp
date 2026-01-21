import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    warning: 'bg-warning',
    info: 'bg-info',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-2">
          {label && (
            <span className="text-body text-text-primary">{label}</span>
          )}
          {showValue && (
            <span className="text-body font-semibold text-text-primary">{value}</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-bg rounded ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
