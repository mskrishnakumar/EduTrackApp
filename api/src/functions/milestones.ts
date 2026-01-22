// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { verifyAuth, checkCenterAccess } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject, createTimestampRowKey } from '../services/tableStorage';
import { translateText, isTranslatorConfigured } from '../services/translatorService';
import { Milestone, MilestoneEntity, CreateMilestoneRequest, UpdateMilestoneRequest, ApiResponse, StudentEntity } from '../types';

// Helper to map entity to Milestone
function mapEntityToMilestone(entity: MilestoneEntity, studentName?: string): Milestone {
  // Parse translations from JSON string if present
  let descriptionTranslations: Record<string, string> | undefined;
  if (entity.descriptionTranslations) {
    try {
      descriptionTranslations = JSON.parse(entity.descriptionTranslations);
    } catch {
      // Ignore parse errors
    }
  }

  return {
    id: entity.rowKey,
    studentId: entity.partitionKey,
    studentName: studentName || entity.studentName,
    type: entity.type,
    description: entity.description,
    descriptionTranslations,
    originalLanguage: entity.originalLanguage,
    dateAchieved: entity.dateAchieved,
    verifiedBy: entity.verifiedBy,
    centerId: entity.centerId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

// GET /api/students/{studentId}/milestones - Get milestones for a student
export const getStudentMilestones: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const studentId = context.bindingData.studentId;

  if (!studentId) {
    context.res = { status: 400, body: { success: false, error: 'Student ID is required' } };
    return;
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

    let studentName: string | undefined;
    if (!studentCenterId) {
      context.res = { status: 404, body: { success: false, error: 'Student not found' } };
      return;
    }

    // Get student name from the iterator we already have
    const studentsTableForName = getTableClient(TABLES.STUDENTS);
    const studentNameIterator = studentsTableForName.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${studentId}'` }
    });
    for await (const student of studentNameIterator) {
      studentName = student.name;
      break;
    }

    if (!checkCenterAccess(user, studentCenterId)) {
      context.res = { status: 403, body: { success: false, error: 'Access denied to this student' } };
      return;
    }

    // Get milestones for the student
    const milestonesTable = getTableClient(TABLES.MILESTONES);
    const milestones: Milestone[] = [];

    const iterator = milestonesTable.listEntities<MilestoneEntity>({
      queryOptions: { filter: `PartitionKey eq '${studentId}'` }
    });

    for await (const entity of iterator) {
      milestones.push(mapEntityToMilestone(entityToObject<MilestoneEntity>(entity), studentName));
    }

    // Sort by date achieved descending (most recent first)
    milestones.sort((a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime());

    const response: ApiResponse<Milestone[]> = {
      success: true,
      data: milestones,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error fetching milestones:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch milestones' } };
  }
};

// POST /api/milestones - Create milestone
export const createMilestone: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const body = req.body as CreateMilestoneRequest;

    // Validate required fields
    if (!body.studentId || !body.type || !body.description || !body.dateAchieved) {
      context.res = { status: 400, body: { success: false, error: 'Missing required fields' } };
      return;
    }

    // Validate milestone type
    if (!['academic', 'life-skills', 'attendance'].includes(body.type)) {
      context.res = { status: 400, body: { success: false, error: 'Invalid milestone type' } };
      return;
    }

    // Verify access to the student
    const studentsTable = getTableClient(TABLES.STUDENTS);
    const studentIterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `RowKey eq '${body.studentId}'` }
    });

    let studentCenterId: string | null = null;
    let studentName: string | undefined;
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

    const milestoneId = createTimestampRowKey();
    const now = new Date().toISOString();

    // Translate description if translator is configured
    let descriptionTranslations: string | undefined;
    let originalLanguage: string | undefined;

    if (isTranslatorConfigured()) {
      try {
        const translationResult = await translateText(body.description);
        if (translationResult.success && translationResult.translations) {
          descriptionTranslations = JSON.stringify(translationResult.translations);
          originalLanguage = translationResult.detectedLanguage;
        }
      } catch (translationError) {
        // Log but don't fail - translation is optional enhancement
        context.log.warn('Translation failed, continuing without translations:', translationError);
      }
    }

    const milestoneEntity: MilestoneEntity = {
      partitionKey: body.studentId,
      rowKey: milestoneId,
      type: body.type,
      description: body.description,
      descriptionTranslations,
      originalLanguage,
      dateAchieved: body.dateAchieved,
      verifiedBy: body.verifiedBy || '',
      centerId: studentCenterId,
      studentName: studentName || '',
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
    } as MilestoneEntity;

    const milestonesTable = getTableClient(TABLES.MILESTONES);
    await milestonesTable.createEntity(milestoneEntity);

    const milestone = mapEntityToMilestone(milestoneEntity, studentName);

    context.res = { status: 201, body: { success: true, data: milestone } };
  } catch (error) {
    context.log.error('Error creating milestone:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to create milestone' } };
  }
};

