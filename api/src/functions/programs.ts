// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
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
export const getPrograms: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
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

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching programs:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch programs' } };
  }
};

// GET /api/programs/{id} - Get single program
export const getProgram: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const programId = context.bindingData.id;

  if (!programId) {
    context.res = { status: 400, body: { success: false, error: 'Program ID is required' } };
    return;
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

    context.res = { status: 200, body: { success: true, data: program } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Program not found' } };
      return;
    }
    context.log.error('Error fetching program:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch program' } };
  }
};

// POST /api/programs - Create program
export const createProgram: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const body = req.body as CreateProgramRequest;

    // Validate required fields
    if (!body.name) {
      context.res = { status: 400, body: { success: false, error: 'Program name is required' } };
      return;
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

    context.res = { status: 201, body: { success: true, data: program } };
  } catch (error) {
    context.log.error('Error creating program:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to create program' } };
  }
};

// PUT /api/programs/{id} - Update program
export const updateProgram: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const programId = context.bindingData.id;

  if (!programId) {
    context.res = { status: 400, body: { success: false, error: 'Program ID is required' } };
    return;
  }

  try {
    const body = req.body as UpdateProgramRequest;
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

    context.res = { status: 200, body: { success: true, data: program } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Program not found' } };
      return;
    }
    context.log.error('Error updating program:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to update program' } };
  }
};

// DELETE /api/programs/{id} - Soft delete program
export const deleteProgram: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const programId = context.bindingData.id;

  if (!programId) {
    context.res = { status: 400, body: { success: false, error: 'Program ID is required' } };
    return;
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

    context.res = { status: 200, body: { success: true, message: 'Program deleted successfully' } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Program not found' } };
      return;
    }
    context.log.error('Error deleting program:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to delete program' } };
  }
};
