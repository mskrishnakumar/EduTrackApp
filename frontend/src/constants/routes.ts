export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/',
  STUDENTS: '/students',
  STUDENT_DETAIL: '/students/:id',
  PROGRAMS: '/programs',
  CENTERS: '/centers',
  MILESTONES: '/milestones',
  ATTENDANCE: '/attendance',
  ANALYTICS: '/analytics',
  REGISTRATIONS: '/registrations',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  // Student portal routes
  STUDENT_DASHBOARD: '/my-dashboard',
  STUDENT_MILESTONES: '/my-milestones',
  STUDENT_ATTENDANCE: '/my-attendance',
  STUDENT_PROFILE: '/my-profile',
  STUDENT_NOTIFICATIONS: '/my-notifications',
} as const;

export const getStudentDetailRoute = (id: string) => `/students/${id}`;
