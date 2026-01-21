import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyAuth, checkCenterAccess } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject, createTimestampRowKey } from '../services/tableStorage';
import { Milestone, MilestoneEntity, CreateMilestoneRequest, UpdateMilestoneRequest, ApiResponse, StudentEntity } from '../types';

// Helper to map entity to Milestone
function mapEntityToMilestone(entity: MilestoneEntity): Milestone {
  return {
    id: entity.rowKey,
    studentId: entity.partitionKey,
    type: entity.type,
    description: entity.description,
    dateAchieved: entity.dateAchieved,
    verifiedBy: entity.verifiedBy,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

// GET /api/students/{studentId}/milestones - Get milestones for a student
async function getStudentMilestones(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const studentId = request.params.studentId;

  if (!studentId) {
    return { status: 400, jsonBody: { success: false, error: 'Student ID is required' } };
  }

  try {
    // First verify access to the student
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });

    let studentCenterId: string | null = null;
    for await (const student of studentIterator) {
      studentCenterId = student.partitionKey;
      break;
    }

    if (!studentCenterId) {
      return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
    }

    if (!checkCenterAccess(user, studentCenterId)) {
      return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
    }

    // Get milestones for the student
    const milestonesTable = getTableClient(TABLES.MILESTONES);
    const milestones: Milestone[] = [];

    const iterator = milestonesTable.listEntities<MilestoneEntity>({
      queryOptions: { filter: `PartitionKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      milestones.push(mapEntityToMilestone(entityToObject<MilestoneEntity>(entity)));
    }

    // Sort by date achieved descending (most recent first)
    milestones.sort((a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime());

    const response: ApiResponse<Milestone[]> = {
      success: true,
      data: milestones,
    };

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error('Error fetching milestones:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to fetch milestones' } };
  }
}

// POST /api/milestones - Create milestone
async function createMilestone(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as CreateMilestoneRequest;

    // Validate required fields
    if (!body.studentId || !body.type || !body.description || !body.dateAchieved) {
      return { status: 400, jsonBody: { success: false, error: 'Missing required fields' } };
    }

    // Validate milestone type
    if (!['academic', 'life-skills', 'attendance'].includes(body.type)) {
      return { status: 400, jsonBody: { success: false, error: 'Invalid milestone type' } };
    }

    // Verify access to the student
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${body.studentId}'` }
    });

    let studentCenterId: string | null = null;
    for await (const student of studentIterator) {
      studentCenterId = student.partitionKey;
      break;
    }

    if (!studentCenterId) {
      return { status: 404, jsonBody: { success: false, error: 'Student not found' } };
    }

    if (!checkCenterAccess(user, studentCenterId)) {
      return { status: 403, jsonBody: { success: false, error: 'Access denied to this student' } };
    }

    const milestoneId = createTimestampRowKey();
    const now = new Date().toISOString();

    const milestoneEntity: MilestoneEntity = {
      partitionKey: body.studentId,
      rowKey: milestoneId,
      type: body.type,
      description: body.description,
      dateAchieved: body.dateAchieved,
      verifiedBy: body.verifiedBy || '',
      centerId: studentCenterId,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
    } as MilestoneEntity;

    const milestonesTable = getTableClient(TABLES.MILESTONES);
    await milestonesTable.createEntity(milestoneEntity);

    const milestone = mapEntityToMilestone(milestoneEntity);

    return { status: 201, jsonBody: { success: true, data: milestone } };
  } catch (error) {
    context.error('Error creating milestone:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to create milestone' } };
  }
}

// PUT /api/milestones/{id} - Update milestone
async function updateMilestone(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const milestoneId = request.params.id;

  if (!milestoneId) {
    return { status: 400, jsonBody: { success: false, error: 'Milestone ID is required' } };
  }

  try {
    const body = await request.json() as UpdateMilestoneRequest;
    const milestonesTable = getTableClient(TABLES.MILESTONES);

    // Find milestone across all students
    const iterator = milestonesTable.listEntities<MilestoneEntity>({
      queryOptions: { filter: `RowKey eq '${milestoneId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.centerId;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this milestone' } };
      }

      // Update fields
      const updatedEntity: MilestoneEntity = {
        ...entityToObject<MilestoneEntity>(entity),
        partitionKey: entity.partitionKey,
        rowKey: milestoneId,
        ...(body.type && { type: body.type }),
        ...(body.description && { description: body.description }),
        ...(body.dateAchieved && { dateAchieved: body.dateAchieved }),
        ...(body.verifiedBy !== undefined && { verifiedBy: body.verifiedBy }),
        updatedAt: new Date().toISOString(),
      };

      await milestonesTable.updateEntity(updatedEntity, 'Replace');

      const milestone = mapEntityToMilestone(updatedEntity);

      return { status: 200, jsonBody: { success: true, data: milestone } };
    }

    return { status: 404, jsonBody: { success: false, error: 'Milestone not found' } };
  } catch (error) {
    context.error('Error updating milestone:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to update milestone' } };
  }
}

// DELETE /api/milestones/{id} - Delete milestone
async function deleteMilestone(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const authResult = await verifyAuth(request, context);
  if (!authResult.success) {
    return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
  }

  const user = authResult.user!;
  const milestoneId = request.params.id;

  if (!milestoneId) {
    return { status: 400, jsonBody: { success: false, error: 'Milestone ID is required' } };
  }

  try {
    const milestonesTable = getTableClient(TABLES.MILESTONES);

    // Find milestone across all students
    const iterator = milestonesTable.listEntities<MilestoneEntity>({
      queryOptions: { filter: `RowKey eq '${milestoneId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.centerId;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        return { status: 403, jsonBody: { success: false, error: 'Access denied to this milestone' } };
      }

      await milestonesTable.deleteEntity(entity.partitionKey, milestoneId);

      return { status: 200, jsonBody: { success: true, message: 'Milestone deleted successfully' } };
    }

    return { status: 404, jsonBody: { success: false, error: 'Milestone not found' } };
  } catch (error) {
    context.error('Error deleting milestone:', error);
    return { status: 500, jsonBody: { success: false, error: 'Failed to delete milestone' } };
  }
}

// Register functions
app.http('getStudentMilestones', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students/{studentId}/milestones',
  handler: getStudentMilestones,
});

app.http('createMilestone', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'milestones',
  handler: createMilestone,
});

app.http('updateMilestone', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'milestones/{id}',
  handler: updateMilestone,
});

app.http('deleteMilestone', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'milestones/{id}',
  handler: deleteMilestone,
});
