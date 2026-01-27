/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardTypes
 * @libar-docs-status active
 * @libar-docs-depends-on:FSMValidator
 *
 * ## ProcessGuardTypes - Type Definitions for Process Guard Linter
 *
 * Defines types for the process guard linter including:
 * - Process state derived from file annotations
 * - Git diff change detection results
 * - Validation results (violations and warnings)
 * - Session scoping types
 *
 * ### When to Use
 *
 * - When importing types for process guard implementations
 * - When implementing custom validation rules or decider functions
 * - When working with process state or change detection results
 *
 * ### Design Principles
 *
 * - Types enable pure Decider pattern (no I/O in validation)
 * - State is derived, not stored
 * - Protection levels from PDR-005 FSM
 */
export {};
//# sourceMappingURL=types.js.map