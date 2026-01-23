import { TableClient, TableServiceClient } from '@azure/data-tables';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';

// Table names
export const TABLES = {
  USERS: 'Users',
  CENTERS: 'Centers',
  STUDENTS: 'Students',
  MILESTONES: 'Milestones',
  PROGRAMS: 'Programs',
  ATTENDANCE_BY_DATE: 'AttendanceByDate',
  ATTENDANCE_BY_STUDENT: 'AttendanceByStudent',
  REGISTRATIONS: 'Registrations',
} as const;

// Cache for table clients that have been initialized
const initializedTables = new Set<string>();

// Get or create table client (creates table if it doesn't exist)
export function getTableClient(tableName: string): TableClient {
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  const client = TableClient.fromConnectionString(connectionString, tableName);

  // Create table if not already initialized in this session
  if (!initializedTables.has(tableName)) {
    client.createTable().catch((error: unknown) => {
      // Ignore "table already exists" error (409)
      if ((error as { statusCode?: number }).statusCode !== 409) {
        console.error(`Error creating table ${tableName}:`, error);
      }
    });
    initializedTables.add(tableName);
  }

  return client;
}

// Initialize all tables
export async function initializeTables(): Promise<void> {
  if (!connectionString) {
    console.warn('AZURE_STORAGE_CONNECTION_STRING not configured. Skipping table initialization.');
    return;
  }

  const tableService = TableServiceClient.fromConnectionString(connectionString);

  for (const tableName of Object.values(TABLES)) {
    try {
      await tableService.createTable(tableName);
      console.log(`Table ${tableName} created or already exists`);
    } catch (error: unknown) {
      // Table already exists - ignore
      if ((error as { statusCode?: number }).statusCode !== 409) {
        console.error(`Error creating table ${tableName}:`, error);
      }
    }
  }
}

// Helper to convert entity to plain object (removes Azure metadata)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function entityToObject<T>(entity: any): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    // Skip Azure metadata fields
    if (key.startsWith('odata.') || key === 'etag' || key === 'timestamp') {
      continue;
    }
    result[key] = value;
  }

  return result as T;
}

// Helper to create a timestamp-based row key for sorting
export function createTimestampRowKey(): string {
  // Use inverse timestamp so newer items come first
  const inverseTimestamp = (9999999999999 - Date.now()).toString().padStart(13, '0');
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${inverseTimestamp}_${randomPart}`;
}
