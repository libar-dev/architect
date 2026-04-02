@architect
@architect-pattern:CliRecipeCodec
@architect-status:completed
@architect-unlock-reason:Initial-commit-with-all-deliverables-complete
@architect-phase:35
@architect-effort:2w
@architect-product-area:Generation
@architect-depends-on:DocsConsolidationStrategy
@architect-depends-on:CliReferenceGeneration
@architect-business-value:replaces-460-lines-of-manual-CLI-md-prose-with-generated-recipe-and-narrative-content
@architect-priority:medium
Feature: CLI Recipe Codec

  **Problem:**
  `docs/CLI.md` (~509 lines) retains ~460 lines of editorial prose after
  Phase 43 (CliReferenceGeneration) extracted 3 reference tables to
  `docs-live/reference/CLI-REFERENCE.md`. The remaining content includes:
  "Why Use This" motivation (30 lines), Quick Start with example output (32 lines),
  Session Types decision tree (12 lines), Session Workflow Commands with 6 narrative
  command descriptions and output examples (125 lines), Pattern Discovery with 8
  command descriptions (95 lines), Architecture Queries reference (28 lines),
  Metadata and Inventory (39 lines), and Common Recipes with 5 recipe blocks
  (42 lines). This prose is manually maintained and risks drifting from the CLI
  implementation when commands are added, renamed, or removed.

  **Solution:**
  Create a standalone `CliRecipeGenerator` that extends CLI_SCHEMA with recipe
  definitions and narrative metadata, producing `docs-live/reference/CLI-RECIPES.md`.
  The generator is a sibling to `CliReferenceGenerator` -- both are standalone
  (ADR-006 compliant) and consume CLI_SCHEMA directly. Editorial content that cannot
  be derived from schema (motivation prose, session decision tree) uses the preamble
  mechanism. `docs/CLI.md` retains a slim editorial introduction and links
  to both generated files (reference tables + recipes).

  **Why It Matters:**
  | Benefit | How |
  | Zero-drift recipes | Recipe command sequences regenerate from schema when CLI changes |
  | Session decision tree stays current | Session types defined in schema, decision tree generated |
  | Command narratives from schema | Each command group carries description and example output in schema |
  | Hybrid integrity preserved | Editorial "Why Use This" prose lives in preamble, not duplicated |
  | Two generated files complement each other | Reference tables (what flags exist) + recipes (how to use them) |

  **Design Questions (for design session):**
  | Question | Options | Recommendation |
  | How to structure recipe definitions in schema? | (A) Inline in CLIOptionGroup, (B) Separate RecipeGroup[] | (B) Separate -- recipes are multi-command sequences, not per-option |
  | Should command narrative descriptions come from schema? | (A) Extend CLIOptionGroup.description, (B) New CommandNarrative type | (A) Extend -- description field already exists and is rendered |
  | How to handle example CLI output blocks? | (A) Static strings in schema, (B) Live execution at gen time | (A) Static -- deterministic output, no build-time side effects |
  | Where does Quick Start content belong? | (A) Preamble, (B) First recipe group | (A) Preamble -- it is introductory editorial with example output |
  | Should the generator produce claude-md output? | (A) Yes via ReferenceDocConfig, (B) No, standalone only | (B) No -- CLAUDE.md already has Data API CLI section from CLAUDE.md authoring |

  **Design Session Findings (2026-03-06):**
  | Finding | Impact | Resolution |
  | DD-1: Recipes need separate RecipeGroup[] field, not inline per-option | Recipes span multiple option groups (e.g., "Starting a Session" uses overview + scope-validate + context) | Added RecipeGroup[] and CommandNarrativeGroup[] as optional fields on CLISchema -- existing consumers unchanged |
  | DD-2: CLI_SCHEMA extension is additive with two new optional fields | CliReferenceGenerator and showHelp ignore unknown fields | recipes and commandNarratives fields added to CLISchema interface, not a separate extended type |
  | DD-3: Preamble mechanism proven by ReferenceDocConfig and ErrorGuideCodec stubs | Why Use This (30 lines), Quick Start (32 lines), Session Types (12 lines) are editorial judgment | Generator accepts preamble SectionBlock[] via CliRecipeGeneratorConfig, configured in architect.config.ts |
  | DD-4: CommandNarrative type needed, not just CLIOptionGroup.description extension | Session Workflow has 6 commands each needing description + usage example + expected output | New CommandNarrative interface with command, description, usageExample, details, expectedOutput fields |
  | DD-5: Recipes grouped by task intent, not session type or command | Matches existing Common Recipes structure in CLI.md | 5 groups: Starting a Session, Finding Work, Investigating, Design Prep, Ending a Session |
  | Content audit: ~460 lines map to 3 schema locations + preamble | Zero information loss from manual to generated | recipes (42 lines), commandNarratives (287 lines), preamble (74 lines), kept in manual (70 lines) |
  | CliReferenceGenerator is 113 lines and proven stable | Extending it risks regressions on Phase 43 deliverables | CliRecipeGenerator is a separate sibling class, same DocumentGenerator interface |
  | Generator registration follows cli-reference pattern | generatorOverrides already has cli-reference entry | Add cli-recipe entry with same outputDirectory: docs-live |

  **Design Stubs:**
  | Stub | Location | Key Decisions |
  | Recipe schema types | architect/stubs/cli-recipe-codec/recipe-schema.ts | DD-1 RecipeGroup/RecipeExample/RecipeStep, DD-4 CommandNarrative/CommandNarrativeGroup, CLISchema extension |
  | Generator class | architect/stubs/cli-recipe-codec/cli-recipe-generator.ts | DD-1 separate generator, DD-3 preamble config, DD-5 no claude-md output |
  | Recipe data examples | architect/stubs/cli-recipe-codec/recipe-data.ts | DD-2 schema data mapping, DD-4 narrative examples, preamble content examples |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Extend CLI_SCHEMA with recipe definitions per command group | complete | src/cli/cli-schema.ts | Yes | unit |
      | Create CliRecipeGenerator producing CLI-RECIPES.md | complete | src/generators/built-in/cli-recipe-generator.ts | Yes | integration |
      | Register generator in orchestrator config | complete | architect.config.ts | Yes | integration |
      | Preamble content for Why Use This and session decision tree | complete | architect.config.ts | No | n/a |
      | Replace CLI.md prose sections with pointers to generated files | complete | docs/CLI.md | No | n/a |
      | Behavior spec with scenarios for recipe generation | n/a | tests/features/behavior/cli/cli-recipe-generation.feature | Yes | acceptance |

  Rule: CLI recipes are a separate generator from reference tables

    **Invariant:** The `CliRecipeGenerator` is a standalone sibling to
    `CliReferenceGenerator`, not an extension of it. Both implement
    `DocumentGenerator`, both consume `CLI_SCHEMA` directly, and both produce
    independent `OutputFile[]` via the standard orchestrator write path. The recipe
    generator produces `docs-live/reference/CLI-RECIPES.md` while the
    reference generator produces `docs-live/reference/CLI-REFERENCE.md`.

    **Rationale:** Reference tables and recipe guides serve different audiences and
    change at different cadences. Reference tables change when CLI flags are added
    or removed. Recipes change when workflow recommendations evolve. Coupling them
    in one generator would force both to change together and make the generator
    responsible for two distinct content types. CliReferenceGenerator is
    already completed and tested (Phase 43) -- extending it risks regressions. Two
    small standalone generators are easier to test and maintain than one large one.

    **Verified by:** Two separate generator classes exist,
    Each produces its own output file independently

    @acceptance-criteria @happy-path
    Scenario: CliRecipeGenerator produces recipe file independently
      Given the CliRecipeGenerator is registered in the orchestrator
      And the CliReferenceGenerator is also registered
      When docs:all runs
      Then docs-live/reference/CLI-RECIPES.md is created
      And docs-live/reference/CLI-REFERENCE.md is also created
      And neither generator imports nor depends on the other

    @acceptance-criteria @validation
    Scenario: Recipe generator has no PatternGraph dependency
      Given the CliRecipeGenerator source file
      When inspecting its import statements
      Then it does not import PatternGraph or any pipeline module
      And it imports only from src/cli/cli-schema.ts and generator infrastructure

  Rule: Recipe content uses a structured schema extension

    **Invariant:** `CLI_SCHEMA` is extended with a `recipes` field containing
    `RecipeGroup[]`. Each `RecipeGroup` has a title, optional description, and an
    array of `RecipeExample` objects. Each `RecipeExample` has a title, a purpose
    description, an array of RecipeStep entries (each with a command string and optional comment), and an optional expected output block.
    The schema extension is additive -- existing `CLIOptionGroup` types are unchanged.

    **Rationale:** Recipes are multi-command sequences ("run these 3 commands in
    order") with explanatory context. They do not fit into `CLIOptionGroup` which
    models individual flags. A separate `RecipeGroup[]` keeps the schema type-safe
    and makes recipes independently testable. Static expected output strings in the
    schema are deterministic -- no build-time CLI execution needed.

    **Verified by:** Schema type includes RecipeGroup definition,
    Recipe data drives generated output

    @acceptance-criteria @happy-path
    Scenario: CLI schema includes recipe definitions
      Given the CLI_SCHEMA constant in src/cli/cli-schema.ts
      When recipe groups are added for session startup and pattern investigation
      Then each recipe group has a title and at least one recipe example
      And each recipe example includes a title, purpose, and command array
      And the schema TypeScript compiles without errors

    @acceptance-criteria @happy-path
    Scenario: Generated recipe file renders multi-command sequences
      Given a RecipeGroup titled "Starting a Session" with 3 recipe commands
      And each command has a trailing comment explaining its purpose
      When the CliRecipeGenerator renders this group
      Then the output contains a section heading "Starting a Session"
      And a code block with all 3 commands in sequence
      And purpose text appears before the code block

    @acceptance-criteria @validation
    Scenario: Recipe with expected output renders output block
      Given a RecipeExample with an expectedOutput string
      When the CliRecipeGenerator renders this recipe
      Then the output contains the command code block
      And a separate "Example output" code block follows with the expected output text

  Rule: Narrative prose uses preamble mechanism

    **Invariant:** Editorial content that cannot be derived from the CLI schema --
    specifically "Why Use This" motivational prose, the Quick Start example with
    output, and the session type decision tree -- uses a preamble mechanism in the
    generator configuration. Preamble content is manually authored in
    `architect.config.ts` as structured section data and appears before all
    generated recipe content in the output file.

    **Rationale:** The "Why Use This" section explains the value proposition of the
    Data API CLI with a comparison table (CLI vs reading markdown). This is editorial
    judgment, not derivable from command metadata. The Quick Start shows a specific
    3-command workflow with example terminal output. The session decision tree maps
    cognitive states ("Starting to code?") to session types. None of these have a
    source annotation -- they are instructional content authored for human
    understanding. The preamble mechanism exists precisely for this (proven by
    DocsConsolidationStrategy Phase 2 preamble implementation).

    **Verified by:** Preamble sections appear before recipe content,
    Preamble content is not duplicated in schema recipe definitions

    @acceptance-criteria @happy-path
    Scenario: Generated file starts with preamble editorial content
      Given a CliRecipeGenerator with preamble containing Why Use This prose
      And the preamble includes a comparison table and Quick Start example
      When the generator produces CLI-RECIPES.md
      Then the file begins with the Why Use This section
      And the Quick Start section follows with command examples and output
      And generated recipe sections appear after the preamble content

    @acceptance-criteria @validation
    Scenario: Empty preamble produces no extra content
      Given a CliRecipeGenerator with no preamble configured
      When the generator produces the recipe file
      Then the file begins directly with the first recipe group heading
      And no empty sections or separators appear at the top

  Rule: Generated recipe file complements manual CLI.md

    **Invariant:** After this pattern completes, `docs/CLI.md` is trimmed to
    a slim editorial introduction (~30 lines) containing the document title, a
    one-paragraph purpose statement, and links to both generated files:
    `docs-live/reference/CLI-REFERENCE.md` (option tables from Phase 43) and
    `docs-live/reference/CLI-RECIPES.md` (recipes and narratives from this
    pattern). The manual file retains the JSON Envelope, Exit Codes, and JSON Piping
    sections (~40 lines) which are operational reference unlikely to drift.
    All other prose sections are replaced by the generated recipe file.

    **Rationale:** Phase 43 established the hybrid pattern: keep editorial prose in
    the manual file, extract derivable content to generated files. This pattern
    extends the hybrid by recognizing that recipe content IS derivable from a
    structured schema. The ~460 lines of command descriptions, example output,
    and recipe blocks can be maintained as schema data rather than freeform markdown.
    What remains in the manual file (~70 lines total) is true operational reference
    (JSON envelope format, exit codes, piping tips) that changes rarely and has no
    schema source.

    **Verified by:** Manual file links to both generated files,
    Recipe sections no longer duplicated in manual file

    @acceptance-criteria @happy-path
    Scenario: CLI.md links to both generated files
      Given CLI.md has been trimmed after CliRecipeCodec completion
      When reading the manual file
      Then it contains a link to docs-live/reference/CLI-REFERENCE.md
      And it contains a link to docs-live/reference/CLI-RECIPES.md
      And the total line count is under 100 lines

    @acceptance-criteria @validation
    Scenario: No recipe content duplicated between manual and generated files
      Given CLI.md and CLI-RECIPES.md both exist
      When comparing their content
      Then the Common Recipes section does not appear in CLI.md
      And Session Workflow Commands section does not appear in CLI.md
      And Pattern Discovery section does not appear in CLI.md
      And these sections appear in CLI-RECIPES.md

  Rule: Command narrative descriptions are sourced from schema metadata

    **Invariant:** Each command group in the generated recipe file includes a
    narrative description sourced from the CLI schema, not hardcoded in the generator.
    The existing `CLIOptionGroup.description` and `CLIOptionGroup.postNote` fields
    carry per-group narrative text. For command groups not currently in CLI_SCHEMA
    (Session Workflow Commands, Pattern Discovery, Architecture Queries, Metadata
    and Inventory), new `CommandGroup` entries are added to the schema with title,
    description, and per-command narrative metadata.

    **Rationale:** The manual CLI.md contains narrative descriptions for each
    command ("Highest-impact command. Pre-flight readiness check that prevents wasted
    sessions.") that are valuable developer context. Hardcoding these in the generator
    would create a second maintenance location. Placing them in CLI_SCHEMA co-locates
    command metadata (what the command does) with command definition (what flags it
    accepts), following the same single-source-of-truth principle that drove Phase 43.

    **Verified by:** Command narratives render from schema data,
    Generator contains no hardcoded command descriptions

    @acceptance-criteria @happy-path
    Scenario: Command descriptions render from schema metadata
      Given CLI_SCHEMA contains a command group for Session Workflow Commands
      And the overview command has a description "Executive summary: progress, active phases, blocking patterns"
      When the CliRecipeGenerator renders the Session Workflow Commands section
      Then the overview command appears with its schema-sourced description
      And no description text is hardcoded in the generator source

    @acceptance-criteria @happy-path
    Scenario: All six session workflow commands have narrative descriptions
      Given CLI_SCHEMA command groups include all 6 session workflow commands
      When the CliRecipeGenerator renders the session workflow section
      Then overview, scope-validate, context, dep-tree, files, and handoff each have descriptions
      And each description includes a usage example code block
