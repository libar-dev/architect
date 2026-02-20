@libar-docs
@libar-docs-pattern:ShapeExtractionTypesTesting
@libar-docs-implements:ReferenceDocShowcase
@libar-docs-status:completed
@libar-docs-product-area:Annotation
Feature: TypeScript Shape Extraction - Type Extraction

  Validates the shape extraction system that extracts TypeScript type
  definitions (interfaces, type aliases, enums, function signatures)
  from source files for documentation generation.

  Background: Shape extraction setup
    Given the shape extractor is initialized

  # ============================================================================
  # RULE 1: Tag Definition
  # ============================================================================

  Rule: extract-shapes tag exists in registry with CSV format

    @acceptance-criteria @unit
    Scenario: Tag registry contains extract-shapes with correct format
      Given the tag registry is loaded
      Then the tag "extract-shapes" should exist with format "csv"

  # ============================================================================
  # RULE 2: Interface Extraction
  # ============================================================================

  Rule: Interfaces are extracted from TypeScript AST

    @acceptance-criteria @unit
    Scenario: Extract simple interface
      Given TypeScript source code:
        """
        export interface MyConfig {
          timeout: number;
          retries: number;
        }
        """
      When extracting shape "MyConfig"
      Then the shape should be extracted with kind "interface"
      And the shape source should contain "timeout: number"

    @acceptance-criteria @unit
    Scenario: Extract interface with JSDoc
      Given TypeScript source code:
        """
        /** Configuration for the processor. */
        export interface ConfigOptions {
          /** Timeout in milliseconds. */
          timeout: number;
        }
        """
      When extracting shape "ConfigOptions"
      Then the shape should be extracted with kind "interface"
      And the shape JSDoc should contain "Configuration for the processor"

    @acceptance-criteria @unit
    Scenario: Extract interface with generics
      Given TypeScript source code:
        """
        export interface Result<T, E = Error> {
          value?: T;
          error?: E;
        }
        """
      When extracting shape "Result"
      Then the shape should be extracted with kind "interface"
      And the shape source should contain "<T, E = Error>"

    @acceptance-criteria @unit
    Scenario: Extract interface with extends
      Given TypeScript source code:
        """
        interface BaseConfig { base: string; }
        export interface ExtendedConfig extends BaseConfig {
          extra: string;
        }
        """
      When extracting shape "ExtendedConfig"
      Then the shape should be extracted with kind "interface"
      And the shape source should contain "extends BaseConfig"

    @acceptance-criteria @validation
    Scenario: Non-existent shape produces not-found entry
      Given TypeScript source code:
        """
        export interface Exists { x: number; }
        """
      When extracting shape "NonExistent"
      Then the extraction should have not-found entry for "NonExistent"

  # ============================================================================
  # RULE 2b: Property-Level JSDoc Extraction
  # ============================================================================

  Rule: Property-level JSDoc is extracted for interface properties

    The extractor uses strict adjacency (gap = 1 line) to prevent
    interface-level JSDoc from being misattributed to the first property.

    @acceptance-criteria @unit
    Scenario: Extract properties with adjacent JSDoc
      Given TypeScript source code:
        """
        export interface User {
          /** The user's unique identifier */
          id: string;
          /** The user's display name */
          name: string;
        }
        """
      When extracting shape "User"
      Then the shape should have property docs for "id"
      And the property "id" JSDoc should contain "unique identifier"
      And the shape should have property docs for "name"
      And the property "name" JSDoc should contain "display name"

    @acceptance-criteria @unit @edge-case
    Scenario: Interface JSDoc not attributed to first property
      Given TypeScript source code:
        """
        /**
         * Represents a user in the system.
         * This JSDoc belongs to the interface.
         */
        export interface User {
          id: string;
          name: string;
        }
        """
      When extracting shape "User"
      Then the shape JSDoc should contain "Represents a user"
      And the shape should not have property docs for "id"
      And the shape should not have property docs for "name"

    @acceptance-criteria @unit
    Scenario: Mixed documented and undocumented properties
      Given TypeScript source code:
        """
        export interface Config {
          /** Required API key */
          apiKey: string;
          timeout: number;
          /** Optional retry count */
          retries: number;
        }
        """
      When extracting shape "Config"
      Then the shape should have property docs for "apiKey"
      And the shape should not have property docs for "timeout"
      And the shape should have property docs for "retries"

  # ============================================================================
  # RULE 3: Type Alias Extraction
  # ============================================================================

  Rule: Type aliases are extracted from TypeScript AST

    @acceptance-criteria @unit
    Scenario: Extract union type alias
      Given TypeScript source code:
        """
        export type Status = 'pending' | 'active' | 'completed';
        """
      When extracting shape "Status"
      Then the shape should be extracted with kind "type"
      And the shape source should contain "'pending' | 'active' | 'completed'"

    @acceptance-criteria @unit
    Scenario: Extract mapped type
      Given TypeScript source code:
        """
        export type Readonly<T> = { readonly [K in keyof T]: T[K] };
        """
      When extracting shape "Readonly"
      Then the shape should be extracted with kind "type"
      And the shape source should contain "[K in keyof T]"

    @acceptance-criteria @unit
    Scenario: Extract conditional type
      Given TypeScript source code:
        """
        export type Unwrap<T> = T extends Promise<infer U> ? U : T;
        """
      When extracting shape "Unwrap"
      Then the shape should be extracted with kind "type"
      And the shape source should contain "extends Promise<infer U>"

  # ============================================================================
  # RULE 4: Enum Extraction
  # ============================================================================

  Rule: Enums are extracted from TypeScript AST

    @acceptance-criteria @unit
    Scenario: Extract string enum
      Given TypeScript source code:
        """
        export enum Severity {
          Error = 'error',
          Warning = 'warning',
          Info = 'info',
        }
        """
      When extracting shape "Severity"
      Then the shape should be extracted with kind "enum"
      And the shape source should contain "Error = 'error'"

    @acceptance-criteria @unit
    Scenario: Extract const enum
      Given TypeScript source code:
        """
        export const enum Direction {
          Up,
          Down,
          Left,
          Right,
        }
        """
      When extracting shape "Direction"
      Then the shape should be extracted with kind "enum"
      And the shape source should contain "const enum"

  # ============================================================================
  # RULE 5: Function Signature Extraction
  # ============================================================================

  Rule: Function signatures are extracted with body omitted

    @acceptance-criteria @unit
    Scenario: Extract function signature
      Given TypeScript source code:
        """
        export function validateChanges(input: DeciderInput): DeciderOutput {
          return { result: true, events: [] };
        }
        """
      When extracting shape "validateChanges"
      Then the shape should be extracted with kind "function"
      And the shape source should contain "function validateChanges"
      And the shape source should not contain "return"

    @acceptance-criteria @unit
    Scenario: Extract async function signature
      Given TypeScript source code:
        """
        export async function fetchData<T>(url: string): Promise<T> {
          const response = await fetch(url);
          return response.json();
        }
        """
      When extracting shape "fetchData"
      Then the shape should be extracted with kind "function"
      And the shape source should contain "async function fetchData"

  # ============================================================================
  # RULE 11: Const Declaration Extraction
  # ============================================================================

  Rule: Const declarations are extracted from TypeScript AST

    @acceptance-criteria @unit
    Scenario: Extract const with type annotation
      Given TypeScript source code:
        """
        export const API_VERSION: string = 'v1.0.0';
        """
      When extracting shape "API_VERSION"
      Then the shape should be extracted with kind "const"
      And the shape source should contain "const API_VERSION: string"

    @acceptance-criteria @unit
    Scenario: Extract const without type annotation
      Given TypeScript source code:
        """
        export const MAX_RETRIES = 3;
        """
      When extracting shape "MAX_RETRIES"
      Then the shape should be extracted with kind "const"
      And the shape source should contain "MAX_RETRIES = 3"

  # ============================================================================
  # RULE 13: Non-Exported Shape Extraction
  # ============================================================================

  Rule: Non-exported shapes are extractable

    @acceptance-criteria @unit
    Scenario: Extract non-exported interface
      Given TypeScript source code:
        """
        interface InternalConfig {
          secret: string;
        }
        """
      When extracting shape "InternalConfig"
      Then the shape should be extracted with kind "interface"
      And the shape should have exported false

    @acceptance-criteria @unit
    Scenario: Re-export marks internal shape as exported
      Given TypeScript source code:
        """
        interface Config { value: number; }
        export { Config };
        """
      When extracting shape "Config"
      Then the shape should be extracted with kind "interface"
      And the shape should have exported true
