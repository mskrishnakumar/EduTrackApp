import React from 'react';
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { RecentMilestone } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface RecentActivityProps {
  activities: RecentMilestone[];
  onViewAll?: () => void;
}

export function RecentActivity({ activities, onViewAll }: RecentActivityProps) {
  const { getTranslatedDescription } = useLanguage();

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

  if (activities.length === 0) {
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
        <div className="py-8 text-center text-text-secondary">
          No recent milestones recorded.
        </div>
      </Card>
    );
  }

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
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge type={activity.type}>
                {activity.type === 'life-skills'
                  ? 'Life Skills'
                  : activity.type.charAt(0).toUpperCase() +
                    activity.type.slice(1)}
              </Badge>
              <span className="text-body text-text-primary">
                {getTranslatedDescription(activity.description, activity.descriptionTranslations)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
