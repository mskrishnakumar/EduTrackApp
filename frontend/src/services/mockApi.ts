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

import {
  mockStudents,
  mockPrograms,
  mockMilestones,
  mockCenters,
  mockDashboardStats,
  mockRecentActivity,
  mockProgramEnrollment,
  mockProgressData,
  mockMilestoneStats,
  mockAttendanceSummary,
  generateAttendanceForDate,
  delay,
  generateId,
} from './mockData';

// In-memory state (simulates database)
let students = [...mockStudents];
let programs = [...mockPrograms];
let milestones = [...mockMilestones];
let centers = [...mockCenters];
const attendanceByDate: Record<string, AttendanceRecord[]> = {};

// Simulate network delay
const MOCK_DELAY = 300;

// ==================== Students ====================

export async function getStudents(filters?: StudentFilters): Promise<PaginatedResponse<Student[]>> {
  await delay(MOCK_DELAY);

  let filtered = students.filter((s) => s.isActive);

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
  }

  if (filters?.programId) {
    filtered = filtered.filter((s) => s.programId === filters.programId);
  }

  if (filters?.centerId) {
    filtered = filtered.filter((s) => s.centerId === filters.centerId);
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const startIndex = (page - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
  };
}

export async function getStudent(id: string): Promise<ApiResponse<Student>> {
  await delay(MOCK_DELAY);

  const student = students.find((s) => s.id === id);
  if (!student) {
    return { success: false, error: 'Student not found' };
  }

  return { success: true, data: student };
}

export async function createStudent(data: CreateStudentRequest): Promise<ApiResponse<Student>> {
  await delay(MOCK_DELAY);

  const program = programs.find((p) => p.id === data.programId);
  const center = centers[0]; // Default to first center for mock

  const newStudent: Student = {
    id: generateId(),
    name: data.name,
    age: data.age,
    programId: data.programId,
    programName: program?.name || 'Unknown Program',
    centerId: data.centerId || center.id,
    centerName: center.name,
    enrollmentDate: data.enrollmentDate,
    milestoneCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  students.push(newStudent);
  return { success: true, data: newStudent };
}

export async function updateStudent(id: string, data: UpdateStudentRequest): Promise<ApiResponse<Student>> {
  await delay(MOCK_DELAY);

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Student not found' };
  }

  const program = data.programId ? programs.find((p) => p.id === data.programId) : null;

  students[index] = {
    ...students[index],
    ...data,
    ...(program && { programName: program.name }),
    updatedAt: new Date().toISOString(),
  };

  return { success: true, data: students[index] };
}

export async function deleteStudent(id: string): Promise<ApiResponse<void>> {
  await delay(MOCK_DELAY);

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Student not found' };
  }

  students[index] = { ...students[index], isActive: false };
  return { success: true, message: 'Student deleted' };
}

// ==================== Milestones ====================

export async function getStudentMilestones(studentId: string): Promise<ApiResponse<Milestone[]>> {
  await delay(MOCK_DELAY);

  const studentMilestones = milestones.filter((m) => m.studentId === studentId);
  return { success: true, data: studentMilestones };
}

export async function createMilestone(data: CreateMilestoneRequest): Promise<ApiResponse<Milestone>> {
  await delay(MOCK_DELAY);

  const student = students.find((s) => s.id === data.studentId);
  if (!student) {
    return { success: false, error: 'Student not found' };
  }

  const newMilestone: Milestone = {
    id: generateId(),
    studentId: data.studentId,
    studentName: student.name,
    type: data.type,
    description: data.description,
    dateAchieved: data.dateAchieved,
    verifiedBy: data.verifiedBy,
    centerId: student.centerId,
    createdAt: new Date().toISOString(),
    createdBy: 'mock-user',
  };

  milestones.push(newMilestone);

  // Update student milestone count
  const studentIndex = students.findIndex((s) => s.id === data.studentId);
  if (studentIndex !== -1) {
    students[studentIndex] = {
      ...students[studentIndex],
      milestoneCount: (students[studentIndex].milestoneCount || 0) + 1,
    };
  }

  return { success: true, data: newMilestone };
}

