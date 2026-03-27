/**
 * @architect
 * @architect-pattern GitModule
 * @architect-status active
 * @architect-arch-role barrel
 * @architect-arch-context generator
 * @architect-arch-layer infrastructure
 * @architect-uses GitBranchDiff, GitHelpers
 *
 * ## Git Module - Pure Git Operations
 *
 * Shared git utilities used by both generators and lint layers.
 * Decouples orchestrator from Process Guard's domain-specific change detection.
 */

export { getChangedFilesList } from './branch-diff.js';
export { parseGitNameStatus, type ParsedGitNameStatus } from './name-status.js';
export { execGitSafe, sanitizeBranchName, GIT_MAX_BUFFER } from './helpers.js';
