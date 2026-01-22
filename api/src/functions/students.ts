// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuth, checkCenterAccess, getQueryCenterId, AuthenticatedUser } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject, createTimestampRowKey } from '../services/tableStorage';
import { Student, StudentEntity, CreateStudentRequest, UpdateStudentRequest, ApiResponse, PaginatedResponse, ProgramEntity } from '../types';

// Helper to map entity to Student
function mapEntityToStudent(entity: StudentEntity, centerId: string): Student {
  return {
    id: entity.rowKey,
    name: entity.name,
    age: entity.age,
    programId: entity.programId,
    programName: entity.programName,
    centerId: centerId,
    centerName: '', // Would need to fetch from centers table
    enrollmentDate: entity.enrollmentDate,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    isActive: entity.isActive,
    milestoneCount: 0, // Would need to count from milestones table
  };
}

// GET /api/students - List all students
export const getStudents: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const search = (req.query.search || '').toLowerCase();
  const programId = req.query.programId || '';
  const page = parseInt(req.query.page || '1');
  const pageSize = parseInt(req.query.pageSize || '50');

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const students: Student[] = [];
    const queryCenterId = getQueryCenterId(user);

    // If coordinator, filter by their center
    const filter = queryCenterId
      ? `PartitionKey eq '${queryCenterId}' and isActive eq true`
      : 'isActive eq true';

    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter }
    });

    for await (const entity of iterator) {
      const student = mapEntityToStudent(entityToObject<StudentEntity>(entity), entity.partitionKey);

      // Apply search filter
      if (search && !student.name.toLowerCase().includes(search)) {
        continue;
      }

      // Apply program filter
      if (programId && student.programId !== programId) {
        continue;
      }

      students.push(student);
    }

    // Sort by name
    students.sort((a, b) => a.name.localeCompare(b.name));

    // Paginate
    const totalCount = students.length;
    const paginatedStudents = students.slice((page - 1) * pageSize, page * pageSize);

    const response: PaginatedResponse<Student[]> = {
      success: true,
      data: paginatedStudents,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching students:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch students' } };
  }
};

// GET /api/students/{id} - Get single student
export const getStudent: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const studentId = context.bindingData.id;

  if (!studentId) {
    context.res = { status: 400, body: { success: false, error: 'Student ID is required' } };
    return;
  }

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);

    // Find student across all partitions (centers)
    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.partitionKey;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        context.res = { status: 403, body: { success: false, error: 'Access denied to this student' } };
        return;
      }

      const student = mapEntityToStudent(entityToObject<StudentEntity>(entity), centerId);

      context.res = { status: 200, body: { success: true, data: student } };
      return;
    }

    context.res = { status: 404, body: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.log.error('Error fetching student:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch student' } };
  }
};

// POST /api/students - Create student
export const createStudent: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const body = req.body as CreateStudentRequest;

    // Validate required fields
    if (!body.name || !body.age || !body.programId || !body.enrollmentDate) {
      context.res = { status: 400, body: { success: false, error: 'Missing required fields' } };
      return;
    }

    // Determine center ID
    let centerId = body.centerId;
    if (!centerId) {
      if (user.role === 'coordinator' && user.centerId) {
        centerId = user.centerId;
      } else {
        context.res = { status: 400, body: { success: false, error: 'Center ID is required' } };
        return;
      }
    }

    // Check center access
    if (!checkCenterAccess(user, centerId)) {
      context.res = { status: 403, body: { success: false, error: 'Access denied to this center' } };
      return;
    }

    // Get program name
    let programName = '';
    try {
      const programsTable = getTableClient(TABLES.PROGRAMS);
      const program = await programsTable.getEntity<ProgramEntity>('program', body.programId);
      programName = program.name;
    } catch {
      programName = 'Unknown Program';
    }

    const studentId = uuidv4();
    const now = new Date().toISOString();

    const studentEntity: StudentEntity = {
      partitionKey: centerId,
      rowKey: studentId,
      name: body.name,
      age: body.age,
      programId: body.programId,
      programName,
      enrollmentDate: body.enrollmentDate,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      isActive: true,
    };

    const studentsTable = getTableClient(TABLES.STUDENTS);
    await studentsTable.createEntity(studentEntity);

    const student = mapEntityToStudent(studentEntity, centerId);

    context.res = { status: 201, body: { success: true, data: student } };
  } catch (error) {
    context.log.error('Error creating student:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to create student' } };
  }
};

// PUT /api/students/{id} - Update student
export const updateStudent: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const studentId = context.bindingData.id;

  if (!studentId) {
    context.res = { status: 400, body: { success: false, error: 'Student ID is required' } };
    return;
  }

  try {
    const body = req.body as UpdateStudentRequest;
    const studentsTable = getTableClient(TABLES.STUDENTS);

    // Find student
    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.partitionKey;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        context.res = { status: 403, body: { success: false, error: 'Access denied to this student' } };
        return;
      }

      // Update fields
      const updatedEntity: StudentEntity = {
        ...entityToObject<StudentEntity>(entity),
        partitionKey: centerId,
        rowKey: studentId,
        ...(body.name && { name: body.name }),
        ...(body.age && { age: body.age }),
        ...(body.programId && { programId: body.programId }),
        ...(body.enrollmentDate && { enrollmentDate: body.enrollmentDate }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date().toISOString(),
      };

      await studentsTable.updateEntity(updatedEntity, 'Replace');

      const student = mapEntityToStudent(updatedEntity, centerId);

      context.res = { status: 200, body: { success: true, data: student } };
      return;
    }

    context.res = { status: 404, body: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.log.error('Error updating student:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to update student' } };
  }
};

// DELETE /api/students/{id} - Soft delete student
export const deleteStudent: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const studentId = context.bindingData.id;

  if (!studentId) {
    context.res = { status: 400, body: { success: false, error: 'Student ID is required' } };
    return;
  }

  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);

    // Find student
    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.partitionKey;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        context.res = { status: 403, body: { success: false, error: 'Access denied to this student' } };
        return;
      }

      // Soft delete - set isActive to false
      const updatedEntity: StudentEntity = {
        ...entityToObject<StudentEntity>(entity),
        partitionKey: centerId,
        rowKey: studentId,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };

      await studentsTable.updateEntity(updatedEntity, 'Replace');

      context.res = { status: 200, body: { success: true, message: 'Student deleted successfully' } };
      return;
    }

    context.res = { status: 404, body: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.log.error('Error deleting student:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to delete student' } };
  }
};
