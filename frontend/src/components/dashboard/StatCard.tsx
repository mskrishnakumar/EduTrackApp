import React from 'react';
import { CardLink } from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'orange' | 'cyan';
  link?: { label: string; onClick?: () => void };
}

const iconColorClasses = {
  blue: 'bg-gradient-to-br from-secondary/10 to-blue-600/10 text-secondary',
  green: 'bg-gradient-to-br from-primary/10 to-emerald-600/10 text-primary',
  orange: 'bg-gradient-to-br from-warning/10 to-amber-600/10 text-warning',
  cyan: 'bg-gradient-to-br from-info/10 to-cyan-600/10 text-info',
};

export function StatCard({
  title,
  value,
  change,
  icon,
  iconColor,
  link,
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-card shadow-card border border-black/5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-xs font-medium text-text-secondary mb-2">
            {title}
          </div>
          <div className="text-4xl font-bold tracking-tight leading-none mb-1 text-text-primary">
            {value}
          </div>
          {change && (
            <div className="text-xs text-text-secondary">{change}</div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconColorClasses[iconColor]}`}
        >
          {icon}
        </div>
      </div>
      {link && (
        <CardLink onClick={link.onClick}>{link.label}</CardLink>
      )}
    </div>
  );
}
