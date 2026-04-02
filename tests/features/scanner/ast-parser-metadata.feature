@architect
@architect-pattern:AstParserMetadata
@architect-implements:AstParser
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:Annotation
Feature: TypeScript AST Parser - Metadata Extraction
  The AST Parser extracts @architect-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

  Background:
    Given a scanner context with temp directory

  Rule: Metadata is correctly extracted from JSDoc comments

      **Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all correctly parsed and separated.
      **Rationale:** Downstream codecs render each metadata field independently — incorrect parsing causes examples to leak into descriptions or signatures to be lost in generated documentation.
      **Verified by:** Extract examples from directive, Extract multi-line description, Track line numbers correctly, Extract function signature information, Ignore @param and @returns in description

    @function:parseFileDirectives @metadata
    Scenario: Extract examples from directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
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
         * @architect-core
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
         * @architect-core
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
         * @architect-core
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
         * @architect-core
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
      **Rationale:** Tags control taxonomy classification and pattern routing — extracting them from prose or examples would create phantom patterns and corrupt the registry.
      **Verified by:** Extract multiple tags from directive section, Extract tag with description on same line, NOT extract tags mentioned in description, NOT extract tags mentioned in @example sections

    @function:parseFileDirectives @tags
    Scenario: Extract multiple tags from directive section
      Given a TypeScript file with content:
        """
        /**
         * @architect-core @architect-api
         * @architect-overview
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
        | @architect-core    |
        | @architect-api     |
        | @architect-overview|

    @function:parseFileDirectives @tags
    Scenario: Extract tag with description on same line
      Given a TypeScript file with content:
        """
        /**
         * @architect-core Brief description on same line
         */
        export function inlineDesc() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@architect-core"

    @function:parseFileDirectives @tags @regression
    Scenario: NOT extract tags mentioned in description
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         *
         * This function works with @architect-api patterns.
         * It supports @architect-saga for orchestration.
         */
        export function processRequest() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@architect-core"
      And the directive should not have any tags:
        | value             |
        | @architect-api   |
        | @architect-saga  |

    @function:parseFileDirectives @tags @regression
    Scenario: NOT extract tags mentioned in @example sections
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Test function
         *
         * @example
         * ```typescript
         * hasTag('@architect-example'); // checking for a tag
         * hasTag('@architect-saga'); // another example
         * ```
         */
        export function hasTag(tag: string): boolean {
          return tag.startsWith('@architect');
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have 1 tag
      And the directive should have tag "@architect-core"
      And the directive should not have any tags:
        | value                 |
        | @architect-example   |
        | @architect-saga      |

  Rule: When to Use sections are extracted in all supported formats

      **Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and asterisk bullet format. When no When to Use section exists, the field is undefined.
      **Rationale:** Generated pattern documentation includes a When to Use section — failing to recognize any supported format means valid guidance silently disappears from output.
      **Verified by:** Extract When to Use heading format with bullet points, Extract When to use inline format, Extract asterisk bullets in When to Use section, Not set whenToUse when section is missing

    @function:parseFileDirectives @when-to-use
    Scenario: Extract When to Use heading format with bullet points
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
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
         * @architect-core
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
         * @architect-core
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
         * @architect-core
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
