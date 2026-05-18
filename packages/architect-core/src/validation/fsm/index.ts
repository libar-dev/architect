export {
  PROTECTION_LEVELS,
  type ProtectionLevel,
  getProtectionLevel,
  StatusValueSchema,
  isTerminalState,
  PROCESS_STATUS_VALUES,
  type ProcessStatusValue,
} from './states.js';

export {
  VALID_TRANSITIONS,
  isValidTransition,
  getValidTransitionsFrom,
  getTransitionErrorMessage,
  type TransitionMessageOptions,
} from './transitions.js';

export {
  type StatusValidationResult,
  type TransitionValidationResult,
  type CompletionMetadataValidationResult,
  type PatternMetadata,
  type FSMValidationOptions,
  isValidStatusValue,
  validateTransition,
  getProtectionSummary,
} from './validator.js';
