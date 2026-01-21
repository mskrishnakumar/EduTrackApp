export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  STUDENTS: '/students',
  STUDENT_DETAIL: '/students/:id',
  PROGRAMS: '/programs',
  ATTENDANCE: '/attendance',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const getStudentDetailRoute = (id: string) => `/students/${id}`;
