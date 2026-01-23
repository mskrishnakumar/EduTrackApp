// User Types
export type UserRole = 'admin' | 'coordinator' | 'student';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  centerId: string | null;
  centerName: string | null;
  studentId: string | null;
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
  email?: string;
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
  centerId?: string; // Optional for admin, auto-set for coordinator
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
  descriptionTranslations?: Record<string, string>; // { "hi": "Hindi", "ta": "Tamil", "te": "Telugu" }
  originalLanguage?: string; // Detected language of original description
  dateAchieved: string;
  verifiedBy: string;
  centerId: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateMilestoneRequest {
  studentId: string;
  type: MilestoneType;
  description: string;
  dateAchieved: string;
  verifiedBy: string;
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
  enrollmentCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateProgramRequest {
  name: string;
  description: string;
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
  markedBy: string;
  markedAt: string;
}

export interface MarkAttendanceRequest {
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
  }>;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
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
  descriptionTranslations?: Record<string, string>;
  originalLanguage?: string;
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

// Legacy types for backwards compatibility with mock data
export interface RecentActivity {
  id: string;
  studentId: string;
  studentName: string;
  milestoneType: MilestoneType;
  description: string;
  timestamp: string;
}

// Analytics Types
export interface ProgressDataPoint {
  month: string;
  milestones: number;
  attendance: number;
}

export interface MilestoneStats {
  type: MilestoneType;
  count: number;
  percentage: number;
}

// Filter Types
export interface StudentFilters {
  search?: string;
  programId?: string;
  centerId?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceFilters {
  date?: string;
  studentId?: string;
  centerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  programId?: string;
  centerId?: string;
}

// Notification Types
export type NotificationType = 'milestone' | 'attendance' | 'program' | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

// Student Dashboard Types
export interface StudentDashboardStats {
  studentName: string;
  programName: string;
  centerName: string;
  enrollmentDate: string;
  totalMilestones: number;
  milestonesThisQuarter: number;
  attendanceRate: number;
  totalDaysPresent: number;
  totalDaysAbsent: number;
  totalDays: number;
  recentMilestones: Milestone[];
}

// Student Registration Types
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface StudentRegistration {
  id: string;
  email: string;
  displayName: string;
  status: RegistrationStatus;
  studentId?: string;
  createdAt: string;
}

// OAuth Types
export type OAuthResolveStatus = 'active' | 'pending_approval' | 'rejected';

export interface OAuthResolveResponse {
  status: OAuthResolveStatus;
  role?: UserRole;
  studentId?: string;
  displayName?: string;
  autoLinked?: boolean;
  registrationId?: string;
}
