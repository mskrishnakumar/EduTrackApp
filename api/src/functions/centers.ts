// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { Center, CenterEntity, ApiResponse, StudentEntity } from '../types';

// Helper to map entity to Center
function mapEntityToCenter(entity: CenterEntity): Center {
  return {
    id: entity.rowKey,
    name: entity.name,
    location: entity.location,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}

// GET /api/centers - List all centers
export const getCenters: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  // Only admins can list all centers
  if (user.role !== 'admin') {
    context.res = { status: 403, body: { success: false, error: 'Only admins can list centers' } };
    return;
  }

  try {
    const centersTable = getTableClient(TABLES.CENTERS);
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const centers: (Center & { studentCount: number })[] = [];

    // Get all active centers
    const iterator = centersTable.listEntities<CenterEntity>({
      queryOptions: { filter: `PartitionKey eq 'center' and isActive eq true` }
    });

    for await (const entity of iterator) {
      const center = mapEntityToCenter(entityToObject<CenterEntity>(entity));
      centers.push({ ...center, studentCount: 0 });
    }

    // Count students per center
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: 'isActive eq true' }
    });

    const centerCounts: Record<string, number> = {};
    for await (const student of studentIterator) {
      const centerId = student.partitionKey;
      centerCounts[centerId] = (centerCounts[centerId] || 0) + 1;
    }

    // Add student counts
    for (const center of centers) {
      center.studentCount = centerCounts[center.id] || 0;
    }

    // Sort by name
    centers.sort((a, b) => a.name.localeCompare(b.name));

    const response: ApiResponse<typeof centers> = {
      success: true,
      data: centers,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching centers:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch centers' } };
  }
};

// GET /api/centers/{id} - Get single center
export const getCenter: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const centerId = context.bindingData.id;

  if (!centerId) {
    context.res = { status: 400, body: { success: false, error: 'Center ID is required' } };
    return;
  }

  // Coordinators can only view their own center
  if (user.role === 'coordinator' && user.centerId !== centerId) {
    context.res = { status: 403, body: { success: false, error: 'Access denied to this center' } };
    return;
  }

  try {
    const centersTable = getTableClient(TABLES.CENTERS);
    const entity = await centersTable.getEntity<CenterEntity>('center', centerId);

    const center = mapEntityToCenter(entityToObject<CenterEntity>(entity));

    // Count students in this center
    const studentsTable = getTableClient(TABLES.STUDENTS);
    let studentCount = 0;
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `PartitionKey eq '${centerId}' and isActive eq true` }
    });

    for await (const _ of studentIterator) {
      studentCount++;
    }

    const response: ApiResponse<Center & { studentCount: number }> = {
      success: true,
      data: { ...center, studentCount },
    };

    context.res = { status: 200, body: response };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Center not found' } };
      return;
    }
    context.log.error('Error fetching center:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch center' } };
  }
};

// POST /api/centers - Create center (admin only)
export const createCenter: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  // Only admins can create centers
  if (user.role !== 'admin') {
    context.res = { status: 403, body: { success: false, error: 'Only admins can create centers' } };
    return;
  }

  try {
    const body = req.body as { name: string; location?: string };

    // Validate required fields
    if (!body.name) {
      context.res = { status: 400, body: { success: false, error: 'Center name is required' } };
      return;
    }

    const centerId = uuidv4();
    const now = new Date().toISOString();

    const centerEntity: CenterEntity = {
      partitionKey: 'center',
      rowKey: centerId,
      name: body.name,
      location: body.location || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const centersTable = getTableClient(TABLES.CENTERS);
    await centersTable.createEntity(centerEntity);

    const center = mapEntityToCenter(centerEntity);

    context.res = { status: 201, body: { success: true, data: center } };
  } catch (error) {
    context.log.error('Error creating center:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to create center' } };
  }
};

// PUT /api/centers/{id} - Update center (admin only)
export const updateCenter: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  // Only admins can update centers
  if (user.role !== 'admin') {
    context.res = { status: 403, body: { success: false, error: 'Only admins can update centers' } };
    return;
  }

  const centerId = context.bindingData.id;

  if (!centerId) {
    context.res = { status: 400, body: { success: false, error: 'Center ID is required' } };
    return;
  }

  try {
    const body = req.body as { name?: string; location?: string; isActive?: boolean };
    const centersTable = getTableClient(TABLES.CENTERS);

    // Get existing center
    const entity = await centersTable.getEntity<CenterEntity>('center', centerId);

    // Update fields
    const updatedEntity: CenterEntity = {
      ...entityToObject<CenterEntity>(entity),
      partitionKey: 'center',
      rowKey: centerId,
      ...(body.name && { name: body.name }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      updatedAt: new Date().toISOString(),
    };

    await centersTable.updateEntity(updatedEntity, 'Replace');

    const center = mapEntityToCenter(updatedEntity);

    context.res = { status: 200, body: { success: true, data: center } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Center not found' } };
      return;
    }
    context.log.error('Error updating center:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to update center' } };
  }
};

// DELETE /api/centers/{id} - Soft delete center (admin only)
export const deleteCenter: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  // Only admins can delete centers
  if (user.role !== 'admin') {
    context.res = { status: 403, body: { success: false, error: 'Only admins can delete centers' } };
    return;
  }

  const centerId = context.bindingData.id;

  if (!centerId) {
    context.res = { status: 400, body: { success: false, error: 'Center ID is required' } };
    return;
  }

  try {
    const centersTable = getTableClient(TABLES.CENTERS);

    // Get existing center
    const entity = await centersTable.getEntity<CenterEntity>('center', centerId);

    // Soft delete - set isActive to false
    const updatedEntity: CenterEntity = {
      ...entityToObject<CenterEntity>(entity),
      partitionKey: 'center',
      rowKey: centerId,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    await centersTable.updateEntity(updatedEntity, 'Replace');

    context.res = { status: 200, body: { success: true, message: 'Center deleted successfully' } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      context.res = { status: 404, body: { success: false, error: 'Center not found' } };
      return;
    }
    context.log.error('Error deleting center:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to delete center' } };
  }
};
