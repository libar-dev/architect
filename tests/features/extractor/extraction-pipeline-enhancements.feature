@architect
@architect-pattern:ExtractionPipelineEnhancementsTesting
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-implements:ReferenceDocShowcase
@architect-product-area:Annotation
Feature: Extraction Pipeline Enhancements

  Validates extraction pipeline capabilities for ReferenceDocShowcase:
  function signature surfacing, full property-level JSDoc,
  param/returns/throws extraction, and auto-shape discovery mode.

  Background: Extraction pipeline setup
    Given the extraction pipeline test context is initialized

  Rule: Function signatures surface full parameter types in ExportInfo

    **Invariant:** ExportInfo.signature shows full parameter types and
    return type instead of the placeholder value.
    **Rationale:** Reference documentation renders signatures verbatim — placeholder values instead of real types make the API docs unusable for consumers.

    **Verified by:** Simple function signature, Async function keeps async prefix,
    Multi-parameter function, Function with object parameter type

    @acceptance-criteria @happy-path
    Scenario: Simple function signature is extracted with full types
      Given a TypeScript file with content:
        """
        /** @architect */

        /**
         * @architect-core
         * Simple utility
         */
        export function greet(name: string): string {
          return `Hello, ${name}`;
        }
        """
      When the AST parser extracts pattern metadata
      Then the function export "greet" has signature "function greet(name: string): string;"

    @acceptance-criteria @happy-path
    Scenario: Async function keeps async prefix in signature
      Given a TypeScript file with content:
        """
        /** @architect */

        /**
         * @architect-core
         * Async loader
         */
        export async function loadData(url: string): Promise<string> {
          return fetch(url).then(r => r.text());
        }
        """
      When the AST parser extracts pattern metadata
      Then the function export "loadData" has signature "async function loadData(url: string): Promise<string>;"

    @acceptance-criteria @happy-path
    Scenario: Multi-parameter function has all types in signature
      Given a TypeScript file with content:
        """
        /** @architect */

        /**
         * @architect-core
         * Merge utility
         */
        export function merge(a: string[], b: string[], unique: boolean): string[] {
          return unique ? [...new Set([...a, ...b])] : [...a, ...b];
        }
        """
      When the AST parser extracts pattern metadata
      Then the function export "merge" has signature "function merge(a: string[], b: string[], unique: boolean): string[];"

    @acceptance-criteria @edge-case
    Scenario: Function with object parameter type preserves braces
      Given a TypeScript file with content:
        """
        /** @architect */

        /**
         * @architect-core
         * Config processor
         */
        export function configure(opts: { timeout: number; retries: number }): void {
          console.log(opts);
        }
        """
      When the AST parser extracts pattern metadata
      Then the function export "configure" has signature "function configure(opts: { timeout: number; retries: number }): void;"

  Rule: Property-level JSDoc preserves full multi-line content

    **Invariant:** Property-level JSDoc preserves full multi-line content
    without first-line truncation.
    **Rationale:** Truncated property descriptions lose important behavioral details (defaults, units, constraints) that consumers rely on when integrating with the API.

    **Verified by:** Multi-line property JSDoc preserved,
    Single-line property JSDoc unchanged

    @acceptance-criteria @happy-path
    Scenario: Multi-line property JSDoc is fully preserved
      Given TypeScript source for shape extraction:
        """
        /**
         * Configuration options for the processor.
         * Controls timeout behavior and retry strategy.
         */
        export interface ProcessorConfig {
          /**
           * Maximum time to wait for a response.
           * Measured in milliseconds from request start.
           * Defaults to 30000 if not specified.
           */
          timeout: number;
        }
        """
      When extracting shape "ProcessorConfig"
      Then the property "timeout" JSDoc contains all fragments:
        | fragment                                     |
        | Maximum time to wait for a response.         |
        | Measured in milliseconds from request start.  |
        | Defaults to 30000 if not specified.           |

    @acceptance-criteria @happy-path
    Scenario: Single-line property JSDoc still works
      Given TypeScript source for shape extraction:
        """
        export interface SimpleConfig {
          /** Timeout in milliseconds. */
          timeout: number;
        }
        """
      When extracting shape "SimpleConfig"
      Then the property "timeout" JSDoc is "Timeout in milliseconds."

  Rule: Param returns and throws tags are extracted from function JSDoc

    **Invariant:** JSDoc param, returns, and throws tags are extracted
    and stored on ExtractedShape for function-kind shapes.
    **Rationale:** Function reference docs require parameter, return, and exception documentation — missing extraction means consumers must read source code instead of generated docs.

    **Verified by:** Param tags extracted, Returns tag extracted,
    Throws tags extracted, TypeScript-style params without braces

    @acceptance-criteria @happy-path
    Scenario: Param tags are extracted from function JSDoc
      Given TypeScript source for shape extraction:
        """
        /**
         * Process an order with validation.
         * @param orderId - The unique order identifier
         * @param quantity - Number of items to process
         * @returns The processed order result
         */
        export function processOrder(orderId: string, quantity: number): OrderResult {
          throw new Error('not implemented');
        }
        """
      When extracting shape "processOrder"
      Then the shape has 2 param docs
      And the param docs match:
        | name     | description                    |
        | orderId  | The unique order identifier    |
        | quantity | Number of items to process     |

    @acceptance-criteria @happy-path
    Scenario: Returns tag is extracted from function JSDoc
      Given TypeScript source for shape extraction:
        """
        /**
         * Calculate the total price.
         * @returns The total price including tax
         */
        export function calculateTotal(): number {
          return 0;
        }
        """
      When extracting shape "calculateTotal"
      Then the shape has a returns doc with description "The total price including tax"

    @acceptance-criteria @happy-path
    Scenario: Throws tags are extracted from function JSDoc
      Given TypeScript source for shape extraction:
        """
        /**
         * Validate input data.
         * @param data - The input to validate
         * @throws {ValidationError} When input fails schema check
         * @throws {TypeError} When input is not a string
         */
        export function validate(data: string): boolean {
          return true;
        }
        """
      When extracting shape "validate"
      Then the shape has 2 throws docs
      And the throws docs match:
        | type            | description                      |
        | ValidationError | When input fails schema check    |
        | TypeError       | When input is not a string       |

    @acceptance-criteria @happy-path
    Scenario: JSDoc params with braces type syntax are parsed
      Given TypeScript source for shape extraction:
        """
        /**
         * Legacy-style JSDoc with types.
         * @param {string} name The user name
         * @param {number} age The user age
         * @returns {boolean} Whether the user is valid
         */
        export function isValid(name: string, age: number): boolean {
          return true;
        }
        """
      When extracting shape "isValid"
      Then the shape has 2 param docs
      And the typed param docs match:
        | name | type   | description    |
        | name | string | The user name  |
        | age  | number | The user age   |
      And the shape has a returns doc with type "boolean"

  Rule: Auto-shape discovery extracts all exported types via wildcard

    **Invariant:** When extract-shapes tag value is the wildcard character,
    all exported declarations are extracted without listing names.
    **Rationale:** Requiring explicit names for every export creates maintenance burden and stale annotations — wildcard discovery keeps shape docs in sync as exports are added or removed.

    **Verified by:** Wildcard extracts all exports,
    Non-exported declarations excluded,
    Mixed wildcard and names rejected,
    Same-name type and const exports produce one shape

    @acceptance-criteria @happy-path
    Scenario: Wildcard extracts all exported declarations
      Given TypeScript source for wildcard extraction:
        """
        export interface Config {
          timeout: number;
        }

        export type Status = 'active' | 'inactive';

        export function process(): void {}

        const internal = 42;
        """
      When extracting shapes with wildcard "*"
      Then 3 shapes are extracted
      And the extracted shapes include all:
        | name    |
        | Config  |
        | Status  |
        | process |
      And the extracted shapes do not include "internal"

    @acceptance-criteria @edge-case
    Scenario: Mixed wildcard and names produces warning
      Given TypeScript source for wildcard extraction:
        """
        export interface Foo { x: number; }
        """
      When extracting shapes with tag "*, Foo"
      Then extraction produces a warning about wildcard exclusivity
      And 0 shapes are extracted

    @acceptance-criteria @edge-case
    Scenario: Same-name type and const exports produce one shape
      Given TypeScript source for wildcard extraction:
        """
        export type Result<T, E = Error> =
          | { readonly ok: true; readonly value: T }
          | { readonly ok: false; readonly error: E };

        export const Result = {
          ok<T>(value: T): Result<T, never> {
            return { ok: true, value };
          },
        };
        """
      When extracting shapes with wildcard "*"
      Then 1 shapes are extracted
      And the extracted shapes include all:
        | name   |
        | Result |
      And the extracted shape "Result" has kind "type"
