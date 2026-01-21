import React from 'react';
import { Badge } from '../common/Badge';
import { Milestone } from '../../types';
import { format } from 'date-fns';

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

const getMilestoneLabel = (type: string) => {
  switch (type) {
    case 'academic':
      return 'Academic';
    case 'life-skills':
      return 'Life Skills';
    case 'attendance':
      return 'Attendance';
    default:
      return type;
  }
};

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="bg-white p-8 rounded-card shadow-card text-center">
        <p className="text-text-secondary">No milestones recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-card shadow-card border border-black/5">
      {milestones.map((milestone, index) => (
        <div
          key={milestone.id}
          className={`
            pl-8 relative pb-8
            border-l-2 ${index === milestones.length - 1 ? 'border-transparent' : 'border-gray-border'}
          `}
        >
          {/* Timeline dot */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-secondary border-[3px] border-white" />

          {/* Content */}
          <div className="bg-gray-bg p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge type={milestone.type}>
                {getMilestoneLabel(milestone.type)}
              </Badge>
              <span className="text-xs text-text-secondary">
                {format(new Date(milestone.dateAchieved), 'MMM d, yyyy')}
              </span>
            </div>
            <p className="text-text-primary mb-2">{milestone.description}</p>
            <p className="text-xs text-text-secondary">
              Verified by {milestone.verifiedBy}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
