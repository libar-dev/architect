@architect
@architect-pattern:AstParserRelationshipsEdges
@architect-implements:AstParser
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:Annotation
Feature: TypeScript AST Parser - Relationships and Edge Cases
  The AST Parser extracts @architect-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

  Background:
    Given a scanner context with temp directory

  Rule: Relationship tags extract uses and usedBy dependencies

      **Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description content. When no relationship tags exist, the fields are undefined.
      **Rationale:** Relationship data drives dependency diagrams and impact analysis — extracting from prose would produce false edges from incidental mentions.
      **Verified by:** Extract @architect-uses with single value, Extract @architect-uses with comma-separated values, Extract @architect-used-by with single value, Extract @architect-used-by with comma-separated values, Extract both uses and usedBy from same directive, NOT capture uses/usedBy values in description, Not set uses/usedBy when no relationship tags exist

    @function:parseFileDirectives @relationships
    Scenario: Extract @architect-uses with single value
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * @architect-uses FSM Types
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
    Scenario: Extract @architect-uses with comma-separated values
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * @architect-uses FSM Types, Invariant Error, CMS Types
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
    Scenario: Extract @architect-used-by with single value
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * @architect-used-by createDeciderHandler Factory
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
    Scenario: Extract @architect-used-by with comma-separated values
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * @architect-used-by defineFSM Factory, Decider Types
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
         * @architect-core
         * @architect-uses FSM Types
         * @architect-used-by createDeciderHandler Factory
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
         * @architect-core
         * @architect-uses FSM Types
         * @architect-used-by createDeciderHandler Factory
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
         * @architect-core
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
      **Rationale:** The scanner processes hundreds of files in bulk — a single malformed file must not abort the entire pipeline or produce an undiagnosable crash.
      **Verified by:** Skip comments without @architect-* tags, Skip invalid directive with incomplete tag, Handle malformed TypeScript gracefully, Handle empty file gracefully, Handle whitespace-only file, Handle file with only comments and no exports, Skip inline comments (non-block), Handle unicode characters in descriptions

    @function:parseFileDirectives @edge-case
    Scenario: Skip comments without @architect-* tags
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
         * @architect-
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
         * @architect-core
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
         * @architect-core
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
        // @architect-core - This is an inline comment
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
         * @architect-core
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
