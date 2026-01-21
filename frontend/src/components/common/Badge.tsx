import React from 'react';
import { MilestoneType } from '../../types';

interface BadgeProps {
  type: MilestoneType | 'default';
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  academic: 'bg-secondary/10 text-blue-800',
  'life-skills': 'bg-primary/10 text-emerald-700',
  attendance: 'bg-warning/10 text-amber-700',
  default: 'bg-gray-100 text-gray-700',
};

export function Badge({ type, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-3 py-1.5 rounded-badge text-nav font-medium
        ${badgeStyles[type] || badgeStyles.default}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Convenience components for specific milestone types
export function AcademicBadge({ children = 'Academic' }: { children?: React.ReactNode }) {
  return <Badge type="academic">{children}</Badge>;
}

export function LifeSkillsBadge({ children = 'Life Skills' }: { children?: React.ReactNode }) {
  return <Badge type="life-skills">{children}</Badge>;
}

export function AttendanceBadge({ children = 'Attendance' }: { children?: React.ReactNode }) {
  return <Badge type="attendance">{children}</Badge>;
}
