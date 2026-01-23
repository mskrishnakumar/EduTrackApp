import { Notification } from '../../types';
import {
  StarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; borderColor: string; iconColor: string }> = {
  milestone: { icon: StarIcon, borderColor: 'border-l-green-500', iconColor: 'text-green-600 bg-green-50' },
  attendance: { icon: CalendarDaysIcon, borderColor: 'border-l-blue-500', iconColor: 'text-blue-600 bg-blue-50' },
  program: { icon: AcademicCapIcon, borderColor: 'border-l-amber-500', iconColor: 'text-amber-600 bg-amber-50' },
  general: { icon: BellIcon, borderColor: 'border-l-gray-400', iconColor: 'text-gray-600 bg-gray-100' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.general;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-start gap-3 p-4 border-l-4 rounded-lg transition-colors cursor-pointer
        ${config.borderColor}
        ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}
      `}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${config.iconColor}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-text-primary' : 'font-semibold text-text-primary'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-text-secondary mt-1.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
      )}
    </div>
  );
}