// PUT /api/milestones/{id} - Update milestone
export const updateMilestone: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const milestoneId = context.bindingData.id;

  if (!milestoneId) {
    context.res = { status: 400, body: { success: false, error: 'Milestone ID is required' } };
    return;
  }

  try {
    const body = req.body as UpdateMilestoneRequest;
    const milestonesTable = getTableClient(TABLES.MILESTONES);

    // Find milestone across all students
    const iterator = milestonesTable.listEntities<MilestoneEntity>({
      queryOptions: { filter: `RowKey eq '${milestoneId}'` }
    });

    for await (const entity of iterator) {
      const centerId = entity.centerId;

      // Check center access
      if (!checkCenterAccess(user, centerId)) {
        context.res = { status: 403, body: { success: false, error: 'Access denied to this milestone' } };
        return;
      }

      // Re-translate if description changed
      let newTranslations: string | undefined;
      let newOriginalLanguage: string | undefined;

      if (body.description && body.description !== entity.description && isTranslatorConfigured()) {
        try {
          const translationResult = await translateText(body.description);
          if (translationResult.success && translationResult.translations) {
            newTranslations = JSON.stringify(translationResult.translations);
            newOriginalLanguage = translationResult.detectedLanguage;
          }
        } catch (translationError) {
          context.log.warn('Translation failed during update:', translationError);
        }
      }

      // Update fields
      const entityObj = entityToObject<MilestoneEntity>(entity);
      const updatedEntity: MilestoneEntity = {
        ...entityObj,
        partitionKey: entity.partitionKey,
        rowKey: milestoneId,
        ...(body.type && { type: body.type }),
        ...(body.description && { description: body.description }),
        ...(newTranslations && { descriptionTranslations: newTranslations }),
        ...(newOriginalLanguage && { originalLanguage: newOriginalLanguage }),
        ...(body.dateAchieved && { dateAchieved: body.dateAchieved }),
        ...(body.verifiedBy !== undefined && { verifiedBy: body.verifiedBy }),
        updatedAt: new Date().toISOString(),
      };

      await milestonesTable.updateEntity(updatedEntity, 'Replace');

      const milestone = mapEntityToMilestone(updatedEntity);

      context.res = { status: 200, body: { success: true, data: milestone } };
      return;
    }

    context.res = { status: 404, body: { success: false, error: 'Milestone not found' } };
  } catch (error) {
    context.log.error('Error updating milestone:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to update milestone' } };
  }
};

// DELETE /api/milestones/{id} - Delete milestone
export const deleteMilestone: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const milestoneId = context.bindingData.id;

  if (!milestoneId) {
    context.res = { status: 400, body: { success: false, error: 'Milestone ID is required' } };
    return;
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
        context.res = { status: 403, body: { success: false, error: 'Access denied to this milestone' } };
        return;
      }

      await milestonesTable.deleteEntity(entity.partitionKey, milestoneId);

      context.res = { status: 200, body: { success: true, message: 'Milestone deleted successfully' } };
      return;
    }

    context.res = { status: 404, body: { success: false, error: 'Milestone not found' } };
  } catch (error) {
    context.log.error('Error deleting milestone:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to delete milestone' } };
  }
};
