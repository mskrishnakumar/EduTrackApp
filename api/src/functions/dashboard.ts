// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { verifyAuth, getQueryCenterId } from '../middleware/auth';
import { getTableClient, TABLES } from '../services/tableStorage';
import { StudentEntity, MilestoneEntity, ProgramEntity, AttendanceByDateEntity, ApiResponse, DashboardStats, RecentMilestone, ProgramEnrollment } from '../types';

// GET /api/dashboard/stats - Get dashboard statistics
export const getDashboardStats: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const queryCenterId = getQueryCenterId(user);

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const milestonesTable = getTableClient(TABLES.MILESTONES);
    const programsTable = getTableClient(TABLES.PROGRAMS);
    const attendanceByDateTable = getTableClient(TABLES.ATTENDANCE_BY_DATE);

    // Get student count
    let totalStudents = 0;
    const studentFilter = queryCenterId
      ? `PartitionKey eq '${queryCenterId}' and isActive eq true`
      : 'isActive eq true';

    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: studentFilter }
    });

    const studentIds: string[] = [];
    for await (const student of studentIterator) {
      totalStudents++;
      studentIds.push(student.rowKey);
    }

    // Get milestone count for this quarter
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterStartStr = quarterStart.toISOString();

    let milestonesThisQuarter = 0;
    const recentMilestones: RecentMilestone[] = [];

    // Get milestones for accessible students
    for (const studentId of studentIds) {
      const milestoneIterator = milestonesTable.listEntities<MilestoneEntity>({
        queryOptions: { filter: `PartitionKey eq '${studentId}'` }
      });

      for await (const milestone of milestoneIterator) {
        if (milestone.createdAt >= quarterStartStr) {
          milestonesThisQuarter++;
        }

        // Collect for recent milestones (we'll sort and limit later)
        recentMilestones.push({
          id: milestone.rowKey,
          studentId: milestone.partitionKey,
          studentName: '', // Will be populated later
          type: milestone.type,
          description: milestone.description,
          dateAchieved: milestone.dateAchieved,
          createdAt: milestone.createdAt,
        });
      }
    }

    // Get student names for recent milestones
    const studentNameMap = new Map<string, string>();
    const studentNameIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: studentFilter }
    });
    for await (const student of studentNameIterator) {
      studentNameMap.set(student.rowKey, student.name);
    }

    // Sort and limit recent milestones
    recentMilestones.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedRecentMilestones = recentMilestones.slice(0, 10).map(m => ({
      ...m,
      studentName: studentNameMap.get(m.studentId) || 'Unknown Student',
    }));

    // Get program enrollment counts
    const programEnrollment: ProgramEnrollment[] = [];
    const programIterator = programsTable.listEntities<ProgramEntity>({
      queryOptions: { filter: `PartitionKey eq 'program' and isActive eq true` }
    });

    const programs: Array<{ id: string; name: string }> = [];
    for await (const program of programIterator) {
      programs.push({ id: program.rowKey, name: program.name });
    }

    // Count students per program
    const programCounts = new Map<string, number>();
    const studentProgramIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: studentFilter }
    });

    for await (const student of studentProgramIterator) {
      const count = programCounts.get(student.programId) || 0;
      programCounts.set(student.programId, count + 1);
    }

    for (const program of programs) {
      programEnrollment.push({
        programId: program.id,
        programName: program.name,
        studentCount: programCounts.get(program.id) || 0,
      });
    }

    // Sort by student count descending
    programEnrollment.sort((a, b) => b.studentCount - a.studentCount);

    // Get today's attendance rate
    const today = new Date().toISOString().split('T')[0];
    let presentCount = 0;
    let totalMarked = 0;

    if (queryCenterId) {
      const partitionKey = `${today}_${queryCenterId}`;
      const attendanceIterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
        queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
      });
      for await (const entity of attendanceIterator) {
        totalMarked++;
        if (entity.status === 'present') {
          presentCount++;
        }
      }
    } else {
      const attendanceIterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
        queryOptions: { filter: `PartitionKey ge '${today}_' and PartitionKey lt '${today}~'` }
      });
      for await (const entity of attendanceIterator) {
        totalMarked++;
        if (entity.status === 'present') {
          presentCount++;
        }
      }
    }

    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    // Calculate quarter goal progress (example: 50 milestones per quarter)
    const quarterGoal = 50;
    const quarterProgress = Math.min(Math.round((milestonesThisQuarter / quarterGoal) * 100), 100);

    const stats: DashboardStats = {
      totalStudents,
      totalPrograms: programs.length,
      milestonesThisQuarter,
      attendanceRate,
      quarterGoal,
      quarterProgress,
      recentMilestones: limitedRecentMilestones,
      programEnrollment,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching dashboard stats:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch dashboard stats' } };
  }
};

