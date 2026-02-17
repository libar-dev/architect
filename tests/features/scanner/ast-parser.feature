@libar-docs
@scanner @libar-docs-pattern:AstParser
@libar-docs-status:completed
@libar-docs-product-area:Annotation
Feature: AST Parser
  The AST Parser extracts @libar-docs-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

  Background:
    Given a scanner context with temp directory

  Rule: Export types are correctly identified from TypeScript declarations

      **Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract class, arrow function, async function, generic function, default export, re-export) is correctly classified.
      **Verified by:** Parse function export with directive, Parse type export with directive, Parse interface export with directive, Parse const export with directive, Parse class export with directive, Parse enum export with directive, Parse const enum export with directive, Parse abstract class export with directive, Parse arrow function export with directive, Parse async function export with directive, Parse generic function export with directive, Parse default export with directive, Parse re-exports with directive, Parse multiple exports in single statement, Parse multiple directives in same file

    @function:parseFileDirectives @happy-path
    Scenario: Parse function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Test function for authentication
         */
        export function authenticate(username: string, password: string): boolean {
          return username === 'admin' && password === 'secret';
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have tag "@libar-docs-core"
      And the directive description should contain "Test function for authentication"
      And the first export should be:
        | field | value        |
        | type  | function     |
        | name  | authenticate |

    @function:parseFileDirectives @happy-path
    Scenario: Parse type export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core @libar-docs-types
         * User type definition
         */
        export type User = {
          id: string;
          name: string;
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have tags:
        | value              |
        | @libar-docs-core   |
        | @libar-docs-types  |
      And the first export should be:
        | field | value |
        | type  | type  |
        | name  | User  |

    @function:parseFileDirectives @happy-path
    Scenario: Parse interface export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Config interface
         */
        export interface Config {
          apiUrl: string;
          timeout: number;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | interface |
        | name  | Config    |

    @function:parseFileDirectives @happy-path
    Scenario: Parse const export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * API configuration
         */
        export const API_CONFIG = {
          baseUrl: 'https://api.example.com',
          version: 'v1'
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value      |
        | type  | const      |
        | name  | API_CONFIG |

    @function:parseFileDirectives @happy-path
    Scenario: Parse class export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * User service class
         */
        export class UserService {
          constructor(private db: Database) {}

          async getUser(id: string) {
            return this.db.findUser(id);
          }
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value       |
        | type  | class       |
        | name  | UserService |

    @function:parseFileDirectives @happy-path
    Scenario: Parse enum export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Enum export
         */
        export enum Status {
          Active = 'active',
          Inactive = 'inactive',
          Pending = 'pending'
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value  |
        | type  | enum   |
        | name  | Status |
      And the directive code should contain "export enum Status"

    @function:parseFileDirectives @happy-path
    Scenario: Parse const enum export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Const enum export
         */
        export const enum Direction {
          Up = 1,
          Down = 2,
          Left = 3,
          Right = 4
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | enum      |
        | name  | Direction |
      And the directive code should contain "export const enum Direction"

    @function:parseFileDirectives @happy-path
    Scenario: Parse abstract class export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Abstract class export
         */
        export abstract class BaseService {
          abstract process(): void;

          log(message: string) {
            console.log(message);
          }
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value       |
        | type  | class       |
        | name  | BaseService |

    @function:parseFileDirectives @happy-path
    Scenario: Parse arrow function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Arrow function export
         */
        export const fetchData = async (url: string): Promise<Response> => {
          return fetch(url);
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | const     |
        | name  | fetchData |

    @function:parseFileDirectives @happy-path
    Scenario: Parse async function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Async function export
         */
        export async function loadData(id: string): Promise<Data> {
          const response = await fetch(`/api/data/${id}`);
          return response.json();
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | loadData |
      And the directive code should contain "async function loadData"

    @function:parseFileDirectives @happy-path
    Scenario: Parse generic function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Generic function export
         */
        export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
          return items.map(fn);
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | map      |
      And the directive code should contain "<T, U>"

    @function:parseFileDirectives @happy-path
    Scenario: Parse default export with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Default export
         */
        export default function authenticate() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | default  |

    @function:parseFileDirectives @happy-path
    Scenario: Parse re-exports with directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Re-exported utilities
         */
        export { foo, bar } from './utils';
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And 2 exports should be found
      And the exports should include names:
        | value |
        | foo   |
        | bar   |

    @function:parseFileDirectives @happy-path
    Scenario: Parse multiple exports in single statement
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Multiple exports
         */
        export const USER_ROLE = 'admin', USER_STATUS = 'active';
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And 2 exports should be found
      And the exports should include names:
        | value       |
        | USER_ROLE   |
        | USER_STATUS |

    @function:parseFileDirectives @happy-path
    Scenario: Parse multiple directives in same file
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * First function
         */
        export function first() {
          return 'first';
        }

        /**
         * @libar-docs-domain
         * Second function
         */
        export function second() {
          return 'second';
        }
        """
      When the file is parsed for directives
      Then 2 directives should be found
      And the directives should have details:
        | index | tag                 | exportName |
        | 1     | @libar-docs-core    | first      |
        | 2     | @libar-docs-domain  | second     |

  Rule: Metadata is correctly extracted from JSDoc comments

      **Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all correctly parsed and separated.
      **Verified by:** Extract examples from directive, Extract multi-line description, Track line numbers correctly, Extract function signature information, Ignore @param and @returns in description

    @function:parseFileDirectives @metadata
    Scenario: Extract examples from directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Test function with examples
         *
         * @example
         * ```typescript
         * const result = test('hello');
         * console.log(result); // 'HELLO'
         * ```
         *
         * @example
         * ```typescript
         * const result = test('world');
         * ```
         */
        export function test(input: string): string {
          return input.toUpperCase();
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 2 examples
      And the examples should contain:
        | value           |
        | test('hello')   |
        | test('world')   |

    @function:parseFileDirectives @metadata
    Scenario: Extract multi-line description
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * This is a detailed description
         * that spans multiple lines
         * and should be captured.
         */
        export function test() {
          return 'test';
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive description should contain all:
        | value                |
        | detailed description |
        | multiple lines       |
        | captured             |

    @function:parseFileDirectives @metadata
    Scenario: Track line numbers correctly
      Given a TypeScript file with content:
        """
        // Line 1
        // Line 2
        /**
         * @libar-docs-core
         * Test
         */
        export function test() {
          return 'test';
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive position should be:
        | field     | value |
        | startLine | 3     |
        | endLine   | 6     |

    @function:parseFileDirectives @metadata
    Scenario: Extract function signature information
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Function with signature
         */
        export function calculate(a: number, b: number, c: string): number {
          return a + b;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export signature should contain "calculate"

    @function:parseFileDirectives @metadata
    Scenario: Ignore @param and @returns in description
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Test function
         *
         * @param input - The input string
         * @returns The processed output
         */
        export function test(input: string): string {
          return input;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive description should be "Test function"
      And the directive description should not contain any:
        | value    |
        | @param   |
        | @returns |

  Rule: Tags are extracted only from the directive section, not from description or examples

      **Invariant:** Only tags appearing in the directive section (before the description) are extracted. Tags mentioned in description prose or example code blocks are ignored.
      **Verified by:** Extract multiple tags from directive section, Extract tag with description on same line, NOT extract tags mentioned in description, NOT extract tags mentioned in @example sections

    @function:parseFileDirectives @tags
    Scenario: Extract multiple tags from directive section
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core @libar-docs-api
         * @libar-docs-overview
         *
         * This is the description.
         */
        export function multiTagged() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 3 tags
      And the directive should have tags:
        | value               |
        | @libar-docs-core    |
        | @libar-docs-api     |
        | @libar-docs-overview|

    @function:parseFileDirectives @tags
    Scenario: Extract tag with description on same line
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core Brief description on same line
         */
        export function inlineDesc() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@libar-docs-core"

    @function:parseFileDirectives @tags @regression
    Scenario: NOT extract tags mentioned in description
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * This function works with @libar-docs-api patterns.
         * It supports @libar-docs-saga for orchestration.
         */
        export function processRequest() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@libar-docs-core"
      And the directive should not have any tags:
        | value             |
        | @libar-docs-api   |
        | @libar-docs-saga  |

    @function:parseFileDirectives @tags @regression
    Scenario: NOT extract tags mentioned in @example sections
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Test function
         *
         * @example
         * ```typescript
         * hasTag('@libar-docs-example'); // checking for a tag
         * hasTag('@libar-docs-saga'); // another example
         * ```
         */
        export function hasTag(tag: string): boolean {
          return tag.startsWith('@libar-docs');
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@libar-docs-core"
      And the directive should not have any tags:
        | value                 |
        | @libar-docs-example   |
        | @libar-docs-saga      |

  Rule: When to Use sections are extracted in all supported formats

      **Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and asterisk bullet format. When no When to Use section exists, the field is undefined.
      **Verified by:** Extract When to Use heading format with bullet points, Extract When to use inline format, Extract asterisk bullets in When to Use section, Not set whenToUse when section is missing

    @function:parseFileDirectives @when-to-use
    Scenario: Extract When to Use heading format with bullet points
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * ## Pattern Description
         *
         * ### When to Use
         *
         * - Command validation requires complex rules
         * - You want property-based testing
         * - Multiple handlers share logic
         */
        export function decider() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive whenToUse should have 3 items
      And the directive whenToUse should contain:
        | value                                      |
        | Command validation requires complex rules  |
        | You want property-based testing            |
        | Multiple handlers share logic              |

    @function:parseFileDirectives @when-to-use
    Scenario: Extract When to use inline format
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * **When to use:** Command validation requires complex business rules.
         *
         * This is additional description.
         */
        export function decider() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive whenToUse should have 1 item
      And the directive whenToUse should contain:
        | value                                                   |
        | Command validation requires complex business rules.     |

    @function:parseFileDirectives @when-to-use
    Scenario: Extract asterisk bullets in When to Use section
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * ## Pattern
         *
         * Description of the pattern.
         *
         * ### When to Use
         *
         * * First bullet with asterisk
         * * Second bullet with asterisk
         */
        export function withAsteriskBullets() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive whenToUse should contain:
        | value                        |
        | First bullet with asterisk   |
        | Second bullet with asterisk  |

    @function:parseFileDirectives @when-to-use
    Scenario: Not set whenToUse when section is missing
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * Just a regular description without When to Use section.
         */
        export function regular() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive whenToUse should be undefined

  Rule: Relationship tags extract uses and usedBy dependencies

      **Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description content. When no relationship tags exist, the fields are undefined.
      **Verified by:** Extract @libar-docs-uses with single value, Extract @libar-docs-uses with comma-separated values, Extract @libar-docs-used-by with single value, Extract @libar-docs-used-by with comma-separated values, Extract both uses and usedBy from same directive, NOT capture uses/usedBy values in description, Not set uses/usedBy when no relationship tags exist

    @function:parseFileDirectives @relationships
    Scenario: Extract @libar-docs-uses with single value
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-uses FSM Types
         *
         * Pattern that uses another pattern.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive uses should contain:
        | value     |
        | FSM Types |

    @function:parseFileDirectives @relationships
    Scenario: Extract @libar-docs-uses with comma-separated values
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-uses FSM Types, Invariant Error, CMS Types
         *
         * Pattern that uses multiple patterns.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive uses should have 3 items
      And the directive uses should contain:
        | value           |
        | FSM Types       |
        | Invariant Error |
        | CMS Types       |

    @function:parseFileDirectives @relationships
    Scenario: Extract @libar-docs-used-by with single value
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-used-by createDeciderHandler Factory
         *
         * Pattern used by another pattern.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive usedBy should contain:
        | value                        |
        | createDeciderHandler Factory |

    @function:parseFileDirectives @relationships
    Scenario: Extract @libar-docs-used-by with comma-separated values
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-used-by defineFSM Factory, Decider Types
         *
         * Pattern used by multiple patterns.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive usedBy should have 2 items
      And the directive usedBy should contain:
        | value            |
        | defineFSM Factory|
        | Decider Types    |

    @function:parseFileDirectives @relationships
    Scenario: Extract both uses and usedBy from same directive
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-uses FSM Types
         * @libar-docs-used-by createDeciderHandler Factory
         *
         * Pattern with both uses and used-by relationships.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive uses should contain:
        | value     |
        | FSM Types |
      And the directive usedBy should contain:
        | value                        |
        | createDeciderHandler Factory |

    @function:parseFileDirectives @relationships @regression
    Scenario: NOT capture uses/usedBy values in description
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * @libar-docs-uses FSM Types
         * @libar-docs-used-by createDeciderHandler Factory
         *
         * ## Decider Pattern - Pure Domain Decision Logic
         *
         * The Decider pattern separates pure business logic.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive description should start with "## Decider Pattern"
      And the directive description should not start with any:
        | value                        |
        | createDeciderHandler Factory |
        | FSM Types                    |
      And the directive uses should contain:
        | value     |
        | FSM Types |
      And the directive usedBy should contain:
        | value                        |
        | createDeciderHandler Factory |

    @function:parseFileDirectives @relationships
    Scenario: Not set uses/usedBy when no relationship tags exist
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         *
         * Pattern without relationship tags.
         */
        export function pattern() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive uses should be undefined
      And the directive usedBy should be undefined

  Rule: Edge cases and malformed input are handled gracefully

      **Invariant:** The parser never crashes on invalid input. Files without directives return empty results. Malformed TypeScript returns a structured error with the file path.
      **Verified by:** Skip comments without @libar-docs-* tags, Skip invalid directive with incomplete tag, Handle malformed TypeScript gracefully, Handle empty file gracefully, Handle whitespace-only file, Handle file with only comments and no exports, Skip inline comments (non-block), Handle unicode characters in descriptions

    @function:parseFileDirectives @edge-case
    Scenario: Skip comments without @libar-docs-* tags
      Given a TypeScript file with content:
        """
        /**
         * Regular JSDoc comment
         * @param foo - parameter
         * @returns result
         */
        export function regular(foo: string) {
          return foo;
        }
        """
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case
    Scenario: Skip invalid directive with incomplete tag
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-
         */
        export function invalid() {
          return 'invalid';
        }
        """
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case @error
    Scenario: Handle malformed TypeScript gracefully
      Given a TypeScript file with malformed content:
        """
        /**
         * @libar-docs-core
         * This will fail to parse
         */
        export function broken(
          // Missing closing parenthesis and function body
        """
      When the file is parsed for directives
      Then parsing should fail with error
      And the parse error should contain the file path

    @function:parseFileDirectives @edge-case
    Scenario: Handle empty file gracefully
      Given an empty TypeScript file
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case
    Scenario: Handle whitespace-only file
      Given a TypeScript file with content:
        """



        """
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case
    Scenario: Handle file with only comments and no exports
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * This is a comment with no following export
         */

        // Some other comment
        """
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case
    Scenario: Skip inline comments (non-block)
      Given a TypeScript file with content:
        """
        // @libar-docs-core - This is an inline comment
        export function test() {
          return 'test';
        }
        """
      When the file is parsed for directives
      Then 0 directives should be found

    @function:parseFileDirectives @edge-case
    Scenario: Handle unicode characters in descriptions
      Given a TypeScript file with content:
        """
        /**
         * @libar-docs-core
         * Funcion de autenticacion con emojis
         */
        export function autenticar() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive description should contain all:
        | value   |
        | Funcion |
        | emojis  |
