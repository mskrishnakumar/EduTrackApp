import { useState, useMemo } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem } from '../components/student/NotificationItem';
import { Button } from '../components/common/Button';
import { NotificationType } from '../types';

const FILTER_BUTTONS: { key: NotificationType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'milestone', label: 'Milestones' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'program', label: 'Program' },
];

export function StudentNotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-text-secondary mt-1">
            Stay updated on your milestones and attendance
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-card shadow-card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTER_BUTTONS.map(btn => (
            <button
              key={btn.key}
              onClick={() => setActiveFilter(btn.key)}
              className={`px-4 py-2 rounded-input text-sm font-medium transition-all ${
                activeFilter === btn.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-bg text-text-secondary hover:bg-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-card shadow-card p-4 space-y-2">
          {filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-card shadow-card text-center">
          <p className="text-text-secondary text-lg mb-2">No notifications</p>
          <p className="text-text-secondary text-sm">
            {activeFilter === 'all'
              ? "You're all caught up! New notifications will appear here."
              : `No ${activeFilter} notifications yet.`}
          </p>
        </div>
      )}
    </div>
  );
}
