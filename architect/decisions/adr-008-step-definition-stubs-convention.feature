@architect
@architect-adr:008
@architect-adr-status:accepted
@architect-adr-category:process
@architect-adr-layer:infrastructure
@architect-adr-theme:testing
@architect-pattern:ADR008StepDefinitionStubsConvention
@architect-status:completed
@architect-unlock-reason:Backfill-adr-layer-and-theme-classification-tags
@architect-product-area:Process
@architect-uses:ADR003SourceFirstPatternArchitecture,ADR002GherkinOnlyTesting
Feature: ADR-008 - Step Definition Stubs Live in Architect State Folder

  **Context:**
  Design-level specs define mandatory behaviour test coverage — the scenarios
  that must become executable tests during implementation. Code stubs
  (`architect/stubs/`) solved the analogous problem for implementation code:
  API shapes designed during design sessions live outside `src/` to avoid
  compilation and linting, then move to `src/` during implementation.

  Step definition stubs need the same treatment. Three approaches were
  evaluated:

  - **Gherkin comments in spec files** — Not parsable. Studio cannot track,
    render, or query comment-based stubs. Eliminated because every stage of
    spec refinement must produce machine-parsable artifacts for Studio.
  - **`tests/planning-stubs/`** (new-convex-es pattern) — Places design
    artifacts inside the execution folder (`tests/`). Works but violates the
    separation between architect state (design surface) and package tests
    (execution surface). Requires vitest exclude config.
  - **`architect/step-stubs/`** — Keeps all design session outputs in the
    architect state folder. Already excluded from compilation, linting, and
    test execution. Symmetric with `architect/stubs/` for code. Queryable
    via the extraction pipeline.

  The first option was used organically in new-convex-es before code stubs
  had a proper home. The learning from code stubs — design artifacts must
  live outside compiled/linted/executed paths — applies equally to step
  definition stubs.

  **Decision:**
  Step definition stubs live in `architect/step-stubs/{pattern-name}/` as
  TypeScript files with real vitest-cucumber structure and `throw new Error`
  bodies. They are design session artifacts that move to `tests/steps/` during
  implementation and are deleted from `step-stubs/` when complete.

  The architect state folder is the single location for all design session
  outputs. Its structure is:

  | Folder | Content | Target During Implementation |
  | `specs/` | Behaviour specifications (Gherkin) | Ephemeral — value transfers to code + tests |
  | `stubs/` | Code stubs (TypeScript API shapes) | `src/` |
  | `step-stubs/` | Step definition stubs (TypeScript test skeletons) | `tests/steps/` and `tests/features/` |
  | `decisions/` | Architecture and process decision records | Durable — survives implementation |
  | `releases/` | Release definitions | Durable |
  | `design-reviews/` | Generated and manual design reviews | Ephemeral |

  Folder organization within `step-stubs/` is flexible — by pattern name,
  product area, phase, or bounded context. The constraint is: each step stub
  file must have `@architect-implements` and `@architect-target` annotations
  for traceability and resolution tracking.

  **Consequences:**
  | Type | Impact |
  | Positive | All design session outputs in one location (architect state folder) |
  | Positive | Step stubs are parsable by extraction pipeline — Studio can track resolution |
  | Positive | No vitest/eslint/tsconfig exclusion needed — architect folder is already excluded |
  | Positive | `stubs --unresolved` tracks both code stubs and step stubs uniformly |
  | Positive | Real vitest-cucumber structure prevents Two-Pattern Problem errors during implementation |
  | Positive | Symmetric with code stubs — same lifecycle, same annotations, same resolution tracking |
  | Negative | Migration from new-convex-es `tests/planning-stubs/` convention |
  | Negative | Step stubs reference feature files that may not yet exist (acceptable — code stubs reference src/ files that don't exist either) |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | complete | architect/decisions/adr-008 |

  # ===========================================================================
  # RULE 1: Step Stubs Live in Architect State Folder
  # ===========================================================================

  Rule: Step definition stubs live in architect/step-stubs/

    **Invariant:** Step definition stubs are TypeScript files with
    vitest-cucumber structure (`loadFeature`, `describeFeature`, `Rule`,
    `RuleScenario`) and `throw new Error("Not implemented")` step bodies.
    They live in `architect/step-stubs/{organizational-folder}/` alongside
    specs, code stubs, and decisions. They do NOT live in `tests/` because
    `tests/` is the execution surface — design artifacts belong in the
    architect state folder.

    **Rationale:** Code stubs proved that design artifacts must live outside
    compiled/linted/executed paths. The same principle applies to test
    skeletons. Placing step stubs in `tests/planning-stubs/` requires
    vitest exclusion config and puts design artifacts in the execution
    folder. The architect state folder is already excluded from all build
    tools.

    **Verified by:** Step stubs excluded from test execution,
    Step stubs tracked by extraction pipeline

    @acceptance-criteria @happy-path
    Scenario: Step stubs excluded from test execution
      Given step definition stubs in architect/step-stubs/
      When the test runner executes
      Then step stubs are not included in the test run
      And no vitest exclude configuration is needed for step-stubs

    @acceptance-criteria @happy-path
    Scenario: Step stubs tracked by extraction pipeline
      Given a step stub with @architect-implements and @architect-target
      When the extraction pipeline scans architect/step-stubs/
      Then the stub appears in the stubs --unresolved output
      And the target path points to tests/steps/

  # ===========================================================================
  # RULE 2: Required Annotations
  # ===========================================================================

  Rule: Step stubs require implements and target annotations

    **Invariant:** Every step definition stub file must have:
    - `@architect` gate tag
    - `@architect-implements:{PatternName}` linking to the parent spec
    - `@architect-target:{tests/steps/path}` specifying the implementation destination
    Step stubs must NOT use `@architect-pattern` — the spec file owns
    pattern identity (per ADR-003). The `@architect-target` tag enables
    resolution tracking: `stubs --unresolved` reports step stubs whose
    target files do not yet exist.

    **Rationale:** Without `@architect-implements`, the step stub is an
    orphan with no traceability to its spec. Without `@architect-target`,
    the extraction pipeline cannot track resolution status. These are the
    same annotations required on code stubs — the convention is symmetric.

    **Verified by:** Step stub with required annotations,
    Step stub without target produces extraction diagnostic

    @acceptance-criteria @happy-path
    Scenario: Step stub with required annotations
      Given a step stub in architect/step-stubs/ with implements and target tags
      When the extraction pipeline processes the file
      Then the stub is linked to its parent pattern via implements
      And the target path is available for resolution checking

    @acceptance-criteria @validation
    Scenario: Step stub without target produces extraction diagnostic
      Given a step stub in architect/step-stubs/ with implements but no target tag
      When the extraction pipeline processes the file
      Then an extraction diagnostic is produced suggesting @architect-target

  # ===========================================================================
  # RULE 3: Flexible Organization
  # ===========================================================================

  Rule: Organization within step-stubs is flexible

    **Invariant:** The subdirectory structure within `architect/step-stubs/`
    is not mandated. Acceptable organization patterns include:
    - By pattern name: `step-stubs/{pattern-name}/`
    - By product area: `step-stubs/{product-area}/`
    - By phase or milestone: `step-stubs/phase-{N}/`
    - By bounded context: `step-stubs/{context}/`
    - Flat: `step-stubs/` (for small projects)
    The choice depends on project scale and team preference. The only
    constraint is the per-file annotation requirements (Rule 2).

    **Rationale:** Rigid folder structure creates unnecessary friction.
    new-convex-es organizes specs by product area (`specs/platform/`,
    `specs/example-app/`). The architect package organizes specs flat.
    Both are valid. The annotations provide machine-readable traceability
    regardless of folder structure.

    **Verified by:** Different organization patterns are valid

    @acceptance-criteria @happy-path
    Scenario: Different organization patterns are valid
      Given step stubs organized by pattern name in one project
      And step stubs organized by product area in another project
      When the extraction pipeline scans both projects
      Then both produce valid stub entries with implements and target links
      And folder structure does not affect traceability

  # ===========================================================================
  # RULE 4: Lifecycle — Design to Implementation to Deletion
  # ===========================================================================

  Rule: Step stubs follow the same lifecycle as code stubs

    **Invariant:** Step definition stubs are created during design sessions.
    During implementation, the stub content moves to `tests/steps/` (replacing
    `throw new Error` with real assertions) and the stub's companion feature
    file moves to `tests/features/`. The step stub file is deleted from
    `architect/step-stubs/` when the executable test passes. The
    `stubs --unresolved` command reports step stubs whose target files do not
    yet exist. When the target file exists, the stub is "resolved."

    This is identical to code stubs: design → move to target → delete stub.
    All three tiers of architect state (specs, code stubs, step stubs) are
    ephemeral design artifacts that transform into durable implementation
    artifacts (annotated source, executable tests).

    **Rationale:** Keeping resolved stubs creates maintenance burden and
    divergence risk — the same lesson learned from tier 1 specs (ADR-003
    Rule 2). The stub's value is fully transferred to the executable test.

    **Verified by:** Resolved step stub detected by pipeline,
    Step stub lifecycle matches code stub lifecycle

    @acceptance-criteria @happy-path
    Scenario: Resolved step stub detected by pipeline
      Given a step stub targeting tests/steps/taxonomy/foo.steps.ts
      And the file tests/steps/taxonomy/foo.steps.ts exists
      When stubs --unresolved is queried
      Then the step stub does not appear in the unresolved list

    @acceptance-criteria @validation
    Scenario: Step stub lifecycle matches code stub lifecycle
      Given a code stub in architect/stubs/ with @architect-target src/foo.ts
      And a step stub in architect/step-stubs/ with @architect-target tests/steps/foo.steps.ts
      When both target files are created during implementation
      Then both stubs are resolved
      And both can be deleted from the architect state folder

  # ===========================================================================
  # RULE 5: Step Stub File Structure
  # ===========================================================================

  Rule: Step stubs contain real vitest-cucumber structure

    **Invariant:** A step definition stub is a valid TypeScript file
    containing: JSDoc with architect annotations, test state interface,
    `loadFeature()` call pointing to the companion feature file,
    `describeFeature()` with `Rule()` and `RuleScenario()` blocks matching
    the spec's Rules, and step functions with `throw new Error("Not
    implemented: description")` bodies. The structure must match
    vitest-cucumber conventions: `{string}` and `{int}` for Scenario steps,
    variables object for ScenarioOutline steps, `Rule()` wrapper for
    Rule-scoped scenarios.

    **Rationale:** The architect package uses vitest-cucumber with specific
    structural requirements (the Two-Pattern Problem, Rule keyword pattern).
    A prose description cannot capture these structural constraints. A real
    TypeScript skeleton prevents the most common implementation errors —
    wrong parameter access pattern, missing Rule() wrapper, RegExp instead
    of string patterns — by providing the correct structure upfront.

    **Verified by:** Step stub file compiles conceptually

    @acceptance-criteria @happy-path
    Scenario: Step stub file compiles conceptually
      Given a step stub with loadFeature, describeFeature, Rule, and RuleScenario calls
      And each step body contains throw new Error with a description
      When an implementation agent reads the stub
      Then the vitest-cucumber structure is immediately usable
      And the agent replaces throw statements with real assertions
