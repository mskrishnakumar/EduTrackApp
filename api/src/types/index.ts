// User Types
export type UserRole = 'admin' | 'coordinator';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  centerId: string | null;
  centerName: string | null;
  createdAt: string;
  updatedAt: string;
}

// Center Types
export interface Center {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

// Student Types
export interface Student {
  id: string;
  name: string;
  age: number;
  programId: string;
  programName: string;
  centerId: string;
  centerName: string;
  enrollmentDate: string;
  milestoneCount?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateStudentRequest {
  name: string;
  age: number;
  programId: string;
  enrollmentDate: string;
  centerId?: string;
}

export interface UpdateStudentRequest {
  name?: string;
  age?: number;
  programId?: string;
  enrollmentDate?: string;
  isActive?: boolean;
}

// Milestone Types
export type MilestoneType = 'academic' | 'life-skills' | 'attendance';

export interface Milestone {
  id: string;
  studentId: string;
  studentName?: string;
  type: MilestoneType;
  description: string;
  dateAchieved: string;
  verifiedBy: string;
  centerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneRequest {
  studentId: string;
  type: MilestoneType;
  description: string;
  dateAchieved: string;
  verifiedBy?: string;
}

export interface UpdateMilestoneRequest {
  type?: MilestoneType;
  description?: string;
  dateAchieved?: string;
  verifiedBy?: string;
}

// Program Types
export interface Program {
  id: string;
  name: string;
  description: string;
  studentCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Attendance Types
export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  date: string;
  status: AttendanceStatus;
  centerId: string;
}

export interface MarkAttendanceRequest {
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface RecentMilestone {
  id: string;
  studentId: string;
  studentName: string;
  type: MilestoneType;
  description: string;
  dateAchieved: string;
  createdAt: string;
}

export interface ProgramEnrollment {
  programId: string;
  programName: string;
  studentCount: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalPrograms: number;
  milestonesThisQuarter: number;
  attendanceRate: number;
  quarterGoal: number;
  quarterProgress: number;
  recentMilestones: RecentMilestone[];
  programEnrollment: ProgramEnrollment[];
}

// Azure Table Storage Entity Types
export interface UserEntity {
  partitionKey: string;
  rowKey: string;
  email: string;
  displayName: string;
  role: UserRole;
  centerId: string;
  centerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CenterEntity {
  partitionKey: string; // 'center'
  rowKey: string; // centerId
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEntity {
  partitionKey: string; // centerId
  rowKey: string; // studentId
  name: string;
  age: number;
  programId: string;
  programName: string;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface MilestoneEntity {
  partitionKey: string; // studentId
  rowKey: string; // milestoneId (timestamp-based)
  type: MilestoneType;
  description: string;
  dateAchieved: string;
  verifiedBy: string;
  centerId: string;
  studentName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProgramEntity {
  partitionKey: string; // 'program'
  rowKey: string; // programId
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

// Dual-write attendance entities
export interface AttendanceByDateEntity {
  partitionKey: string; // 'YYYY-MM-DD_centerId'
  rowKey: string; // studentId
  status: AttendanceStatus;
  studentName: string;
  markedAt: string;
  markedBy: string;
}

export interface AttendanceByStudentEntity {
  partitionKey: string; // studentId
  rowKey: string; // 'YYYY-MM-DD'
  status: AttendanceStatus;
  centerId: string;
  markedAt: string;
  markedBy: string;
}
