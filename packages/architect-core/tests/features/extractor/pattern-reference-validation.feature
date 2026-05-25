@architect
@architect-pattern:PatternReferenceValidation
@architect-implements:ExtractionDiagnostics,PatternClassification
@architect-status:active
@architect-product-area:Annotation
@behavior @taxonomy
Feature: Pattern-name and uses-target validation stay declaration-driven

  The runtime graph must only resolve `@architect-uses` against explicitly
  declared `@architect-pattern` values. Inferred export names and heading-style
  descriptions are not valid authored identities, and cross-package `src/`
  declarations should resolve as soft-linked external references rather than as
  dangling strings.

  Background: Pattern reference validation context
    Given a pattern reference validation context

  Rule: Invalid identities fail with explicit validation feedback

    **Invariant:** Invalid `@architect-pattern` identifiers surface clear validation failures instead of silently normalizing or falling back to headings.
    **Rationale:** Later lint enforcement depends on deterministic runtime feedback for invalid authored identities.
    **Verified by:** Invalid fixture skips directive with PascalCase guidance, Heading-style inferred identity fails extraction

    @acceptance-criteria @happy-path
    Scenario: Invalid fixture skips directive with PascalCase guidance
      When I scan the invalid pattern fixture
      Then the scan skips 1 directive
      And the skipped directive reason mentions "PascalCase only"

    @acceptance-criteria @happy-path
    Scenario: Heading-style inferred identity fails extraction
      Given a TypeScript file "src/heading-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-status:completed
         * @architect-role:utility
         * ## Pattern Name - descriptive heading
         */
        export function headingPattern(): boolean {
          return true;
        }
        """
      When I extract TypeScript patterns from the temporary workspace
      Then TypeScript extraction reports diagnostic code "invalid-pattern-name"
      And TypeScript extraction reports 1 pattern validation error

  Rule: Uses targets resolve only against declared patterns

    **Invariant:** `@architect-uses` resolves only to explicitly declared `@architect-pattern` values; same-package targets create internal graph edges and cross-package `src/` targets create soft-linked external edges.
    **Rationale:** This prevents framework/type names from becoming accidental graph edges while preserving authored cross-package relationships.
    **Verified by:** Undeclared uses target stays dangling, Same-package declared target links internally, Cross-package declared target links externally

    @acceptance-criteria @happy-path
    Scenario: Undeclared uses target stays dangling
      Given a TypeScript file "src/source-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-pattern:SourcePattern
         * @architect-status:completed
         * @architect-role:utility
         * @architect-uses:ProjectionContext
         */
        export function sourcePattern(): boolean {
          return true;
        }
        """
      When I build the runtime graph from the temporary workspace
      Then graph validation contains dangling uses target "ProjectionContext" for pattern "SourcePattern"

    @acceptance-criteria @happy-path
    Scenario: Same-package declared target links internally
      Given a TypeScript file "src/source-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-pattern:SourcePattern
         * @architect-status:completed
         * @architect-role:utility
         * @architect-uses:TargetPattern
         */
        export function sourcePattern(): boolean {
          return true;
        }
        """
      And a TypeScript file "src/target-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-pattern:TargetPattern
         * @architect-status:completed
         * @architect-role:utility
         */
        export function targetPattern(): boolean {
          return true;
        }
        """
      When I build the runtime graph from the temporary workspace
      Then graph validation has no dangling uses targets
      And relationship entry "TargetPattern" has usedBy value "SourcePattern"

    @acceptance-criteria @happy-path
    Scenario: Cross-package declared target links externally
      Given a TypeScript file "packages/architect-core/src/source-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-pattern:SourcePattern
         * @architect-status:completed
         * @architect-role:utility
         * @architect-uses:architect-projection:TargetPattern
         */
        export function sourcePattern(): boolean {
          return true;
        }
        """
      And a TypeScript file "packages/architect-projection/src/target-pattern.ts" with content:
        """
        /** @architect */

        /**
         * @architect-pattern:TargetPattern
         * @architect-status:completed
         * @architect-role:utility
         */
        export function targetPattern(): boolean {
          return true;
        }
        """
      When I build the runtime graph from the temporary workspace
      Then graph validation has no dangling uses targets
      And relationship entry "SourcePattern" preserves uses target "architect-projection:TargetPattern"
      And relationship entry "TargetPattern" has usedBy value "SourcePattern"
