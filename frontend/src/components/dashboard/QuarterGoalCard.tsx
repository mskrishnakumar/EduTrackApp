import React from 'react';
import { CircularProgress } from '../common/CircularProgress';
import { CardLink } from '../common/Card';

interface QuarterGoalCardProps {
  percentage: number;
  onViewAll?: () => void;
}

export function QuarterGoalCard({ percentage, onViewAll }: QuarterGoalCardProps) {
  return (
    <div className="bg-white p-6 rounded-card shadow-card border border-black/5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="text-center">
        <div className="text-xs font-medium text-text-secondary mb-4">
          Quarter Goal
        </div>
        <CircularProgress percentage={percentage} />
      </div>
      <div className="text-center mt-4">
        <CardLink onClick={onViewAll}>All goals</CardLink>
      </div>
    </div>
  );
}
