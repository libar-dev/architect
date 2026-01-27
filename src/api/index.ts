/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern APIModule
 * @libar-docs-status active
 *
 * ## API Module - Programmatic Process State Interface
 *
 * Central export for the Process State API, providing a TypeScript
 * interface for querying delivery process state.
 *
 * ### Usage
 *
 * ```typescript
 * import {
 *   createProcessStateAPI,
 *   type ProcessStateAPI,
 *   type QueryResult,
 * } from "@libar-dev/delivery-process/api";
 *
 * const api = createProcessStateAPI(masterDataset);
 *
 * // Query current work
 * const activeWork = api.getCurrentWork();
 *
 * // Check FSM transition
 * const check = api.checkTransition("roadmap", "active");
 * if (check.valid) {
 *   console.log("Transition is valid");
 * }
 * ```
 */

// Types
export type {
  QuerySuccess,
  QueryError,
  QueryErrorCode,
  QueryResult,
  StatusCounts,
  StatusDistribution,
  PhaseProgress,
  PhaseGroup,
  PatternDependencies,
  PatternDeliverable,
  QuarterGroup,
  TransitionCheck,
  ProtectionInfo,
} from './types.js';

export { createSuccess, createError } from './types.js';

// Process State API
export type { ProcessStateAPI } from './process-state.js';
export { createProcessStateAPI } from './process-state.js';
