import React from 'react';
import { Card, CardHeader } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { ProgramEnrollment } from '../../types';

interface QuickStatsProps {
  programs: ProgramEnrollment[];
}

const colorMap: Record<number, 'primary' | 'secondary' | 'warning' | 'info'> = {
  0: 'secondary',
  1: 'primary',
  2: 'warning',
  3: 'info',
};

export function QuickStats({ programs }: QuickStatsProps) {
  // Find max enrollment for percentage calculation
  const maxEnrollment = Math.max(...programs.map((p) => p.enrollmentCount));

  return (
    <Card>
      <CardHeader title="Quick Stats" />
      <div className="space-y-6">
        {programs.map((program, index) => (
          <ProgressBar
            key={program.programId}
            label={program.programName}
            value={program.enrollmentCount}
            max={maxEnrollment}
            color={colorMap[index % 4]}
          />
        ))}
      </div>
    </Card>
  );
}
