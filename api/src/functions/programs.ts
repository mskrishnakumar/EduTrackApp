import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { Program, ProgramEntity, CreateProgramRequest, UpdateProgramRequest, ApiResponse, StudentEntity } from '../types';

// Helper to map entity to Program
function mapEntityToProgram(entity: ProgramEntity): Program {
  return {
    id: entity.rowKey,
    name: entity.name,
    description: entity.description,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    isActive: entity.isActive,
    studentCount: 0, // Will be populated separately
  };
}

// GET /api/programs - List all programs
async function getPrograms(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  try {
    const programsTable = getTableClient(TABLES.PROGRAMS);
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const programs: Program[] = [];

    // Get all programs
    const iterator = programsTable.listEntities<ProgramEntity>({
      queryOptions: { filter: `PartitionKey eq 'program' and isActive eq true` }
    });

    for await (const entity of iterator) {
      programs.push(mapEntityToProgram(entityToObject<ProgramEntity>(entity)));
    }

    // Count students per program
    const studentCounts: Record<string, number> = {};
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: 'isActive eq true' }
    });

    for await (const student of studentIterator) {
      const programId = student.programId;
      studentCounts[programId] = (studentCounts[programId] || 0) + 1;
    }

    // Add student counts to programs
    for (const program of programs) {
      program.studentCount = studentCounts[program.id] || 0;
    }

    // Sort by name
    programs.sort((a, b) => a.name.localeCompare(b.name));

    const response: ApiResponse<Program[]> = {
      success: true,
      data: programs,
    };

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching programs:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch programs' } };
  }
}

// GET /api/programs/{id} - Get single program
async function getProgram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const programId = request.params.id;

  if (!programId) {
    return { status: 400, jsonBody: { success: false, error: 'Program ID is required' } };
  }

  try {
    const programsTable = getTableClient(TABLES.PROGRAMS);
    const entity = await programsTable.getEntity<ProgramEntity>('program', programId);

    const program = mapEntityToProgram(entityToObject<ProgramEntity>(entity));

    // Count students in this program
    const studentsTable = getTableClient(TABLES.STUDENTS);
    let studentCount = 0;
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `programId eq '${programId}' and isActive eq true` }
    });

    for await (const _ of studentIterator) {
      studentCount++;
    }
    program.studentCount = studentCount;

    return { status: 200, jsonBody: { success: true, data: program } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Program not found' } };
    }
    context.error('Error fetching program:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch program' } };
  }
}

// POST /api/programs - Create program
async function createProgram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as CreateProgramRequest;

    // Validate required fields
    if (!body.name) {
      return { status: 400, jsonBody: { success: false, error: 'Program name is required' } };
    }

    const programId = uuidv4();
    const now = new Date().toISOString();

    const programEntity: ProgramEntity = {
      partitionKey: 'program',
      rowKey: programId,
      name: body.name,
      description: body.description || '',
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      isActive: true,
    };

    const programsTable = getTableClient(TABLES.PROGRAMS);
    await programsTable.createEntity(programEntity);

    const program = mapEntityToProgram(programEntity);

    return { status: 201, jsonBody: { success: true, data: program } };
  } catch (error) {
    context.error('Error creating program:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to create program' } };
  }
}

// PUT /api/programs/{id} - Update program
async function updateProgram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const programId = request.params.id;

  if (!programId) {
    return { status: 400, jsonBody: { success: false, error: 'Program ID is required' } };
  }

  try {
    const body = await request.json() as UpdateProgramRequest;
    const programsTable = getTableClient(TABLES.PROGRAMS);

    // Get existing program
    const entity = await programsTable.getEntity<ProgramEntity>('program', programId);

    // Update fields
    const updatedEntity: ProgramEntity = {
      ...entityToObject<ProgramEntity>(entity),
      partitionKey: 'program',
      rowKey: programId,
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      updatedAt: new Date().toISOString(),
    };

    await programsTable.updateEntity(updatedEntity, 'Replace');

    const program = mapEntityToProgram(updatedEntity);

    return { status: 200, jsonBody: { success: true, data: program } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Program not found' } };
    }
    context.error('Error updating program:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to update program' } };
  }
}

// DELETE /api/programs/{id} - Soft delete program
async function deleteProgram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const programId = request.params.id;

  if (!programId) {
    return { status: 400, jsonBody: { success: false, error: 'Program ID is required' } };
  }

  try {
    const programsTable = getTableClient(TABLES.PROGRAMS);

    // Get existing program
    const entity = await programsTable.getEntity<ProgramEntity>('program', programId);

    // Soft delete - set isActive to false
    const updatedEntity: ProgramEntity = {
      ...entityToObject<ProgramEntity>(entity),
      partitionKey: 'program',
      rowKey: programId,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    await programsTable.updateEntity(updatedEntity, 'Replace');

    return { status: 200, jsonBody: { success: true, message: 'Program deleted successfully' } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Program not found' } };
    }
    context.error('Error deleting program:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to delete program' } };
  }
}

// Register functions
app.http('getPrograms', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'programs',
  handler: getPrograms,
});

app.http('getProgram', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'programs/{id}',
  handler: getProgram,
});

app.http('createProgram', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'programs',
  handler: createProgram,
});

app.http('updateProgram', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'programs/{id}',
  handler: updateProgram,
});

app.http('deleteProgram', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'programs/{id}',
  handler: deleteProgram,
});
