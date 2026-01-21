import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { verifyAuth, checkCenterAccess, getQueryCenterId } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { AttendanceRecord, AttendanceByDateEntity, AttendanceByStudentEntity, MarkAttendanceRequest, ApiResponse, StudentEntity } from '../types';

// GET /api/attendance - Get attendance by date or student
export const getAttendance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const date = req.query.date;
  const studentId = req.query.studentId;

  if (!date && !studentId) {
    context.res = { status: 400, body: { success: false, error: 'Either date or studentId parameter is required' } };
    return;
  }

  try {
    const records: AttendanceRecord[] = [];

    if (date) {
      // Get attendance by date
      const attendanceByDateTable = getTableClient(TABLES.ATTENDANCE_BY_DATE);
      const queryCenterId = getQueryCenterId(user);

      if (queryCenterId) {
        // Coordinator: get attendance for their center only
        const partitionKey = `${date}_${queryCenterId}`;
        const iterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
          queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
        });

        for await (const entity of iterator) {
          records.push({
            studentId: entity.rowKey,
            studentName: entity.studentName || '',
            date: date,
            status: entity.status,
            centerId: queryCenterId,
          });
        }
      } else {
        // Admin: get all attendance for the date
        const iterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
          queryOptions: { filter: `PartitionKey ge '${date}_' and PartitionKey lt '${date}~'` }
        });

        for await (const entity of iterator) {
          const centerId = entity.partitionKey.split('_')[1];
          records.push({
            studentId: entity.rowKey,
            studentName: entity.studentName || '',
            date: date,
            status: entity.status,
            centerId: centerId,
          });
        }
      }
    } else if (studentId) {
      // Get attendance history for a student
      // First verify access to the student
      const studentsTable = getTableClient(TABLES.STUDENTS);
      const studentIterator = studentsTable.listEntities<StudentEntity>({
        queryOptions: { filter: `RowKey eq '${studentId}'` }
      });

      let studentCenterId: string | null = null;
      let studentName = '';
      for await (const student of studentIterator) {
        studentCenterId = student.partitionKey;
        studentName = student.name;
        break;
      }

      if (!studentCenterId) {
        context.res = { status: 404, body: { success: false, error: 'Student not found' } };
        return;
      }

      if (!checkCenterAccess(user, studentCenterId)) {
        context.res = { status: 403, body: { success: false, error: 'Access denied to this student' } };
        return;
      }

      // Get attendance history
      const attendanceByStudentTable = getTableClient(TABLES.ATTENDANCE_BY_STUDENT);
      const iterator = attendanceByStudentTable.listEntities<AttendanceByStudentEntity>({
        queryOptions: { filter: `PartitionKey eq '${studentId}'` }
      });

      for await (const entity of iterator) {
        records.push({
          studentId: studentId,
          studentName: studentName,
          date: entity.rowKey,
          status: entity.status,
          centerId: studentCenterId,
        });
      }

      // Sort by date descending
      records.sort((a, b) => b.date.localeCompare(a.date));
    }

    const response: ApiResponse<AttendanceRecord[]> = {
      success: true,
      data: records,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching attendance:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch attendance' } };
  }
};

