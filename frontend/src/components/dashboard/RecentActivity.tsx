import React from 'react';
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { RecentActivity as RecentActivityType } from '../../types';

interface RecentActivityProps {
  activities: RecentActivityType[];
  onViewAll?: () => void;
}

export function RecentActivity({ activities, onViewAll }: RecentActivityProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        action={
          <button
            onClick={onViewAll}
            className="text-primary text-body font-medium hover:text-primary-dark hover:underline"
          >
            View all
          </button>
        }
      />
      <div className="space-y-0">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 border-l-[3px] border-gray-border mb-4 last:mb-0"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-primary">
                {activity.studentName}
              </span>
              <span className="text-xs text-text-secondary">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge type={activity.milestoneType}>
                {activity.milestoneType === 'life-skills'
                  ? 'Life Skills'
                  : activity.milestoneType.charAt(0).toUpperCase() +
                    activity.milestoneType.slice(1)}
              </Badge>
              <span className="text-body text-text-primary">
                {activity.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
