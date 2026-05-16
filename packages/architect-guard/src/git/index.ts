/**
 * @architect
 * @architect-pattern GitModule
 * @architect-status active
 * @architect-role:barrel
 * @architect-bounded-context:generator
 * @architect-uses GitBranchDiff, GitHelpers
 *
 * ## Git Module - Pure Git Operations
 *
 * Shared git utilities used by both generators and lint layers.
 * Decouples orchestrator from Process Guard's domain-specific change detection.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

export { getChangedFilesList } from './branch-diff.js';
export { parseGitNameStatus, type ParsedGitNameStatus } from './name-status.js';
export { execGitSafe, sanitizeBranchName, GIT_MAX_BUFFER } from './helpers.js';
