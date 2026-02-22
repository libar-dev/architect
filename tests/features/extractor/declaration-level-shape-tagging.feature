@libar-docs
@libar-docs-pattern:DeclarationLevelShapeTaggingTesting
@libar-docs-status:completed
@libar-docs-implements:DeclarationLevelShapeTagging
@libar-docs-product-area:Annotation
Feature: Declaration-Level Shape Tagging - Extraction

  Tests the discoverTaggedShapes function that scans TypeScript source
  code for declarations annotated with the libar-docs-shape JSDoc tag.

  Background: Shape discovery context
    Given the shape discovery system is initialized

  Rule: Declarations opt in via libar-docs-shape tag

    **Invariant:** Only declarations with the libar-docs-shape tag in their
    immediately preceding JSDoc are collected as tagged shapes.
    **Rationale:** Extracting shapes without an explicit opt-in tag would surface internal implementation details in generated API documentation, violating information hiding.

    **Verified by:** Tagged declaration is extracted,
    Untagged export is ignored,
    Group name is captured from tag value,
    Bare tag works without group,
    Non-exported tagged declaration is extracted,
    Tagged type is found despite same-name const declaration,
    Both same-name declarations tagged produces shapes for each

    @acceptance-criteria @happy-path
    Scenario: Tagged declaration is extracted as shape
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape */
        export interface RiskLevel {
          readonly name: string;
          readonly severity: number;
        }
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "RiskLevel" and kind "interface"

    @acceptance-criteria @happy-path
    Scenario: Untagged exported declaration is not extracted
      Given a TypeScript source file containing:
        """typescript
        /** Internal helper, not tagged for docs */
        export function normalizeInput(raw: string): string {
          return raw.trim().toLowerCase();
        }

        export type InternalState = 'idle' | 'busy';
        """
      When discoverTaggedShapes runs on the source
      Then 0 shapes are returned

    @acceptance-criteria @happy-path
    Scenario: Group name is captured from tag value
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape api-types */
        export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "RiskLevel" and group "api-types"

    @acceptance-criteria @edge-case
    Scenario: Bare tag works without group name
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape */
        export enum Priority { Low, Medium, High }
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "Priority" and no group

    @acceptance-criteria @edge-case
    Scenario: Non-exported tagged declaration is extracted
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape internal-types */
        interface InternalConfig {
          readonly maxRetries: number;
        }
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "InternalConfig" and kind "interface"
      And the shape has exported false

    @acceptance-criteria @edge-case
    Scenario: Tagged type is found despite same-name const declaration
      Given a TypeScript source file containing:
        """typescript
        /**
         * @libar-docs-shape core-types
         */
        export type Result<T, E = Error> =
          | { readonly ok: true; readonly value: T }
          | { readonly ok: false; readonly error: E };

        export const Result = {
          ok<T>(value: T): Result<T, never> {
            return { ok: true, value };
          },
          err<E>(error: E): Result<never, E> {
            return { ok: false, error };
          },
        };
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "Result" and kind "type"
      And the shape has name "Result" and group "core-types"

    @acceptance-criteria @edge-case
    Scenario: Both same-name declarations tagged produces shapes for each
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape core-types */
        export type Result<T, E = Error> =
          | { readonly ok: true; readonly value: T }
          | { readonly ok: false; readonly error: E };

        /** @libar-docs-shape core-types */
        export const Result = {
          ok<T>(value: T): Result<T, never> {
            return { ok: true, value };
          },
        };
        """
      When discoverTaggedShapes runs on the source
      Then 2 shapes are returned
      And the shapes include kind "type" and kind "const"

  Rule: Discovery uses existing estree parser with JSDoc comment scanning

    **Invariant:** The discoverTaggedShapes function uses the existing
    typescript-estree parse() and extractPrecedingJsDoc() approach.
    **Rationale:** Introducing a second parser would create divergent AST behavior — reusing the established parser ensures consistent JSDoc handling and avoids subtle extraction differences.

    **Verified by:** All 5 declaration kinds supported,
    JSDoc gap enforcement,
    Tag with other JSDoc content,
    Generic arrow function in non-JSX context parses correctly

    @acceptance-criteria @happy-path
    Scenario: All five declaration kinds are discoverable
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape core-types */
        export interface Config {
          readonly name: string;
        }

        /** @libar-docs-shape core-types */
        export type Status = 'active' | 'inactive';

        /** @libar-docs-shape core-types */
        export enum Priority { Low, Medium, High }

        /** @libar-docs-shape core-types */
        export function validate(input: string): boolean {
          return input.length > 0;
        }

        /** @libar-docs-shape core-types */
        export const MAX_RETRIES: number = 3;
        """
      When discoverTaggedShapes runs on the source
      Then 5 shapes are returned
      And the shapes have kinds "interface", "type", "enum", "function", "const"
      And all shapes have group "core-types"

    @acceptance-criteria @edge-case
    Scenario: JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape */


        // unrelated comment


        export interface TooFar {
          readonly value: string;
        }
        """
      When discoverTaggedShapes runs on the source
      Then 0 shapes are returned

    @acceptance-criteria @edge-case
    Scenario: Tag as last line before closing JSDoc delimiter
      Given a TypeScript source file containing:
        """typescript
        /**
         * Configuration options.
         * @libar-docs-shape config-types
         */
        export interface AppConfig {
          readonly debug: boolean;
        }
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "AppConfig" and group "config-types"

    @acceptance-criteria @edge-case
    Scenario: Hypothetical libar-docs-shape-extended tag is not matched
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape-extended */
        export interface NotAShape {
          readonly value: string;
        }
        """
      When discoverTaggedShapes runs on the source
      Then 0 shapes are returned

    @acceptance-criteria @edge-case
    Scenario: Tag coexists with other JSDoc content
      Given a TypeScript source file containing:
        """typescript
        /**
         * Represents risk severity levels.
         *
         * @libar-docs-shape risk-types
         * @see RiskCalculator
         */
        export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "RiskLevel" and group "risk-types"
      And the shape JSDoc contains "Represents risk severity levels"

    @acceptance-criteria @edge-case
    Scenario: Generic arrow function in non-JSX context parses correctly
      Given a TypeScript source file containing:
        """typescript
        /** @libar-docs-shape */
        export const identity = <T>(value: T): T => value;
        """
      When discoverTaggedShapes runs on the source
      Then 1 shape is returned
      And the shape has name "identity" and kind "const"
