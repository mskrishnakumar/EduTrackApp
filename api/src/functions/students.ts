import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
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
async function getStudents(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.toLowerCase() || '';
  const programId = url.searchParams.get('programId') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

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

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching students:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch students' } };
  }
}

// GET /api/students/{id} - Get single student
async function getStudent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const studentId = request.params.id;

  if (!studentId) {
    return { status: 400, jsonBody: { success: false, error: 'Student ID is required' } };
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
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
      }

      const student = mapEntityToStudent(entityToObject<StudentEntity>(entity), centerId);

      return { status: 200, jsonBody: { success: true, data: student } };
    }

    return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.error('Error fetching student:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch student' } };
  }
}

// POST /api/students - Create student
async function createStudent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as CreateStudentRequest;

    // Validate required fields
    if (!body.name || !body.age || !body.programId || !body.enrollmentDate) {
      return { status: 400, jsonBody: { success: false, error: 'Missing required fields' } };
    }

    // Determine center ID
    let centerId = body.centerId;
    if (!centerId) {
      if (user.role === 'coordinator' && user.centerId) {
        centerId = user.centerId;
      } else {
        return { status: 400, jsonBody: { success: false, error: 'Center ID is required' } };
      }
    }

    // Check center access
    if (!checkCenterAccess(user, centerId)) {
      return { status: 403, jsonBody: { success: false, error: 'Access denied to this center' } };
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

    return { status: 201, jsonBody: { success: true, data: student } };
  } catch (error) {
    context.error('Error creating student:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to create student' } };
  }
}

// PUT /api/students/{id} - Update student
async function updateStudent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const studentId = request.params.id;

  if (!studentId) {
    return { status: 400, jsonBody: { success: false, error: 'Student ID is required' } };
  }

  try {
    const body = await request.json() as UpdateStudentRequest;
    const studentsTable = getTableClient(TABLES.STUDENTS);

    // Find student
    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.partitionKey;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
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

      return { status: 200, jsonBody: { success: true, data: student } };
    }

    return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.error('Error updating student:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to update student' } };
  }
}

// DELETE /api/students/{id} - Soft delete student
async function deleteStudent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const studentId = request.params.id;

  if (!studentId) {
    return { status: 400, jsonBody: { success: false, error: 'Student ID is required' } };
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
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
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

      return { status: 200, jsonBody: { success: true, message: 'Student deleted successfully' } };
    }

    return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
  } catch (error) {
    context.error('Error deleting student:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to delete student' } };
  }
}

// Register functions
app.http('getStudents', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students',
  handler: getStudents,
});

app.http('getStudent', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students/{id}',
  handler: getStudent,
});

app.http('createStudent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'students',
  handler: createStudent,
});

app.http('updateStudent', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'students/{id}',
  handler: updateStudent,
});

app.http('deleteStudent', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'students/{id}',
  handler: deleteStudent,
});
