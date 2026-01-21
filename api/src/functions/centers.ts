import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
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
async function getCenters(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  // Only admins can list all centers
  if (user.role !== 'admin') {
    return { status: 403, jsonBody: { success: false, error: 'Only admins can list centers' } };
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

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching centers:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch centers' } };
  }
}

// GET /api/centers/{id} - Get single center
async function getCenter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const centerId = request.params.id;

  if (!centerId) {
    return { status: 400, jsonBody: { success: false, error: 'Center ID is required' } };
  }

  // Coordinators can only view their own center
  if (user.role === 'coordinator' && user.centerId !== centerId) {
    return { status: 403, jsonBody: { success: false, error: 'Access denied to this center' } };
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

    return { status: 200, jsonBody: response };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Center not found' } };
    }
    context.error('Error fetching center:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch center' } };
  }
}

// POST /api/centers - Create center (admin only)
async function createCenter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  // Only admins can create centers
  if (user.role !== 'admin') {
    return { status: 403, jsonBody: { success: false, error: 'Only admins can create centers' } };
  }

  try {
    const body = await request.json() as { name: string; location?: string };

    // Validate required fields
    if (!body.name) {
      return { status: 400, jsonBody: { success: false, error: 'Center name is required' } };
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

    return { status: 201, jsonBody: { success: true, data: center } };
  } catch (error) {
    context.error('Error creating center:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to create center' } };
  }
}

// PUT /api/centers/{id} - Update center (admin only)
async function updateCenter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  // Only admins can update centers
  if (user.role !== 'admin') {
    return { status: 403, jsonBody: { success: false, error: 'Only admins can update centers' } };
  }

  const centerId = request.params.id;

  if (!centerId) {
    return { status: 400, jsonBody: { success: false, error: 'Center ID is required' } };
  }

  try {
    const body = await request.json() as { name?: string; location?: string; isActive?: boolean };
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

    return { status: 200, jsonBody: { success: true, data: center } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Center not found' } };
    }
    context.error('Error updating center:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to update center' } };
  }
}

// DELETE /api/centers/{id} - Soft delete center (admin only)
async function deleteCenter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  // Only admins can delete centers
  if (user.role !== 'admin') {
    return { status: 403, jsonBody: { success: false, error: 'Only admins can delete centers' } };
  }

  const centerId = request.params.id;

  if (!centerId) {
    return { status: 400, jsonBody: { success: false, error: 'Center ID is required' } };
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

    return { status: 200, jsonBody: { success: true, message: 'Center deleted successfully' } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return { status: 404, jsonBody: { success: false, error: 'Center not found' } };
    }
    context.error('Error deleting center:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to delete center' } };
  }
}

// Register functions
app.http('getCenters', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'centers',
  handler: getCenters,
});

app.http('getCenter', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'centers/{id}',
  handler: getCenter,
});

app.http('createCenter', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'centers',
  handler: createCenter,
});

app.http('updateCenter', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'centers/{id}',
  handler: updateCenter,
});

app.http('deleteCenter', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'centers/{id}',
  handler: deleteCenter,
});
