/**
 * BDD Assertion Helpers for delivery-process Tests
 *
 * Custom assertion utilities that work with vitest-cucumber step definitions.
 * These helpers provide domain-specific assertions for:
 * - Lint violations and results
 * - Pattern extraction results
 * - Scanner results
 * - Result monad validation
 *
 * @libar-docs
 */

import { expect } from "vitest";
import type { Result } from "../../../src/types/result.js";
import type { LintViolation, LintResult } from "../../../src/lint/index.js";
import type { ExtractedPattern, DocDirective } from "../../../src/types/index.js";
import type { ScanResults } from "../../../src/scanner/index.js";

// =============================================================================
// Result Monad Assertions
// =============================================================================

/**
 * Assert that a Result is successful.
 */
export function assertResultOk<T, E>(
  result: Result<T, E> | null
): asserts result is Result<T, E> & { ok: true } {
  expect(result).not.toBeNull();
  expect(result!.ok).toBe(true);
}

/**
 * Assert that a Result is an error.
 */
export function assertResultError<T, E>(
  result: Result<T, E> | null
): asserts result is Result<T, E> & { ok: false } {
  expect(result).not.toBeNull();
  expect(result!.ok).toBe(false);
}

/**
 * Get the value from a successful Result (with assertion).
 */
export function getResultValue<T, E>(result: Result<T, E> | null): T {
  assertResultOk(result);
  return result.value;
}

/**
 * Get the error from a failed Result (with assertion).
 */
export function getResultError<T, E>(result: Result<T, E> | null): E {
  assertResultError(result);
  return result.error;
}

// =============================================================================
// Lint Assertions
// =============================================================================

/**
 * Assert that a lint violation was detected.
 */
export function assertViolationDetected(
  violation: LintViolation | null
): asserts violation is LintViolation {
  expect(violation).not.toBeNull();
}

/**
 * Assert no lint violation was detected.
 */
export function assertNoViolation(violation: LintViolation | null): void {
  expect(violation).toBeNull();
}

/**
 * Assert lint violation properties.
 */
export function assertViolationProperties(
  violation: LintViolation | null,
  expected: {
    rule?: string;
    severity?: "error" | "warning" | "info";
    messageContains?: string;
  }
): void {
  assertViolationDetected(violation);

  if (expected.rule) {
    expect(violation.rule).toBe(expected.rule);
  }

  if (expected.severity) {
    expect(violation.severity).toBe(expected.severity);
  }

  if (expected.messageContains) {
    expect(violation.message).toContain(expected.messageContains);
  }
}

/**
 * Assert lint result contains a specific number of violations.
 */
export function assertViolationCount(result: LintResult | null, expectedCount: number): void {
  expect(result).not.toBeNull();
  expect(result!.violations).toHaveLength(expectedCount);
}

/**
 * Assert lint result contains a violation with specific rule.
 */
export function assertViolationWithRule(result: LintResult | null, rule: string): void {
  expect(result).not.toBeNull();
  const found = result!.violations.find((v) => v.rule === rule);
  expect(found).toBeDefined();
}

/**
 * Assert lint result has no violations.
 */
export function assertNoViolations(result: LintResult | null): void {
  expect(result).not.toBeNull();
  expect(result!.violations).toHaveLength(0);
}

// =============================================================================
// Pattern Assertions
// =============================================================================

/**
 * Assert that an extracted pattern has expected properties.
 */
export function assertPatternProperties(
  pattern: ExtractedPattern | null,
  expected: {
    name?: string;
    category?: string;
    status?: string;
    isCore?: boolean;
    phase?: number;
  }
): void {
  expect(pattern).not.toBeNull();

  if (expected.name) {
    expect(pattern!.name).toBe(expected.name);
  }

  if (expected.category) {
    expect(pattern!.category).toBe(expected.category);
  }

  if (expected.status) {
    expect(pattern!.status).toBe(expected.status);
  }

  if (expected.isCore !== undefined) {
    expect(pattern!.isCore).toBe(expected.isCore);
  }

  if (expected.phase !== undefined) {
    expect(pattern!.phase).toBe(expected.phase);
  }
}

/**
 * Assert that an extracted pattern has specific relationships.
 */
export function assertPatternRelationships(
  pattern: ExtractedPattern | null,
  expected: {
    uses?: string[];
    usedBy?: string[];
    dependsOn?: string[];
    enables?: string[];
  }
): void {
  expect(pattern).not.toBeNull();

  if (expected.uses) {
    expect(pattern!.uses).toEqual(expected.uses);
  }

  if (expected.usedBy) {
    expect(pattern!.usedBy).toEqual(expected.usedBy);
  }

  if (expected.dependsOn) {
    expect(pattern!.dependsOn).toEqual(expected.dependsOn);
  }

  if (expected.enables) {
    expect(pattern!.enables).toEqual(expected.enables);
  }
}

/**
 * Assert that a pattern collection has expected count.
 */
export function assertPatternCount(patterns: ExtractedPattern[], expectedCount: number): void {
  expect(patterns).toHaveLength(expectedCount);
}

/**
 * Assert that a pattern exists in a collection by name.
 */
export function assertPatternExists(patterns: ExtractedPattern[], name: string): ExtractedPattern {
  const found = patterns.find((p) => p.name === name);
  expect(found).toBeDefined();
  return found!;
}

// =============================================================================
// Directive Assertions
// =============================================================================

/**
 * Assert that a directive has expected tags.
 */
export function assertDirectiveTags(directive: DocDirective | null, expectedTags: string[]): void {
  expect(directive).not.toBeNull();
  for (const tag of expectedTags) {
    expect(directive!.tags).toContain(tag);
  }
}

/**
 * Assert that a directive has a description.
 */
export function assertDirectiveDescription(
  directive: DocDirective | null,
  expectedDescription: string
): void {
  expect(directive).not.toBeNull();
  expect(directive!.description).toBe(expectedDescription);
}

// =============================================================================
// Scanner Assertions
// =============================================================================

/**
 * Assert that a scan result found expected number of files.
 */
export function assertScanFileCount(
  result: Result<ScanResults, never> | null,
  expectedCount: number
): void {
  assertResultOk(result);
  expect(result.value.files).toHaveLength(expectedCount);
}

/**
 * Assert that a scan result found a file with specific path.
 */
export function assertScanFoundFile(
  result: Result<ScanResults, never> | null,
  filePath: string
): void {
  assertResultOk(result);
  const found = result.value.files.find((f) => f.filePath.includes(filePath));
  expect(found).toBeDefined();
}

// =============================================================================
// String/Output Assertions
// =============================================================================

/**
 * Assert that output contains expected text.
 */
export function assertOutputContains(output: string, expected: string): void {
  expect(output).toContain(expected);
}

/**
 * Assert that output matches expected pattern.
 */
export function assertOutputMatches(output: string, pattern: RegExp): void {
  expect(output).toMatch(pattern);
}

/**
 * Assert that output contains all expected sections.
 */
export function assertOutputSections(output: string, sections: string[]): void {
  for (const section of sections) {
    expect(output).toContain(section);
  }
}