export async function deleteMilestone(id: string): Promise<ApiResponse<void>> {
  await delay(MOCK_DELAY);

  const index = milestones.findIndex((m) => m.id === id);
  if (index === -1) {
    return { success: false, error: 'Milestone not found' };
  }

  const milestone = milestones[index];
  milestones.splice(index, 1);

  // Update student milestone count
  const studentIndex = students.findIndex((s) => s.id === milestone.studentId);
  if (studentIndex !== -1) {
    students[studentIndex] = {
      ...students[studentIndex],
      milestoneCount: Math.max(0, (students[studentIndex].milestoneCount || 0) - 1),
    };
  }

  return { success: true, message: 'Milestone deleted' };
}

// ==================== Programs ====================

export async function getPrograms(): Promise<ApiResponse<Program[]>> {
  await delay(MOCK_DELAY);

  const activePrograms = programs.filter((p) => p.isActive);
  return { success: true, data: activePrograms };
}

export async function createProgram(data: CreateProgramRequest): Promise<ApiResponse<Program>> {
  await delay(MOCK_DELAY);

  const newProgram: Program = {
    id: generateId(),
    name: data.name,
    description: data.description,
    enrollmentCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'mock-user',
  };

  programs.push(newProgram);
  return { success: true, data: newProgram };
}

export async function updateProgram(id: string, data: UpdateProgramRequest): Promise<ApiResponse<Program>> {
  await delay(MOCK_DELAY);

  const index = programs.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: 'Program not found' };
  }

  programs[index] = {
    ...programs[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return { success: true, data: programs[index] };
}

export async function deleteProgram(id: string): Promise<ApiResponse<void>> {
  await delay(MOCK_DELAY);

  const index = programs.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: 'Program not found' };
  }

  programs[index] = { ...programs[index], isActive: false };
  return { success: true, message: 'Program deleted' };
}

// ==================== Centers ====================

export async function getCenters(): Promise<ApiResponse<Center[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: centers };
}

// ==================== Attendance ====================

export async function getAttendanceByDate(date: string): Promise<ApiResponse<AttendanceRecord[]>> {
  await delay(MOCK_DELAY);

  if (!attendanceByDate[date]) {
    // Generate default attendance for new dates
    attendanceByDate[date] = generateAttendanceForDate(date);
  }

  return { success: true, data: attendanceByDate[date] };
}

export async function markAttendance(data: MarkAttendanceRequest): Promise<ApiResponse<void>> {
  await delay(MOCK_DELAY);

  const existingRecords = attendanceByDate[data.date] || generateAttendanceForDate(data.date);

  for (const record of data.records) {
    const index = existingRecords.findIndex((r) => r.studentId === record.studentId);
    if (index !== -1) {
      existingRecords[index] = {
        ...existingRecords[index],
        status: record.status,
        markedBy: 'mock-user',
        markedAt: new Date().toISOString(),
      };
    }
  }

  attendanceByDate[data.date] = existingRecords;
  return { success: true, message: 'Attendance marked' };
}

export async function getAttendanceSummary(): Promise<ApiResponse<AttendanceSummary[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockAttendanceSummary };
}

// ==================== Dashboard ====================

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockDashboardStats };
}

export async function getRecentActivity(): Promise<ApiResponse<RecentActivity[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockRecentActivity };
}

export async function getProgramEnrollment(): Promise<ApiResponse<ProgramEnrollment[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockProgramEnrollment };
}

// ==================== Analytics ====================

export async function getProgressData(): Promise<ApiResponse<ProgressDataPoint[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockProgressData };
}

export async function getMilestoneStats(): Promise<ApiResponse<MilestoneStats[]>> {
  await delay(MOCK_DELAY);

  return { success: true, data: mockMilestoneStats };
}

// Export all mock functions as a unified API
export const mockApi = {
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
