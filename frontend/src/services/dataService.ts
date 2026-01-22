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
  RecentActivity,
  ProgramEnrollment,
  ProgressDataPoint,
  MilestoneStats,
  AttendanceSummary,
  CreateStudentRequest,
  UpdateStudentRequest,
  CreateMilestoneRequest,
  CreateProgramRequest,
  UpdateProgramRequest,
  MarkAttendanceRequest,
  ApiResponse,
  PaginatedResponse,
  StudentFilters,
} from '../types';

// Token will be set by AuthContext
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  console.log('[DataService] setAuthToken called:', token ? `token length ${token.length}` : 'null');
  if (token) {
    try {
      const header = JSON.parse(atob(token.split('.')[0]));
      console.log('[DataService] Token header:', { alg: header.alg, kid: header.kid });
    } catch (e) {
      console.log('[DataService] Could not decode token header');
    }
  }
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

export async function getCenters(): Promise<ApiResponse<Center[]>> {
  if (USE_MOCK_API) {
    return mockApi.centers.getAll();
  }
  return api.get<Center[]>('/centers', authToken);
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

export async function getRecentActivity(): Promise<ApiResponse<RecentActivity[]>> {
  if (USE_MOCK_API) {
    return mockApi.dashboard.getRecentActivity();
  }
  return api.get<RecentActivity[]>('/dashboard/activity', authToken);
}

export async function getProgramEnrollment(): Promise<ApiResponse<ProgramEnrollment[]>> {
  if (USE_MOCK_API) {
    return mockApi.dashboard.getProgramEnrollment();
  }
  return api.get<ProgramEnrollment[]>('/dashboard/enrollment', authToken);
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
  },
  attendance: {
    getByDate: getAttendanceByDate,
    mark: markAttendance,
    getSummary: getAttendanceSummary,
  },
  dashboard: {
    getStats: getDashboardStats,
    getRecentActivity: getRecentActivity,
    getProgramEnrollment: getProgramEnrollment,
  },
  analytics: {
    getProgressData: getProgressData,
    getMilestoneStats: getMilestoneStats,
  },
};