// GET /api/analytics/progress - Get progress data for charts
export const getProgressAnalytics: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const queryCenterId = getQueryCenterId(user);

  // Get date range (default to last 6 months)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  const startDateParam = req.query.startDate;
  const endDateParam = req.query.endDate;

  if (startDateParam) {
    startDate.setTime(new Date(startDateParam).getTime());
  }
  if (endDateParam) {
    endDate.setTime(new Date(endDateParam).getTime());
  }

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const milestonesTable = getTableClient(TABLES.MILESTONES);
    const attendanceByDateTable = getTableClient(TABLES.ATTENDANCE_BY_DATE);

    // Get student IDs for filtering milestones
    const studentFilter = queryCenterId
      ? `PartitionKey eq '${queryCenterId}' and isActive eq true`
      : 'isActive eq true';

    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: studentFilter }
    });

    const studentIds: string[] = [];
    for await (const student of studentIterator) {
      studentIds.push(student.rowKey);
    }

    // Get milestones grouped by month
    const milestonesByMonth: Record<string, { academic: number; lifeSkills: number; attendance: number }> = {};

    for (const studentId of studentIds) {
      const milestoneIterator = milestonesTable.listEntities<MilestoneEntity>({
        queryOptions: { filter: `PartitionKey eq '${studentId}'` }
      });

      for await (const milestone of milestoneIterator) {
        const date = new Date(milestone.dateAchieved);
        if (date >= startDate && date <= endDate) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!milestonesByMonth[monthKey]) {
            milestonesByMonth[monthKey] = { academic: 0, lifeSkills: 0, attendance: 0 };
          }

          if (milestone.type === 'academic') {
            milestonesByMonth[monthKey].academic++;
          } else if (milestone.type === 'life-skills') {
            milestonesByMonth[monthKey].lifeSkills++;
          } else if (milestone.type === 'attendance') {
            milestonesByMonth[monthKey].attendance++;
          }
        }
      }
    }

    // Convert to array for chart
    const milestoneProgress = Object.entries(milestonesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
        total: data.academic + data.lifeSkills + data.attendance,
      }));

    // Get attendance trends by week
    const attendanceByWeek: Record<string, { present: number; absent: number }> = {};

    // Iterate through dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!attendanceByWeek[weekKey]) {
        attendanceByWeek[weekKey] = { present: 0, absent: 0 };
      }

      // Get attendance for this date
      if (queryCenterId) {
        const partitionKey = `${dateStr}_${queryCenterId}`;
        const attendanceIterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
          queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
        });
        for await (const entity of attendanceIterator) {
          if (entity.status === 'present') {
            attendanceByWeek[weekKey].present++;
          } else {
            attendanceByWeek[weekKey].absent++;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const attendanceTrends = Object.entries(attendanceByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        ...data,
        rate: data.present + data.absent > 0
          ? Math.round((data.present / (data.present + data.absent)) * 100)
          : 0,
      }));

    // Get milestone breakdown by type
    let academicTotal = 0;
    let lifeSkillsTotal = 0;
    let attendanceTotal = 0;

    for (const data of Object.values(milestonesByMonth)) {
      academicTotal += data.academic;
      lifeSkillsTotal += data.lifeSkills;
      attendanceTotal += data.attendance;
    }

    const milestoneBreakdown = [
      { type: 'Academic', count: academicTotal, color: '#3B82F6' },
      { type: 'Life Skills', count: lifeSkillsTotal, color: '#10B981' },
      { type: 'Attendance', count: attendanceTotal, color: '#F59E0B' },
    ];

    const response: ApiResponse<{
      milestoneProgress: typeof milestoneProgress;
      attendanceTrends: typeof attendanceTrends;
      milestoneBreakdown: typeof milestoneBreakdown;
    }> = {
      success: true,
      data: {
        milestoneProgress,
        attendanceTrends,
        milestoneBreakdown,
      },
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching analytics:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch analytics' } };
  }
};
