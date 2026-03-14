/**
 * @libar-docs
 * @libar-docs-pattern GitModule
 * @libar-docs-status active
 * @libar-docs-arch-role barrel
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 *
 * ## Git Module - Pure Git Operations
 *
 * Shared git utilities used by both generators and lint layers.
 * Decouples orchestrator from Process Guard's domain-specific change detection.
 */

export { getChangedFilesList } from './branch-diff.js';
