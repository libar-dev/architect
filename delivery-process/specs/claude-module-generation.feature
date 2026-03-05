@libar-docs
@libar-docs-pattern:ClaudeModuleGeneration
@libar-docs-status:completed
@libar-docs-phase:25
@libar-docs-effort:1.5d
@libar-docs-product-area:Generation
@libar-docs-business-value:automated-claude-md-modules-from-source
@libar-docs-priority:high
@libar-docs-executable-specs:tests/features/behavior/claude-modules
Feature: CLAUDE.md Module Generation from Source Annotations

  **Problem:** CLAUDE.md modules are hand-written markdown files that drift from source
  code over time. When behavior specs or implementation details change, module content
  becomes stale. Manual synchronization is tedious and error-prone. Different consumers
  need different detail levels (compact for AI context, detailed for human reference).

  **Solution:** Generate CLAUDE.md modules directly from behavior spec feature files using
  dedicated `claude-*` tags. The same source generates both:
  - Compact modules for `_claude-md/` (AI context optimized)
  - Detailed documentation for `docs/` (human reference, progressive disclosure)

  Three tags control module generation:
  - `@libar-docs-claude-module` - Module identifier (becomes filename)
  - `@libar-docs-claude-section` - Target section directory in `_claude-md/`
  - `@libar-docs-claude-tags` - Tags for variation filtering in modular-claude-md

  **Why It Matters:**
  | Benefit | How |
  | Single source of truth | Behavior specs ARE the module content |
  | Always-current modules | Generated on each docs build |
  | Progressive disclosure | Same source → compact module + detailed docs |
  | Preserves Rule structure | `Rule:` blocks become module sections |
  | Extracts decision tables | `Scenario Outline Examples:` become lookup tables |
  | CLI integration | `pnpm docs:claude-modules` via generator registry |

  **Prototype Example:**
  The Process Guard behavior spec (`tests/features/validation/process-guard.feature`)
  generates both `_claude-md/delivery-process/process-guard.md` and detailed docs.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | claude-module tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | claude-section tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | claude-tags tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | DocDirective schema fields | complete | validation-schemas/doc-directive.ts | Yes | unit |
      | ExtractedPattern schema fields | complete | validation-schemas/extracted-pattern.ts | Yes | unit |
      | Gherkin parser tag extraction | complete | extractor/gherkin-extractor.ts | Yes | unit |
      | ClaudeModuleCodec | complete | renderable/codecs/claude-module.ts | Yes | unit |
      | Claude module generator | complete | generators/built-in/codec-generators.ts | Yes | unit |
      | Generator registry integration | complete | generators/built-in/codec-generators.ts | Yes | unit |
      | Process Guard annotated example | n/a | tests/features/validation/process-guard.feature | No | - |
      | Example generated module | n/a | _example-output/process-guard.md | No | - |

  # ============================================================================
  # RULE 1: Claude Module Tags in Registry
  # ============================================================================

  Rule: Claude module tags exist in the tag registry

    **Invariant:** Three claude-specific tags (`claude-module`, `claude-section`,
    `claude-tags`) must exist in the tag registry with correct format and values.

    **Rationale:** Module generation requires metadata to determine output path,
    section placement, and variation filtering. Standard tag infrastructure enables
    consistent extraction via the existing Gherkin parser.

    **Verified by:** Tag registry contains claude-module, Tag registry contains
    claude-section, Tag registry contains claude-tags, claude-section has enum values

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains claude-module
      Given the tag registry is loaded
      When querying for tag "claude-module"
      Then the tag should exist
      And the tag format should be "value"
      And the tag purpose should contain "filename"

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains claude-section
      Given the tag registry is loaded
      When querying for tag "claude-section"
      Then the tag should exist
      And the tag format should be "enum"
      And the tag should have values including "core", "delivery-process", "testing", "infrastructure", "workflow"

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains claude-tags
      Given the tag registry is loaded
      When querying for tag "claude-tags"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should contain "variation filtering"

  # ============================================================================
  # RULE 2: Gherkin Parser Extraction
  # ============================================================================

  Rule: Gherkin parser extracts claude module tags from feature files

    **Invariant:** The Gherkin extractor must extract `claude-module`, `claude-section`,
    and `claude-tags` from feature file tags into ExtractedPattern objects.

    **Rationale:** Behavior specs are the source of truth for CLAUDE.md module content.
    Parser must extract module metadata alongside existing pattern metadata.

    **Verified by:** Extract claude-module from feature tags, Extract claude-section
    from feature tags, Extract claude-tags as array, Handle missing claude tags gracefully

    @acceptance-criteria @happy-path
    Scenario: Extract claude-module from feature tags
      Given a feature file with tags:
        """gherkin
        @libar-docs-claude-module:process-guard
        @libar-docs-claude-section:delivery-process
        Feature: Process Guard
        """
      When the Gherkin extractor processes the file
      Then the pattern should have claudeModule "process-guard"

    @acceptance-criteria @happy-path
    Scenario: Extract claude-section from feature tags
      Given a feature file with tags:
        """gherkin
        @libar-docs-claude-module:fsm-validator
        @libar-docs-claude-section:testing
        Feature: FSM Validator
        """
      When the Gherkin extractor processes the file
      Then the pattern should have claudeSection "testing"

    @acceptance-criteria @happy-path
    Scenario: Extract claude-tags as array
      Given a feature file with tags:
        """gherkin
        @libar-docs-claude-tags:core-mandatory,delivery-process,platform-packages
        Feature: Multi-tag Example
        """
      When the Gherkin extractor processes the file
      Then the pattern should have claudeTags ["core-mandatory", "delivery-process", "platform-packages"]

    @acceptance-criteria @validation
    Scenario: Patterns without claude tags are not module candidates
      Given a feature file without claude-module tag
      When the Gherkin extractor processes the file
      Then the pattern should have claudeModule undefined
      And the pattern should not be included in module generation

  # ============================================================================
  # RULE 3: Content Extraction from Feature Structure
  # ============================================================================

  Rule: Module content is extracted from feature file structure

    **Invariant:** The codec must extract content from standard feature file elements:
    Feature description (Problem/Solution), Rule blocks, and Scenario Outline Examples.

    **Rationale:** Behavior specs already contain well-structured, prescriptive content.
    The extraction preserves structure rather than flattening to prose.

    **Verified by:** Feature description becomes intro, Rule names become section headers,
    Rule descriptions become content, Scenario Outline Examples become tables

    @acceptance-criteria @happy-path
    Scenario: Feature description becomes module introduction
      Given a feature file with description:
        """gherkin
        Feature: Process Guard
          Pure validation for enforcing delivery process rules.

          **Problem:**
          - Completed specs modified without unlock reason
          - Invalid status transitions

          **Solution:**
          - checkProtectionLevel() enforces unlock-reason
          - checkStatusTransitions() validates FSM
        """
      When generating the claude module
      Then the module should start with "### Process Guard"
      And the module should contain the Problem section
      And the module should contain the Solution section

    @acceptance-criteria @happy-path
    Scenario: Rule blocks become module sections
      Given a feature file with rules:
        """gherkin
        Rule: Completed files require unlock-reason to modify

          **Invariant:** Modification of completed spec requires explicit unlock.

          **Rationale:** Prevents accidental changes to approved work.
        """
      When generating the claude module
      Then the module should contain "#### Completed files require unlock-reason to modify"
      And the module should contain the invariant statement
      And the module should contain the rationale

    @acceptance-criteria @happy-path
    Scenario: Scenario Outline Examples become decision tables
      Given a feature file with scenario outline:
        """gherkin
        Scenario Outline: Protection level from status
          Given a file with status "<status>"
          Then protection level is "<protection>"

          Examples:
            | status    | protection |
            | completed | hard       |
            | active    | scope      |
            | roadmap   | none       |
        """
      When generating the claude module
      Then the module should contain a markdown table with headers "status" and "protection"
      And the table should have 3 data rows

    @acceptance-criteria @validation
    Scenario: Scenarios without Examples tables are not extracted
      Given a feature file with only simple scenarios (no Examples)
      When generating the claude module
      Then the scenarios are not included in output
      And only Rule descriptions and Examples tables appear

  # ============================================================================
  # RULE 4: Claude Module Codec Output Format
  # ============================================================================

  Rule: ClaudeModuleCodec produces compact markdown modules

    **Invariant:** The codec transforms patterns with claude tags into markdown files
    suitable for the `_claude-md/` directory structure.

    **Rationale:** CLAUDE.md modules must be compact and actionable. The codec
    produces ready-to-use markdown without truncation (let modular-claude-md
    handle token budget warnings).

    **Verified by:** Output uses H3 for title, Output uses H4 for rules, Tables are
    preserved, Code blocks in descriptions are preserved, See-also link is included

    @acceptance-criteria @happy-path
    Scenario: Module uses correct heading levels
      Given a pattern with claude-module "process-guard"
      When generating the claude module
      Then the module title should use "###" (H3)
      And rule sections should use "####" (H4)

    @acceptance-criteria @happy-path
    Scenario: Tables from rule descriptions are preserved
      Given a rule with embedded markdown table:
        """
        | From | To | Valid |
        | roadmap | active | Yes |
        | roadmap | complete | No |
        """
      When generating the claude module
      Then the table should appear in output unchanged

    @acceptance-criteria @happy-path
    Scenario: Code blocks in descriptions are preserved
      Given a feature description with code block:
        """
        ```bash
        pnpm lint-process --staged
        ```
        """
      When generating the claude module
      Then the code block should appear in output with language tag

    @acceptance-criteria @happy-path
    Scenario: See-also link to full documentation is included
      Given a pattern with claude-module "process-guard"
      And the fullDocsPath option is "docs/PROCESS-GUARD.md"
      When generating the claude module
      Then the module should end with "**See:** [Full Documentation](docs/PROCESS-GUARD.md)"

  # ============================================================================
  # RULE 5: Generator File Output
  # ============================================================================

  Rule: Claude module generator writes files to correct locations

    **Invariant:** The generator must write module files to `{outputDir}/{section}/{module}.md`
    based on the `claude-section` and `claude-module` tags.

    **Rationale:** Output path structure must match modular-claude-md expectations.
    The `claude-section` determines the subdirectory, `claude-module` determines filename.

    **Verified by:** Output path uses section as directory, Output filename uses module name,
    Multiple modules from single run, Generator respects --overwrite flag

    @acceptance-criteria @happy-path
    Scenario: Output path uses section as directory
      Given a pattern with:
        | Tag | Value |
        | claude-module | process-guard |
        | claude-section | delivery-process |
      And output directory is "_claude-md"
      When the generator runs
      Then file should be written to "_claude-md/delivery-process/process-guard.md"

    @acceptance-criteria @happy-path
    Scenario: Multiple modules generated from single run
      Given patterns with different claude-section values:
        | Pattern | claude-module | claude-section |
        | ProcessGuard | process-guard | delivery-process |
        | FsmValidator | fsm-validator | testing |
        | LayerInference | layer-inference | testing |
      When the generator runs
      Then 3 module files should be created
      And "_claude-md/delivery-process/process-guard.md" should exist
      And "_claude-md/testing/fsm-validator.md" should exist
      And "_claude-md/testing/layer-inference.md" should exist

    @acceptance-criteria @validation
    Scenario: Generator skips patterns without claude-module tag
      Given 5 patterns where only 2 have claude-module tags
      When the generator runs
      Then only 2 module files should be created
      And non-claude patterns should be ignored

    @acceptance-criteria @happy-path
    Scenario: Generator creates section directories if missing
      Given claude-section "new-section" does not exist
      When generating a module with claude-section "new-section"
      Then directory "_claude-md/new-section" should be created
      And the module file should be written inside it

  # ============================================================================
  # RULE 6: Generator Registry Integration
  # ============================================================================

  Rule: Claude module generator is registered with generator registry

    **Invariant:** A "claude-modules" generator must be registered with the generator
    registry to enable `pnpm docs:claude-modules` via the existing CLI.

    **Rationale:** Consistent with architecture-diagram-generation pattern. New
    generators register with the orchestrator rather than creating separate commands.

    **Verified by:** Generator is registered, CLI command works, Generator options supported

    @acceptance-criteria @happy-path
    Scenario: Generator is registered with name "claude-modules"
      Given the generator registry
      When listing available generators
      Then "claude-modules" should be in the list

    @acceptance-criteria @happy-path
    Scenario: CLI command generates modules
      When running:
        """bash
        generate-docs \
          --features 'tests/features/behavior/**/*.feature' \
          --generators claude-modules \
          --output _claude-md
        """
      Then command exits successfully
      And module files are written to _claude-md subdirectories

    @acceptance-criteria @happy-path
    Scenario: Generator supports fullDocsPath option
      When running with option "--full-docs-path docs/"
      Then generated modules include See-also links with that path prefix

  # ============================================================================
  # RULE 7: Progressive Disclosure for Full Docs
  # ============================================================================

  Rule: Same source generates detailed docs with progressive disclosure

    **Invariant:** When running with `detailLevel: "detailed"`, the codec produces
    expanded documentation including all Rule content, code examples, and scenario details.

    **Rationale:** Single source generates both compact modules (AI context) and
    detailed docs (human reference). Progressive disclosure is already a codec capability.

    **Verified by:** Detailed mode includes scenarios, Detailed mode includes code examples,
    Summary mode produces compact output

    @acceptance-criteria @happy-path
    Scenario: Detailed mode includes scenario descriptions
      Given detailLevel is "detailed"
      When generating documentation
      Then individual scenario titles should appear
      And scenario steps should be summarized

    @acceptance-criteria @happy-path
    Scenario: Summary mode produces compact output for modules
      Given detailLevel is "summary"
      When generating the claude module
      Then only Rules and Examples tables should appear
      And individual scenarios should be omitted

    @acceptance-criteria @happy-path
    Scenario: Standard mode is default for module generation
      Given no detailLevel is specified
      When generating the claude module
      Then output should use standard detail level
      And Rules with Invariant/Rationale should appear
      And Examples tables should appear

  # ============================================================================
  # EXAMPLE: Process Guard Module Output
  # ============================================================================

  # The following shows expected output for process-guard.feature:
  #
  # ### Process Guard Linter
  #
  # Pure validation for enforcing delivery process rules per PDR-005.
  #
  # **Problem:**
  # - Completed specs modified without unlock reason
  # - Invalid status transitions bypass FSM rules
  # - Active specs expand scope with new deliverables
  #
  # **Solution:**
  # - `checkProtectionLevel()` → enforces unlock-reason for completed
  # - `checkStatusTransitions()` → validates FSM transitions
  # - `checkScopeCreep()` → prevents deliverable addition to active specs
  #
  # #### Protection Levels
  #
  # | Status | Protection | Restriction |
  # |--------|------------|-------------|
  # | `completed` | hard | Requires unlock-reason |
  # | `active` | scope | No new deliverables |
  # | `roadmap` | none | Fully editable |
  # | `deferred` | none | Fully editable |
  #
  # #### Valid Transitions
  #
  # | From | To | Notes |
  # |------|-----|-------|
  # | `roadmap` | `active`, `deferred` | Start or postpone |
  # | `active` | `completed`, `roadmap` | Finish or regress |
  # | `deferred` | `roadmap` | Resume planning |
  # | `completed` | _(terminal)_ | Use unlock-reason |
  #
  # **See:** [Full Documentation](docs/PROCESS-GUARD.md)
