import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  UsersIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const adminNavItems = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: Squares2X2Icon },
  { path: ROUTES.STUDENTS, label: 'Students', icon: UsersIcon },
  { path: ROUTES.PROGRAMS, label: 'Programs', icon: AcademicCapIcon },
  { path: ROUTES.CENTERS, label: 'Centers', icon: BuildingOfficeIcon },
  { path: ROUTES.MILESTONES, label: 'Milestones', icon: CheckCircleIcon },
  { path: ROUTES.ATTENDANCE, label: 'Attendance', icon: CalendarIcon },
  { path: ROUTES.REPORTS, label: 'Reports', icon: DocumentTextIcon },
];

const studentNavItems = [
  { path: ROUTES.STUDENT_DASHBOARD, label: 'My Dashboard', icon: Squares2X2Icon },
  { path: ROUTES.STUDENT_MILESTONES, label: 'My Milestones', icon: CheckCircleIcon },
  { path: ROUTES.STUDENT_ATTENDANCE, label: 'My Attendance', icon: CalendarIcon },
  { path: ROUTES.STUDENT_NOTIFICATIONS, label: 'Notifications', icon: BellIcon },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = user?.role === 'student' ? studentNavItems : adminNavItems;

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD || path === ROUTES.STUDENT_DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-50
        bg-white border-r border-gray-100
        flex flex-col
        transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Brand Icon */}
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold text-text-primary tracking-tight">
                EduTrack
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-all"
          >
            <Bars3Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="relative">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-nav placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={`
              flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-md
              text-nav transition-all duration-200
              ${isActive(path)
                ? 'bg-warning-light text-amber-800 font-medium'
                : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }
            `}
          >
            <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive(path) ? 'opacity-100' : 'opacity-70'}`} />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        {/* User Profile */}
        <div className={`flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-body font-semibold flex-shrink-0">
            {user ? getInitials(user.displayName) : 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h4 className="text-nav font-medium text-text-primary truncate">
                {user?.displayName || 'User'}
              </h4>
              <span className="inline-block bg-warning-light text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'student' ? 'Student' : 'Coordinator'}
              </span>
            </div>
          )}
        </div>

        {/* Settings / Profile */}
        <NavLink
          to={user?.role === 'student' ? ROUTES.STUDENT_PROFILE : ROUTES.SETTINGS}
          className={`
            flex items-center gap-3 px-3 py-2.5 mt-2 rounded-md
            text-nav text-text-secondary
            hover:bg-gray-50 hover:text-text-primary
            transition-all duration-200
          `}
        >
          {user?.role === 'student' ? (
            <UserCircleIcon className="w-[18px] h-[18px] opacity-70" />
          ) : (
            <Cog6ToothIcon className="w-[18px] h-[18px] opacity-70" />
          )}
          {!isCollapsed && <span>{user?.role === 'student' ? 'My Profile' : 'Settings'}</span>}
        </NavLink>

        {/* Logout */}
        <button
          onClick={signOut}
          className={`
            w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md
            bg-red-50 text-red-600 border border-red-100
            text-nav font-medium
            hover:bg-red-100 hover:border-red-200
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
