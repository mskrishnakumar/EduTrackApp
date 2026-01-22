import type {
  Student,
  Program,
  Milestone,
  Center,
  AttendanceRecord,
  DashboardStats,
  RecentMilestone,
  ProgramEnrollment,
  ProgressDataPoint,
  MilestoneStats,
  AttendanceSummary,
} from '../types';

// Mock Centers
export const mockCenters: Center[] = [
  { id: 'center-1', name: 'Downtown Learning Center', location: 'Downtown', isActive: true, createdAt: '2024-01-01' },
  { id: 'center-2', name: 'Westside Education Hub', location: 'West District', isActive: true, createdAt: '2024-01-15' },
];

// Mock Programs
export const mockPrograms: Program[] = [
  { id: 'prog-1', name: 'Foundation Skills', description: 'Basic literacy and numeracy', enrollmentCount: 45, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin' },
  { id: 'prog-2', name: 'Digital Literacy', description: 'Computer and internet skills', enrollmentCount: 38, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin' },
  { id: 'prog-3', name: 'Life Skills Development', description: 'Personal and social skills', enrollmentCount: 32, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin' },
  { id: 'prog-4', name: 'Career Readiness', description: 'Job preparation and vocational training', enrollmentCount: 28, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin' },
];

// Mock Students
export const mockStudents: Student[] = [
  { id: 'stu-1', name: 'Alex Johnson', age: 14, programId: 'prog-1', programName: 'Foundation Skills', centerId: 'center-1', centerName: 'Downtown Learning Center', enrollmentDate: '2024-02-15', milestoneCount: 8, createdAt: '2024-02-15', updatedAt: '2024-02-15', isActive: true },
  { id: 'stu-2', name: 'Maria Garcia', age: 15, programId: 'prog-2', programName: 'Digital Literacy', centerId: 'center-1', centerName: 'Downtown Learning Center', enrollmentDate: '2024-01-10', milestoneCount: 12, createdAt: '2024-01-10', updatedAt: '2024-01-10', isActive: true },
  { id: 'stu-3', name: 'James Wilson', age: 13, programId: 'prog-3', programName: 'Life Skills Development', centerId: 'center-1', centerName: 'Downtown Learning Center', enrollmentDate: '2024-03-01', milestoneCount: 5, createdAt: '2024-03-01', updatedAt: '2024-03-01', isActive: true },
  { id: 'stu-4', name: 'Emily Brown', age: 16, programId: 'prog-4', programName: 'Career Readiness', centerId: 'center-2', centerName: 'Westside Education Hub', enrollmentDate: '2024-01-20', milestoneCount: 15, createdAt: '2024-01-20', updatedAt: '2024-01-20', isActive: true },
  { id: 'stu-5', name: 'David Lee', age: 14, programId: 'prog-1', programName: 'Foundation Skills', centerId: 'center-2', centerName: 'Westside Education Hub', enrollmentDate: '2024-02-28', milestoneCount: 6, createdAt: '2024-02-28', updatedAt: '2024-02-28', isActive: true },
  { id: 'stu-6', name: 'Sarah Martinez', age: 15, programId: 'prog-2', programName: 'Digital Literacy', centerId: 'center-1', centerName: 'Downtown Learning Center', enrollmentDate: '2024-04-05', milestoneCount: 3, createdAt: '2024-04-05', updatedAt: '2024-04-05', isActive: true },
  { id: 'stu-7', name: 'Michael Chen', age: 13, programId: 'prog-3', programName: 'Life Skills Development', centerId: 'center-2', centerName: 'Westside Education Hub', enrollmentDate: '2024-03-15', milestoneCount: 7, createdAt: '2024-03-15', updatedAt: '2024-03-15', isActive: true },
  { id: 'stu-8', name: 'Jessica Taylor', age: 16, programId: 'prog-4', programName: 'Career Readiness', centerId: 'center-1', centerName: 'Downtown Learning Center', enrollmentDate: '2024-01-05', milestoneCount: 18, createdAt: '2024-01-05', updatedAt: '2024-01-05', isActive: true },
];

// Mock Milestones
export const mockMilestones: Milestone[] = [
  { id: 'ms-1', studentId: 'stu-1', studentName: 'Alex Johnson', type: 'academic', description: 'Completed reading level assessment', dateAchieved: '2024-03-10', verifiedBy: 'Ms. Smith', centerId: 'center-1', createdAt: '2024-03-10', createdBy: 'admin' },
  { id: 'ms-2', studentId: 'stu-2', studentName: 'Maria Garcia', type: 'life-skills', description: 'Demonstrated leadership in group project', dateAchieved: '2024-03-12', verifiedBy: 'Mr. Davis', centerId: 'center-1', createdAt: '2024-03-12', createdBy: 'admin' },
  { id: 'ms-3', studentId: 'stu-3', studentName: 'James Wilson', type: 'attendance', description: 'Perfect attendance for March', dateAchieved: '2024-03-31', verifiedBy: 'Ms. Johnson', centerId: 'center-1', createdAt: '2024-03-31', createdBy: 'admin' },
  { id: 'ms-4', studentId: 'stu-4', studentName: 'Emily Brown', type: 'academic', description: 'Passed digital skills certification', dateAchieved: '2024-03-15', verifiedBy: 'Mr. Thompson', centerId: 'center-2', createdAt: '2024-03-15', createdBy: 'admin' },
  { id: 'ms-5', studentId: 'stu-1', studentName: 'Alex Johnson', type: 'life-skills', description: 'Completed conflict resolution workshop', dateAchieved: '2024-03-20', verifiedBy: 'Ms. Smith', centerId: 'center-1', createdAt: '2024-03-20', createdBy: 'admin' },
  { id: 'ms-6', studentId: 'stu-5', studentName: 'David Lee', type: 'academic', description: 'Achieved math proficiency level 3', dateAchieved: '2024-03-25', verifiedBy: 'Mr. Brown', centerId: 'center-2', createdAt: '2024-03-25', createdBy: 'admin' },
  { id: 'ms-7', studentId: 'stu-8', studentName: 'Jessica Taylor', type: 'academic', description: 'Completed job interview preparation', dateAchieved: '2024-03-28', verifiedBy: 'Ms. Wilson', centerId: 'center-1', createdAt: '2024-03-28', createdBy: 'admin' },
  { id: 'ms-8', studentId: 'stu-2', studentName: 'Maria Garcia', type: 'attendance', description: 'Consistent attendance for Q1', dateAchieved: '2024-03-30', verifiedBy: 'Mr. Davis', centerId: 'center-1', createdAt: '2024-03-30', createdBy: 'admin' },
];

// Generate attendance records for a date
export function generateAttendanceForDate(date: string): AttendanceRecord[] {
  return mockStudents.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    date,
    status: Math.random() > 0.15 ? 'present' : 'absent',
    centerId: student.centerId,
    markedBy: 'System',
    markedAt: date,
  }));
}

// Mock Recent Milestones
export const mockRecentMilestones: RecentMilestone[] = [
  { id: '1', studentId: 'stu-8', studentName: 'Jessica Taylor', type: 'academic', description: 'Completed job interview preparation', dateAchieved: '2024-03-28', createdAt: '2024-03-28T14:30:00Z' },
  { id: '2', studentId: 'stu-2', studentName: 'Maria Garcia', type: 'attendance', description: 'Consistent attendance for Q1', dateAchieved: '2024-03-30', createdAt: '2024-03-30T09:00:00Z' },
  { id: '3', studentId: 'stu-5', studentName: 'David Lee', type: 'academic', description: 'Achieved math proficiency level 3', dateAchieved: '2024-03-25', createdAt: '2024-03-25T11:15:00Z' },
  { id: '4', studentId: 'stu-1', studentName: 'Alex Johnson', type: 'life-skills', description: 'Completed conflict resolution workshop', dateAchieved: '2024-03-20', createdAt: '2024-03-20T16:45:00Z' },
  { id: '5', studentId: 'stu-4', studentName: 'Emily Brown', type: 'academic', description: 'Passed digital skills certification', dateAchieved: '2024-03-15', createdAt: '2024-03-15T10:00:00Z' },
];

// Mock Program Enrollment
export const mockProgramEnrollment: ProgramEnrollment[] = [
  { programId: 'prog-1', programName: 'Foundation Skills', studentCount: 45 },
  { programId: 'prog-2', programName: 'Digital Literacy', studentCount: 38 },
  { programId: 'prog-3', programName: 'Life Skills Development', studentCount: 32 },
  { programId: 'prog-4', programName: 'Career Readiness', studentCount: 28 },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalStudents: 143,
  totalPrograms: 4,
  milestonesThisQuarter: 47,
  attendanceRate: 92,
  quarterGoal: 50,
  quarterProgress: 73,
  recentMilestones: mockRecentMilestones,
  programEnrollment: mockProgramEnrollment,
};

// Mock Progress Data for Analytics
export const mockProgressData: ProgressDataPoint[] = [
  { month: 'Jan', milestones: 32, attendance: 92 },
  { month: 'Feb', milestones: 38, attendance: 89 },
  { month: 'Mar', milestones: 47, attendance: 94 },
  { month: 'Apr', milestones: 41, attendance: 91 },
  { month: 'May', milestones: 52, attendance: 93 },
  { month: 'Jun', milestones: 45, attendance: 88 },
];

// Mock Milestone Stats
export const mockMilestoneStats: MilestoneStats[] = [
  { type: 'academic', count: 89, percentage: 52 },
  { type: 'life-skills', count: 54, percentage: 32 },
  { type: 'attendance', count: 28, percentage: 16 },
];

// Mock Attendance Summary
export const mockAttendanceSummary: AttendanceSummary[] = mockStudents.map((student) => ({
  studentId: student.id,
  studentName: student.name,
  totalDays: 60,
  presentDays: Math.floor(50 + Math.random() * 10),
  absentDays: 0, // Will be calculated
  attendanceRate: 0, // Will be calculated
})).map((summary) => ({
  ...summary,
  absentDays: summary.totalDays - summary.presentDays,
  attendanceRate: Math.round((summary.presentDays / summary.totalDays) * 100),
}));

// Helper to simulate API delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to generate UUID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
