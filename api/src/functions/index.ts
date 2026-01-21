// IMPORTANT: Polyfill must be imported FIRST before any Azure SDK imports
// This fixes "crypto is not defined" error in Azure Functions runtime
import '../polyfills';

// Export all Azure Functions for v3
// Each function is discovered via its own function.json file
export * from './students';
export * from './programs';
export * from './milestones';
export * from './attendance';
export * from './dashboard';
export * from './users';
export * from './centers';
