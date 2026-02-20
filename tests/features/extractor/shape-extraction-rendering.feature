@libar-docs
@libar-docs-pattern:ShapeExtractionRenderingTesting
@libar-docs-implements:ReferenceDocShowcase
@libar-docs-status:completed
@libar-docs-unlock-reason:'Split-from-original'
@libar-docs-product-area:Annotation
Feature: TypeScript Shape Extraction - Rendering and Validation

  Validates the shape extraction system that extracts TypeScript type
  definitions (interfaces, type aliases, enums, function signatures)
  from source files for documentation generation.

  Background: Shape extraction setup
    Given the shape extractor is initialized

  # ============================================================================
  # RULE 6: Multiple Shapes in Order
  # ============================================================================

  Rule: Multiple shapes are extracted in specified order

    @acceptance-criteria @unit
    Scenario: Shapes appear in tag order not source order
      Given TypeScript source code:
        """
        export interface Input { data: string; }
        export interface Options { config: boolean; }
        export interface Output { result: number; }
        """
      When extracting shapes "Output, Input, Options"
      Then 3 shapes should be extracted
      And shape 0 should have name "Output"
      And shape 1 should have name "Input"
      And shape 2 should have name "Options"

    @acceptance-criteria @unit
    Scenario: Mixed shape types in specified order
      Given TypeScript source code:
        """
        export type Status = 'ok' | 'error';
        export interface Config { timeout: number; }
        export function validate(input: unknown): boolean { return true; }
        """
      When extracting shapes "Status, Config, validate"
      Then 3 shapes should be extracted
      And shape 0 should have kind "type"
      And shape 1 should have kind "interface"
      And shape 2 should have kind "function"

  # ============================================================================
  # RULE 7: Shape Rendering
  # ============================================================================

  Rule: Extracted shapes render as fenced code blocks

    @acceptance-criteria @unit
    Scenario: Render shapes as markdown
      Given TypeScript source code:
        """
        export interface Input { data: string; }
        export interface Output { result: number; }
        """
      When extracting shapes "Input, Output"
      And rendering shapes as markdown
      Then the markdown should contain typescript code fence
      And the markdown should contain "interface Input"
      And the markdown should contain "interface Output"

  # ============================================================================
  # RULE 8: Import and Re-export Handling
  # ============================================================================

  Rule: Imported and re-exported shapes are tracked separately

    @acceptance-criteria @validation
    Scenario: Imported shape produces warning
      Given TypeScript source code:
        """
        import { Request } from './types.js';
        export interface MyHandler {
          handle(req: Request): void;
        }
        """
      When extracting shape "Request"
      Then the extraction should have imported entry for "Request"

    @acceptance-criteria @validation
    Scenario: Re-exported shape produces re-export entry
      Given TypeScript source code:
        """
        export { Foo } from './types.js';
        export type { Bar } from './other.js';
        """
      When extracting shape "Foo"
      Then the extraction should have re-exported entry for "Foo" from "./types.js"

  # ============================================================================
  # RULE 12: Parse Error Handling
  # ============================================================================

  Rule: Invalid TypeScript produces error result

    @acceptance-criteria @validation
    Scenario: Malformed TypeScript returns error
      Given TypeScript source code:
        """
        export interface { broken syntax
        """
      When extracting shape "Invalid" expecting failure
      Then extraction should fail with parse error

  # ============================================================================
  # RULE 10: Rendering Options
  # ============================================================================

  Rule: Shape rendering supports grouping options

    @acceptance-criteria @unit
    Scenario: Grouped rendering in single code block
      Given TypeScript source code:
        """
        export interface Input { data: string; }
        export interface Output { result: number; }
        """
      When extracting shapes "Input, Output"
      And rendering shapes with groupInSingleBlock true
      Then the markdown should have 1 code fence
      And the markdown should contain "interface Input"
      And the markdown should contain "interface Output"

    @acceptance-criteria @unit
    Scenario: Separate rendering with multiple code blocks
      Given TypeScript source code:
        """
        export interface Input { data: string; }
        export interface Output { result: number; }
        """
      When extracting shapes "Input, Output"
      And rendering shapes with groupInSingleBlock false
      Then the markdown should have 2 code fences

  # ============================================================================
  # RULE 11: Annotation Tag Stripping from JSDoc
  # ============================================================================

  Rule: Annotation tags are stripped from extracted JSDoc while preserving standard tags

    **Invariant:** Extracted shapes never contain @libar-docs-* annotation lines in their jsDoc field.

    **Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata
    for the extraction pipeline, not user-visible documentation content.

    @acceptance-criteria @unit
    Scenario: JSDoc with only annotation tags produces no jsDoc
      Given TypeScript source code:
        """
        /**
         * @libar-docs
         * @libar-docs-pattern ShapeExtractor
         * @libar-docs-status completed
         */
        export interface OnlyTags {
          value: string;
        }
        """
      When extracting shapes "OnlyTags"
      Then the shape "OnlyTags" should have no jsDoc

    @acceptance-criteria @unit
    Scenario: Mixed JSDoc preserves standard tags and strips annotation tags
      Given TypeScript source code:
        """
        /**
         * @libar-docs
         * @libar-docs-status active
         *
         * Configuration for the pipeline.
         *
         * @param timeout - Request timeout in ms
         * @returns The configured instance
         */
        export interface MixedTags {
          timeout: number;
        }
        """
      When extracting shapes "MixedTags"
      Then the shape "MixedTags" jsDoc should contain "Configuration for the pipeline"
      And the shape "MixedTags" jsDoc should contain "@param timeout"
      And the shape "MixedTags" jsDoc should contain "@returns"
      And the shape "MixedTags" jsDoc should not contain "@libar-docs"

    @acceptance-criteria @unit @edge-case
    Scenario: Single-line annotation-only JSDoc produces no jsDoc
      Given TypeScript source code:
        """
        /** @libar-docs-shape Foo */
        export interface SingleLine {
          id: string;
        }
        """
      When extracting shapes "SingleLine"
      Then the shape "SingleLine" should have no jsDoc

    @acceptance-criteria @unit @edge-case
    Scenario: Consecutive empty lines after tag removal are collapsed
      Given TypeScript source code:
        """
        /**
         * @libar-docs
         * @libar-docs-status roadmap
         *
         *
         * Useful description here.
         */
        export interface CollapsedLines {
          name: string;
        }
        """
      When extracting shapes "CollapsedLines"
      Then the shape "CollapsedLines" jsDoc should contain "Useful description here"
      And the shape "CollapsedLines" jsDoc should not contain consecutive empty JSDoc lines

  # ============================================================================
  # RULE 12: Input Validation
  # ============================================================================

  Rule: Large source files are rejected to prevent memory exhaustion

    @acceptance-criteria @unit @security
    Scenario: Source code exceeding 5MB limit returns error
      Given TypeScript source code larger than 5MB
      When attempting to extract shapes
      Then the extraction should fail with error containing "exceeds maximum allowed"
