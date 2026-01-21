import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyAuth, checkCenterAccess, getQueryCenterId } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { AttendanceRecord, AttendanceByDateEntity, AttendanceByStudentEntity, MarkAttendanceRequest, ApiResponse, StudentEntity } from '../types';

// GET /api/attendance - Get attendance by date or student
async function getAttendance(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const studentId = url.searchParams.get('studentId');

  if (!date && !studentId) {
    return { status: 400, jsonBody: { success: false, error: 'Either date or studentId parameter is required' } };
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
        return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
      }

      if (!checkCenterAccess(user, studentCenterId)) {
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
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

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching attendance:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch attendance' } };
  }
}

// POST /api/attendance - Mark attendance (batch)
async function markAttendance(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as MarkAttendanceRequest;

    // Validate required fields
    if (!body.date || !body.records || !Array.isArray(body.records) || body.records.length === 0) {
      return { status: 400, jsonBody: { success: false, error: 'Date and attendance records are required' } };
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return { status: 400, jsonBody: { success: false, error: 'Invalid date format. Use YYYY-MM-DD' } };
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
        context.error(`Error processing attendance for student ${record.studentId}:`, recordError);
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

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error marking attendance:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to mark attendance' } };
  }
}

// GET /api/attendance/students - Get students with today's attendance status
async function getStudentsForAttendance(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

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

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching students for attendance:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch students' } };
  }
}

// Register functions
app.http('getAttendance', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'attendance',
  handler: getAttendance,
});

app.http('markAttendance', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'attendance',
  handler: markAttendance,
});

app.http('getStudentsForAttendance', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'attendance/students',
  handler: getStudentsForAttendance,
});
