@libar-docs
@libar-docs-pattern:ScannerCore
@libar-docs-status:completed
@libar-docs-product-area:Annotation
@behavior @scanner-core
Feature: Scanner Core Integration
  The scanPatterns function orchestrates file discovery, directive detection,
  and AST parsing to extract documentation directives from TypeScript files.

  **Problem:**
  - Need to scan entire codebases for documentation directives efficiently
  - Files without @libar-docs opt-in should be skipped to save processing time
  - Parse errors in one file shouldn't prevent scanning of other files
  - Must support exclusion patterns for node_modules, tests, and custom paths

  **Solution:**
  - scanPatterns uses glob patterns for flexible file discovery
  - Two-phase filtering: quick regex check, then file opt-in validation
  - Result monad pattern captures errors without failing entire scan
  - Configurable exclude patterns with sensible defaults
  - Extracts complete directive information (tags, description, examples, exports)

  Background: Scanner integration context
    Given a scanner integration context with temp directory

  Rule: scanPatterns extracts directives from TypeScript files

    **Invariant:** Every file with a valid opt-in marker and JSDoc directives produces a complete ScannedFile with tags, description, examples, and exports.

    **Rationale:** Downstream generators depend on complete directive data; partial extraction causes silent documentation gaps across the monorepo.

    **Verified by:** Scan files and extract directives, Skip files without directives, Extract complete directive information

    @happy-path @basic-scanning
    Scenario: Scan files and extract directives
      Given a file "src/auth.ts" with content:
        """
        /**
         * @libar-docs
         */

        /**
         * @libar-docs-core @libar-docs-security
         * Authentication utilities
         */
        export function authenticate(username: string, password: string): boolean {
          return true;
        }
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And the scan should have 0 errors
      And file "auth.ts" should have 1 directive
      And the directive should have tag "@libar-docs-core"
      And the directive should have 1 export

    @happy-path @basic-scanning
    Scenario: Skip files without directives
      Given a file "src/no-directive.ts" with content:
        """
        export function regular() {
          return 'no directive here';
        }
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 0 files
      And the scan should have 0 errors

    @happy-path @complete-extraction
    Scenario: Extract complete directive information
      Given a file "src/complete.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core @libar-docs-validation
         * Validates user input
         *
         * This function performs comprehensive validation
         * of user-provided data.
         *
         * @example
         * ```typescript
         * const isValid = validate({ name: 'John' });
         * ```
         */
        export function validate(input: Record<string, unknown>): boolean {
          return Object.keys(input).length > 0;
        }
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And the scan should have 0 errors
      And the directive should have tags "@libar-docs-core" and "@libar-docs-validation"
      And the directive description should contain "Validates user input"
      And the directive description should also contain "comprehensive validation"
      And the directive should have 1 example
      And the directive example should contain "validate({ name"
      And the directive code should contain "export function validate"
      And the directive code should also contain "Object.keys(input)"
      And the directive should have 1 export named "validate" of type "function"

  Rule: scanPatterns collects errors without aborting

    **Invariant:** A parse failure in one file never prevents other files from being scanned; the result is always Ok with errors collected separately.

    **Rationale:** In a monorepo with hundreds of files, a single syntax error must not block the entire documentation pipeline.

    **Verified by:** Collect errors for files that fail to parse, Always return Ok result even with broken files

    @error-handling @parse-errors
    Scenario: Collect errors for files that fail to parse
      Given a file "src/valid.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * Valid file
         */
        export function valid() {
          return true;
        }
        """
      And a file "src/invalid.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * This will fail
         */
        export function broken(
        // Missing closing
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And file "valid.ts" should be in the results
      And the scan should have 1 error
      And the error should reference file "invalid.ts"

    @error-handling @graceful-degradation
    Scenario: Always return Ok result even with broken files
      Given a file "src/broken1.ts" with content:
        """
        export function broken(
        """
      And a file "src/broken2.ts" with content:
        """
        export function broken(
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 0 files
      And the scan should have 0 errors

  Rule: Pattern matching and exclusion filtering

    **Invariant:** Glob patterns control file discovery and exclusion patterns remove matched files before scanning.

    **Verified by:** Return empty results when no patterns match, Respect exclusion patterns, Handle multiple files with multiple directives each

    @edge-case @empty-results
    Scenario: Return empty results when no patterns match
      When scanning with pattern "nonexistent/**/*.ts"
      Then the scan should succeed with 0 files
      And the scan should have 0 errors

    @happy-path @exclusion-patterns
    Scenario: Respect exclusion patterns
      Given a file "src/public.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * Public API
         */
        export function publicApi() {}
        """
      And a file "src/internal/secret.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * Internal implementation
         */
        export function internalImpl() {}
        """
      When scanning with pattern "src/**/*.ts" excluding "**/internal/**"
      Then the scan should succeed with 1 file
      And file "public.ts" should be in the results
      And file "internal" should not be in the results

    @happy-path @multiple-files
    Scenario: Handle multiple files with multiple directives each
      Given a file "src/file1.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * First directive
         */
        export function first() {}

        /**
         * @libar-docs-domain
         * Second directive
         */
        export function second() {}
        """
      And a file "src/file2.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-validation
         * Third directive
         */
        export function third() {}
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 2 files
      And the scan should have 0 errors
      And file "file1.ts" should have 2 directives
      And file "file2.ts" should have 1 directive

  Rule: File opt-in requirement gates scanning

    **Invariant:** Only files containing a standalone @libar-docs marker (not @libar-docs-*) are eligible for directive extraction.

    **Rationale:** Without opt-in gating, every TypeScript file in the monorepo would be parsed, wasting processing time on files that have no documentation directives.

    **Verified by:** Handle files with quick directive check optimization, Skip files without @libar-docs file-level opt-in, Not confuse @libar-docs-* with @libar-docs opt-in, Detect @libar-docs opt-in combined with section tags

    @happy-path @optimization
    Scenario: Handle files with quick directive check optimization
      Given a file "src/no-docs.ts" with content:
        """
        export function regular() {
          return 'no docs';
        }
        """
      And a file "src/with-docs.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * Documented
         */
        export function documented() {
          return 'documented';
        }
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And file "with-docs.ts" should be in the results

    @edge-case @opt-in-required
    Scenario: Skip files without @libar-docs file-level opt-in
      Given a file "src/no-optin.ts" with content:
        """
        /**
         * @libar-docs-core
         * This file has section tags but no file-level opt-in
         */
        export function noOptIn() {}
        """
      And a file "src/with-optin.ts" with content:
        """
        /** @libar-docs */

        /**
         * @libar-docs-core
         * This file has proper opt-in
         */
        export function withOptIn() {}
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And file "with-optin.ts" should be in the results
      And the scan should have 0 errors

    @edge-case @opt-in-distinction
    Scenario: Not confuse @libar-docs-* with @libar-docs opt-in
      Given a file "src/section-only.ts" with content:
        """
        /**
         * @libar-docs-core @libar-docs-event-sourcing
         * Multiple section tags but no opt-in
         */
        export function sectionOnly() {}
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 0 files
      And the scan should have 0 errors

    @happy-path @opt-in-combined
    Scenario: Detect @libar-docs opt-in combined with section tags
      Given a file "src/combined.ts" with content:
        """
        /**
         * @libar-docs @libar-docs-core
         * Combined opt-in and section tag
         */
        export function combined() {}
        """
      When scanning with pattern "src/**/*.ts"
      Then the scan should succeed with 1 file
      And file "combined.ts" should have 1 directive
      And the directive should have tag "@libar-docs-core"
      And the scan should have 0 errors
