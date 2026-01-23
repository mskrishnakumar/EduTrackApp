/**
 * Unified Data Service
 *
 * This service provides a single interface for data operations.
 * In development mode (without VITE_API_URL), it uses mock data.
 * In production or when VITE_API_URL is set, it calls the real API.
 */

import { USE_MOCK_API, api, buildQueryString } from './api';
import { mockApi } from './mockApi';
import type {
  Student,
  Program,
  Milestone,
  Center,
  AttendanceRecord,
  DashboardStats,
  ProgressDataPoint,
  MilestoneStats,
  AttendanceSummary,
  CreateStudentRequest,
  UpdateStudentRequest,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  CreateProgramRequest,
  UpdateProgramRequest,
  MarkAttendanceRequest,
  ApiResponse,
  PaginatedResponse,
  StudentFilters,
  StudentDashboardStats,
  Notification,
  StudentRegistration,
} from '../types';

// Token will be set by AuthContext
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// ==================== Students ====================

export async function getStudents(filters?: StudentFilters): Promise<PaginatedResponse<Student[]>> {
  if (USE_MOCK_API) {
    return mockApi.students.getAll(filters);
  }
  const query = buildQueryString(filters as Record<string, string | number | boolean | undefined> || {});
  return api.getPaginated<Student[]>(`/students${query}`, authToken);
}

export async function getStudent(id: string): Promise<ApiResponse<Student>> {
  if (USE_MOCK_API) {
    return mockApi.students.getOne(id);
  }
  return api.get<Student>(`/students/${id}`, authToken);
}

export async function createStudent(data: CreateStudentRequest): Promise<ApiResponse<Student>> {
  if (USE_MOCK_API) {
    return mockApi.students.create(data);
  }
  return api.post<Student>('/students', data, authToken);
}

export async function updateStudent(id: string, data: UpdateStudentRequest): Promise<ApiResponse<Student>> {
  if (USE_MOCK_API) {
    return mockApi.students.update(id, data);
  }
  return api.put<Student>(`/students/${id}`, data, authToken);
}

export async function deleteStudent(id: string): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.students.delete(id);
  }
  return api.delete<void>(`/students/${id}`, authToken);
}

// ==================== Milestones ====================

export async function getStudentMilestones(studentId: string): Promise<ApiResponse<Milestone[]>> {
  if (USE_MOCK_API) {
    return mockApi.milestones.getByStudent(studentId);
  }
  return api.get<Milestone[]>(`/students/${studentId}/milestones`, authToken);
}

export async function createMilestone(data: CreateMilestoneRequest): Promise<ApiResponse<Milestone>> {
  if (USE_MOCK_API) {
    return mockApi.milestones.create(data);
  }
  return api.post<Milestone>('/milestones', data, authToken);
}

export async function updateMilestone(id: string, data: UpdateMilestoneRequest): Promise<ApiResponse<Milestone>> {
  if (USE_MOCK_API) {
    return mockApi.milestones.update(id, data);
  }
  return api.put<Milestone>(`/milestones/${id}`, data, authToken);
}

export async function deleteMilestone(id: string): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.milestones.delete(id);
  }
  return api.delete<void>(`/milestones/${id}`, authToken);
}

// ==================== Programs ====================

export async function getPrograms(): Promise<ApiResponse<Program[]>> {
  if (USE_MOCK_API) {
    return mockApi.programs.getAll();
  }
  return api.get<Program[]>('/programs', authToken);
}

export async function createProgram(data: CreateProgramRequest): Promise<ApiResponse<Program>> {
  if (USE_MOCK_API) {
    return mockApi.programs.create(data);
  }
  return api.post<Program>('/programs', data, authToken);
}

export async function updateProgram(id: string, data: UpdateProgramRequest): Promise<ApiResponse<Program>> {
  if (USE_MOCK_API) {
    return mockApi.programs.update(id, data);
  }
  return api.put<Program>(`/programs/${id}`, data, authToken);
}

export async function deleteProgram(id: string): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.programs.delete(id);
  }
  return api.delete<void>(`/programs/${id}`, authToken);
}

// ==================== Centers ====================

export interface CreateCenterRequest {
  name: string;
  location: string;
}

export async function getCenters(): Promise<ApiResponse<Center[]>> {
  if (USE_MOCK_API) {
    return mockApi.centers.getAll();
  }
  return api.get<Center[]>('/centers', authToken);
}

export async function createCenter(data: CreateCenterRequest): Promise<ApiResponse<Center>> {
  if (USE_MOCK_API) {
    return mockApi.centers.create(data);
  }
  return api.post<Center>('/centers', data, authToken);
}

// ==================== Attendance ====================

export async function getAttendanceByDate(date: string): Promise<ApiResponse<AttendanceRecord[]>> {
  if (USE_MOCK_API) {
    return mockApi.attendance.getByDate(date);
  }
  return api.get<AttendanceRecord[]>(`/attendance?date=${date}`, authToken);
}

export async function markAttendance(data: MarkAttendanceRequest): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.attendance.mark(data);
  }
  return api.post<void>('/attendance', data, authToken);
}