// POST /api/attendance - Mark attendance (batch)
export const markAttendance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const body = req.body as MarkAttendanceRequest;

    // Validate required fields
    if (!body.date || !body.records || !Array.isArray(body.records) || body.records.length === 0) {
      context.res = { status: 400, body: { success: false, error: 'Date and attendance records are required' } };
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      context.res = { status: 400, body: { success: false, error: 'Invalid date format. Use YYYY-MM-DD' } };
      return;
    }

    const attendanceByDateTable = getTableClient(TABLES.ATTENDANCE_BY_DATE);
    const attendanceByStudentTable = getTableClient(TABLES.ATTENDANCE_BY_STUDENT);
    const studentsTable = getTableClient(TABLES.STUDENTS);

    // Process each attendance record
    const results: AttendanceRecord[] = [];
    const errors: string[] = [];

    for (const record of body.records) {
      try {
        // Validate status
        if (!['present', 'absent'].includes(record.status)) {
          errors.push(`Invalid status for student ${record.studentId}`);
          continue;
        }

        // Get student info
        const studentIterator = studentsTable.listEntities<StudentEntity>({
          queryOptions: { filter: `RowKey eq '${record.studentId}'` }
        });

        let studentCenterId: string | null = null;
        let studentName = '';
        for await (const student of studentIterator) {
          studentCenterId = student.partitionKey;
          studentName = student.name;
          break;
        }

        if (!studentCenterId) {
          errors.push(`Student ${record.studentId} not found`);
          continue;
        }

        if (!checkCenterAccess(user, studentCenterId)) {
          errors.push(`Access denied for student ${record.studentId}`);
          continue;
        }

        // Dual-write: write to both tables
        const now = new Date().toISOString();

        // Write to attendance by date table
        const byDateEntity: AttendanceByDateEntity = {
          partitionKey: `${body.date}_${studentCenterId}`,
          rowKey: record.studentId,
          status: record.status,
          studentName: studentName,
          markedAt: now,
          markedBy: user.id,
        };

        await attendanceByDateTable.upsertEntity(byDateEntity, 'Replace');

        // Write to attendance by student table
        const byStudentEntity: AttendanceByStudentEntity = {
          partitionKey: record.studentId,
          rowKey: body.date,
          status: record.status,
          centerId: studentCenterId,
          markedAt: now,
          markedBy: user.id,
        };

        await attendanceByStudentTable.upsertEntity(byStudentEntity, 'Replace');

        results.push({
          studentId: record.studentId,
          studentName: studentName,
          date: body.date,
          status: record.status,
          centerId: studentCenterId,
        });
      } catch (recordError) {
        context.log.error(`Error processing attendance for student ${record.studentId}:`, recordError);
        errors.push(`Failed to process student ${record.studentId}`);
      }
    }

    const response: ApiResponse<{ saved: AttendanceRecord[]; errors: string[] }> = {
      success: true,
      data: {
        saved: results,
        errors: errors,
      },
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error marking attendance:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to mark attendance' } };
  }
};

// GET /api/attendance/students - Get students with today's attendance status
export const getStudentsForAttendance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const attendanceByDateTable = getTableClient(TABLES.ATTENDANCE_BY_DATE);
    const queryCenterId = getQueryCenterId(user);

    // Get all active students
    const filter = queryCenterId
      ? `PartitionKey eq '${queryCenterId}' and isActive eq true`
      : 'isActive eq true';

    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter }
    });

    const students: Array<{
      id: string;
      name: string;
      centerId: string;
      programName: string;
      attendanceStatus: 'present' | 'absent' | null;
    }> = [];

    // Get all students
    const studentMap = new Map<string, { name: string; centerId: string; programName: string }>();
    for await (const student of studentIterator) {
      studentMap.set(student.rowKey, {
        name: student.name,
        centerId: student.partitionKey,
        programName: student.programName || '',
      });
    }

    // Get attendance for the date
    const attendanceMap = new Map<string, 'present' | 'absent'>();

    if (queryCenterId) {
      const partitionKey = `${date}_${queryCenterId}`;
      const attendanceIterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
        queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
      });
      for await (const entity of attendanceIterator) {
        attendanceMap.set(entity.rowKey, entity.status);
      }
    } else {
      // Admin: get all attendance for the date across centers
      const attendanceIterator = attendanceByDateTable.listEntities<AttendanceByDateEntity>({
        queryOptions: { filter: `PartitionKey ge '${date}_' and PartitionKey lt '${date}~'` }
      });
      for await (const entity of attendanceIterator) {
        attendanceMap.set(entity.rowKey, entity.status);
      }
    }

    // Combine students with attendance
    for (const [studentId, studentInfo] of studentMap) {
      students.push({
        id: studentId,
        name: studentInfo.name,
        centerId: studentInfo.centerId,
        programName: studentInfo.programName,
        attendanceStatus: attendanceMap.get(studentId) || null,
      });
    }

    // Sort by name
    students.sort((a, b) => a.name.localeCompare(b.name));

    const response: ApiResponse<typeof students> = {
      success: true,
      data: students,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching students for attendance:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch students' } };
  }
};
