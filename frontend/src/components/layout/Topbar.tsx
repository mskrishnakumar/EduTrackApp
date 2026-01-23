import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROUTES } from '../../constants/routes';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.STUDENTS]: 'Students',
  [ROUTES.PROGRAMS]: 'Programs',
  [ROUTES.ANALYTICS]: 'Analytics',
  [ROUTES.ATTENDANCE]: 'Attendance',
  [ROUTES.REPORTS]: 'Reports',
  [ROUTES.SETTINGS]: 'Settings',
  [ROUTES.STUDENT_DASHBOARD]: 'My Dashboard',
  [ROUTES.STUDENT_MILESTONES]: 'My Milestones',
  [ROUTES.STUDENT_ATTENDANCE]: 'My Attendance',
  [ROUTES.STUDENT_PROFILE]: 'My Profile',
  [ROUTES.STUDENT_NOTIFICATIONS]: 'Notifications',
};

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    // Check for student detail page
    if (location.pathname.startsWith('/students/')) {
      return 'Student Detail';
    }
    // Default based on role
    return user?.role === 'student' ? 'My Dashboard' : 'Dashboard';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-[72px] bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left side - Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="w-5 h-5 text-text-secondary" />
        </button>
        <span className="text-nav font-medium text-text-primary">
          {getPageTitle()}
        </span>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={user?.role === 'student' ? 'Search milestones...' : 'Search students...'}
            className="w-72 pl-10 pr-4 py-2.5 border-[1.5px] border-gray-border rounded-input text-nav bg-white placeholder:text-gray-400 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all"
          />
        </div>

        {/* Settings */}
        <button className="w-10 h-10 rounded-input bg-gray-bg flex items-center justify-center text-text-secondary hover:bg-gray-200 hover:text-text-primary transition-all">
          <Cog6ToothIcon className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => user?.role === 'student' && navigate(ROUTES.STUDENT_NOTIFICATIONS)}
          className="w-10 h-10 rounded-input bg-gray-bg flex items-center justify-center text-text-secondary hover:bg-gray-200 hover:text-text-primary transition-all relative"
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 rounded-full text-white text-[10px] font-bold border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
          {user ? getInitials(user.displayName) : 'RC'}
        </button>
      </div>
    </header>
  );
}