export async function getAttendanceSummary(): Promise<ApiResponse<AttendanceSummary[]>> {
  if (USE_MOCK_API) {
    return mockApi.attendance.getSummary();
  }
  return api.get<AttendanceSummary[]>('/attendance/summary', authToken);
}

// ==================== Dashboard ====================

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  if (USE_MOCK_API) {
    return mockApi.dashboard.getStats();
  }
  return api.get<DashboardStats>('/dashboard/stats', authToken);
}

// ==================== Analytics ====================

export async function getProgressData(): Promise<ApiResponse<ProgressDataPoint[]>> {
  if (USE_MOCK_API) {
    return mockApi.analytics.getProgressData();
  }
  return api.get<ProgressDataPoint[]>('/analytics/progress', authToken);
}

export async function getMilestoneStats(): Promise<ApiResponse<MilestoneStats[]>> {
  if (USE_MOCK_API) {
    return mockApi.analytics.getMilestoneStats();
  }
  return api.get<MilestoneStats[]>('/analytics/milestones', authToken);
}

// ==================== Student Portal ====================

export async function getStudentDashboard(studentId: string): Promise<ApiResponse<StudentDashboardStats>> {
  if (USE_MOCK_API) {
    return mockApi.studentPortal.getDashboard(studentId);
  }
  return api.get<StudentDashboardStats>(`/student-portal/dashboard/${studentId}`, authToken);
}

export async function getStudentPortalMilestones(studentId: string): Promise<ApiResponse<Milestone[]>> {
  if (USE_MOCK_API) {
    return mockApi.studentPortal.getMilestones(studentId);
  }
  return api.get<Milestone[]>(`/student-portal/milestones/${studentId}`, authToken);
}

export async function getStudentAttendanceHistory(
  studentId: string,
  year: number,
  month: number
): Promise<ApiResponse<AttendanceRecord[]>> {
  if (USE_MOCK_API) {
    return mockApi.studentPortal.getAttendanceHistory(studentId, year, month);
  }
  return api.get<AttendanceRecord[]>(
    `/student-portal/attendance/${studentId}?year=${year}&month=${month}`,
    authToken
  );
}

// ==================== Notifications ====================

export async function getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
  if (USE_MOCK_API) {
    return mockApi.notifications.getAll(userId);
  }
  return api.get<Notification[]>(`/notifications?userId=${userId}`, authToken);
}

export async function markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.notifications.markRead(notificationId);
  }
  return api.put<void>(`/notifications/${notificationId}/read`, {}, authToken);
}

export async function markAllNotificationsRead(userId: string): Promise<ApiResponse<void>> {
  if (USE_MOCK_API) {
    return mockApi.notifications.markAllRead(userId);
  }
  return api.put<void>(`/notifications/mark-all-read`, { userId }, authToken);
}

// ==================== Registrations ====================

export async function getRegistrations(): Promise<ApiResponse<StudentRegistration[]>> {
  if (USE_MOCK_API) {
    return mockApi.registrations.getAll();
  }
  return api.get<StudentRegistration[]>('/registrations', authToken);
}

export async function approveRegistration(
  registrationId: string,
  studentId: string
): Promise<ApiResponse<StudentRegistration>> {
  if (USE_MOCK_API) {
    return mockApi.registrations.approve(registrationId, studentId);
  }
  return api.put<StudentRegistration>(
    `/registrations/${registrationId}/approve`,
    { studentId },
    authToken
  );
}

export async function rejectRegistration(registrationId: string): Promise<ApiResponse<StudentRegistration>> {
  if (USE_MOCK_API) {
    return mockApi.registrations.reject(registrationId);
  }
  return api.put<StudentRegistration>(`/registrations/${registrationId}/reject`, {}, authToken);
}

// Export unified data service
export const dataService = {
  setAuthToken,
  students: {
    getAll: getStudents,
    getOne: getStudent,
    create: createStudent,
    update: updateStudent,
    delete: deleteStudent,
  },
  milestones: {
    getByStudent: getStudentMilestones,
    create: createMilestone,
    update: updateMilestone,
    delete: deleteMilestone,
  },
  programs: {
    getAll: getPrograms,
    create: createProgram,
    update: updateProgram,
    delete: deleteProgram,
  },
  centers: {
    getAll: getCenters,
    create: createCenter,
  },
  attendance: {
    getByDate: getAttendanceByDate,
    mark: markAttendance,
    getSummary: getAttendanceSummary,
  },
  dashboard: {
    getStats: getDashboardStats,
  },
  analytics: {
    getProgressData: getProgressData,
    getMilestoneStats: getMilestoneStats,
  },
  studentPortal: {
    getDashboard: getStudentDashboard,
    getMilestones: getStudentPortalMilestones,
    getAttendanceHistory: getStudentAttendanceHistory,
  },
  notifications: {
    getAll: getNotifications,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
  },
  registrations: {
    getAll: getRegistrations,
    approve: approveRegistration,
    reject: rejectRegistration,
  },
};
