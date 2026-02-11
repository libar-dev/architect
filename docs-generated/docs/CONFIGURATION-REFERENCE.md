# Configuration Reference

**Purpose:** Reference document: Configuration Reference
**Detail Level:** Full reference

---

## Preset Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Preset Comparison:**

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

| Preset | Tag Prefix | File Opt-In | Categories | Use Case |
| --- | --- | --- | --- | --- |
| libar-generic (default) | libar-docs- | libar-docs | 3 | Simple projects (this package) |
| generic | docs- | docs | 3 | Simple projects with shorter prefix |
| ddd-es-cqrs | libar-docs- | libar-docs | 21 | DDD/Event Sourcing architectures |

---

## Preset Category Behavior

**Context:** Presets define complete category sets that replace base taxonomy.
    Category definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

    **Category Counts by Preset:**

| Preset | Category Count | Example Categories |
| --- | --- | --- |
| libar-generic | 3 | core, api, infra |
| generic | 3 | core, api, infra |
| ddd-es-cqrs | 21 | domain, ddd, bounded-context, event-sourcing, decider, cqrs, saga, projection |

---

## Default Preset Selection

**Context:** All entry points use consistent defaults.
    Default behavior is documented in `createDeliveryProcess` (factory.ts) and `loadConfig` (config-loader.ts).

    **Default Selection by Entry Point:**

**Rationale:** Simple defaults for most users. Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

| Entry Point | Default Preset | Categories | Context |
| --- | --- | --- | --- |
| createDeliveryProcess() | libar-generic | 3 | Programmatic API |
| loadConfig() fallback | libar-generic | 3 | CLI tools (no config file) |
| This package config file | libar-generic | 3 | Standalone package usage |

---

## Libar Generic Preset

**Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **Example Annotation:**

    

    Note: Tag lines above should each be prefixed with the at-symbol.

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 3 (core, api, infra) |

---

## Generic Preset

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **Example Annotation:**

    

    Note: Tag lines above should each be prefixed with the at-symbol.

| Property | Value |
| --- | --- |
| Tag Prefix | docs- |
| File Opt-In | docs |
| Categories | 3 (core, api, infra) |

---

## DDD ES CQRS Preset

**Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **DDD Category List:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 21 |

| Category | Domain | Priority | Description |
| --- | --- | --- | --- |
| domain | Domain | 1 | Domain layer patterns |
| ddd | DDD | 2 | Domain-Driven Design core |
| bounded-context | Bounded Context | 3 | Context boundaries |
| event-sourcing | Event Sourcing | 4 | Event sourcing patterns |
| decider | Decider | 5 | Decision functions |
| cqrs | CQRS | 6 | Command/Query separation |
| saga | Saga | 7 | Process orchestration |
| projection | Projection | 8 | Read model projections |
| aggregate | Aggregate | 9 | Aggregate roots |
| entity | Entity | 10 | Domain entities |
| value-object | Value Object | 11 | Immutable values |
| repository | Repository | 12 | Data access |
| factory | Factory | 13 | Object creation |
| service | Service | 14 | Domain services |
| event | Event | 15 | Domain events |
| command | Command | 16 | Command objects |
| query | Query | 17 | Query objects |
| integration | Integration | 18 | External integrations |
| infrastructure | Infrastructure | 19 | Infrastructure layer |
| application | Application | 20 | Application layer |
| presentation | Presentation | 21 | Presentation layer |

---

## Hierarchical Configuration

**Context:** CLI tools discover config files automatically via directory traversal.
    Discovery logic extracted from `findConfigFile` and `loadConfig` in `src/config/config-loader.ts`.

    **Discovery Order:**

    **Monorepo Strategy:**

    CLI tools use the nearest config file to the working directory.

| Step | Location | Action |
| --- | --- | --- |
| 1 | Current directory | Look for delivery-process.config.ts |
| 2 | Parent directories | Walk up to repo root (find .git folder) |
| 3 | Fallback | Use libar-generic preset (3 categories) |

| Location | Config File | Typical Preset | Use Case |
| --- | --- | --- | --- |
| Repo root | delivery-process.config.ts | ddd-es-cqrs | Full DDD taxonomy for platform |
| packages/my-package/ | delivery-process.config.ts | generic | Simpler taxonomy for individual package |
| packages/simple/ | (none) | libar-generic (fallback) | Uses root or default |

---

## Config File Format

**Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

    

    CLI tools use the nearest config file to the working directory.

---

## Custom Configuration

**Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Configuration Options:**

    **Custom Tag Prefix Example:**

    

    **Custom Categories Example:**

| Option | Type | Description |
| --- | --- | --- |
| preset | string | Base preset to use (libar-generic, generic, ddd-es-cqrs) |
| tagPrefix | string | Custom tag prefix (replaces preset default) |
| fileOptInTag | string | Custom file opt-in marker |
| categories | array | Custom category definitions (replaces preset categories) |

---

## RegexBuilders API

**Context:** DeliveryProcessInstance includes utilities for tag detection.
    API methods extracted from `createRegexBuilders` in `src/config/regex-builders.ts`.

    **RegexBuilders Methods:**

    **Usage Example:**

| Method | Return Type | Description |
| --- | --- | --- |
| hasFileOptIn(content) | boolean | Check if file contains opt-in marker |
| hasDocDirectives(content) | boolean | Check for any documentation directives |
| normalizeTag(tag) | string | Normalize tag for lookup (strip prefix) |
| directivePattern | RegExp | Pattern to match documentation directives |

---

## Programmatic Config Loading

**Context:** Tools that need to load configuration files dynamically.

    **loadConfig Return Value:**

    **Usage Example:**

| Field | Type | Description |
| --- | --- | --- |
| instance | DeliveryProcessInstance | The loaded configuration instance |
| isDefault | boolean | True if no config file was found |
| path | string or undefined | Path to config file (if found) |

---

## Common Configuration Patterns

**Context:** Frequently used configuration patterns.

    **Pattern Selection Guide:**

    **Tag Registry Access:**

| Scenario | Recommended Config | Reason |
| --- | --- | --- |
| Simple library | libar-generic (default) | Minimal categories sufficient |
| DDD microservice | ddd-es-cqrs | Full domain modeling taxonomy |
| Multi-team monorepo | Root: ddd-es-cqrs, packages: vary | Shared taxonomy with package overrides |
| Custom domain vocabulary | Custom categories | Domain-specific terms |
| Shorter annotations | generic preset | Uses docs- prefix vs libar-docs- |

| Access Pattern | Description |
| --- | --- |
| instance.registry.categories | Array of category definitions |
| instance.registry.statusValues | Valid status values (roadmap, active, completed, deferred) |
| instance.registry.metadataTags | Metadata tag definitions |

---

## Related Documentation - Configuration

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## Concept

**Context:** A taxonomy is a classification system for organizing knowledge.

    **Definition:** In delivery-process, the taxonomy defines the vocabulary for
    pattern annotations. It determines what tags exist, their valid values, and
    how they are parsed from source code.

    **Components:**

    **Key Principle:** The taxonomy is NOT a fixed schema. Presets select
    different subsets, and you can define custom categories.

| Component | Purpose | Source File |
| --- | --- | --- |
| Categories | Domain classifications (e.g., core, api, ddd) | categories.ts |
| Status Values | FSM states (roadmap, active, completed, deferred) | status-values.ts |
| Format Types | How tag values are parsed (flag, csv, enum) | format-types.ts |
| Hierarchy Levels | Work item levels (epic, phase, task) | hierarchy-levels.ts |
| Risk Levels | Risk assessment (low, medium, high) | risk-levels.ts |
| Layer Types | Feature layer (timeline, domain, integration) | layer-types.ts |

---

## Complete Category Reference

**Context:** The ddd-es-cqrs preset includes all 21 categories. Simpler
    presets use subsets (core, api, generator for libar-generic).

    **All Categories:**

    **Category Selection Guide:**

    **Usage:** Add category tags to patterns using the tag prefix:

| Tag | Domain | Priority | Description | Aliases |
| --- | --- | --- | --- | --- |
| domain | Strategic DDD | 1 | Bounded contexts, aggregates, strategic design | - |
| ddd | Domain-Driven Design | 2 | DDD tactical patterns | - |
| bounded-context | Bounded Context | 3 | BC contracts and definitions | - |
| event-sourcing | Event Sourcing | 4 | Event store, aggregates, replay | es |
| decider | Decider | 5 | Decider pattern | - |
| fsm | FSM | 5 | Finite state machine patterns | - |
| cqrs | CQRS | 5 | Command/query separation | - |
| projection | Projection | 6 | Read models, checkpoints | - |
| saga | Saga | 7 | Cross-context coordination, process managers | process-manager |
| command | Command | 8 | Command handlers, orchestration | - |
| arch | Architecture | 9 | Architecture patterns, decisions | - |
| infra | Infrastructure | 10 | Infrastructure, composition root | infrastructure |
| validation | Validation | 11 | Input validation, schemas | - |
| testing | Testing | 12 | Test patterns, BDD | - |
| performance | Performance | 13 | Optimization, caching | - |
| security | Security | 14 | Auth, authorization | - |
| core | Core | 15 | Core utilities | - |
| api | API | 16 | Public APIs | - |
| generator | Generator | 17 | Code generators | - |
| middleware | Middleware | 18 | Middleware patterns | - |
| correlation | Correlation | 19 | Correlation tracking | - |

| Project Type | Recommended Preset | Categories Available |
| --- | --- | --- |
| Simple utility packages | libar-generic | core, api, generator |
| DDD/Event Sourcing systems | ddd-es-cqrs | All 21 categories |
| Generic projects | generic | core, api, generator |

---

## Format Types

**Context:** Tags have different value formats that determine parsing.

    **Decision:** Six format types are supported. See `src/taxonomy/format-types.ts`
    for the canonical `FORMAT_TYPES` array with inline documentation.

    **Format Types Reference:**

    **Implementation:** The format type is specified in the tag definition
    within the TagRegistry. The extractor uses the format to parse values.

| Format | Example Tag | Example Value | Parsing Behavior |
| --- | --- | --- | --- |
| flag | @libar-docs-core | (none) | Boolean presence, no value needed |
| value | @libar-docs-pattern | MyPattern | Simple string value |
| enum | @libar-docs-status | completed | Constrained to predefined list |
| csv | @libar-docs-uses | A, B, C | Comma-separated values |
| number | @libar-docs-phase | 15 | Numeric value |
| quoted-value | @libar-docs-brief | 'Multi-word-text' | Preserves quoted values (use hyphens in .feature tags) |

---

## Status Values

**Context:** Status values control the FSM workflow for pattern lifecycle.

    **Decision:** Four canonical status values are defined (per PDR-005).
    See `src/taxonomy/status-values.ts` for the `PROCESS_STATUS_VALUES` array
    with inline documentation on FSM transitions and protection levels.

    **Status Values Reference:**

    **Valid FSM Transitions:**

    **FSM Diagram:**

| Status | Protection Level | Description | Editable |
| --- | --- | --- | --- |
| roadmap | None | Planned work, not yet started | Full editing |
| active | Scope-locked | Work in progress | Edit existing only |
| completed | Hard-locked | Work finished | Requires unlock tag |
| deferred | None | On hold, may resume later | Full editing |

| From | To | Trigger |
| --- | --- | --- |
| roadmap | active | Start work |
| roadmap | deferred | Postpone before start |
| active | completed | Finish work |
| active | roadmap | Regress (blocked) |
| deferred | roadmap | Resume planning |

---

## Normalized Status

**Context:** Display requires mapping 4 FSM states to 3 presentation buckets.

    **Decision:** Raw status values normalize to display status.
    See `src/taxonomy/normalized-status.ts` for the `STATUS_NORMALIZATION_MAP`
    and `normalizeStatus()` function with complete mapping logic.

**Rationale:** This separation follows DDD principles - the domain model (raw FSM states) is distinct from the view model (normalized display).

---

## Presets

**Context:** Different projects need different taxonomy subsets.

    **Decision:** Three presets are available:

    **Behavior:** The preset determines which categories are available.
    All presets share the same status values and format types.

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | @libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | @libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | @docs- | Simple projects with @docs- prefix |

---

## Hierarchy Levels

**Context:** Work items need hierarchical breakdown for planning.

    **Decision:** Three hierarchy levels are defined (epic, phase, task).
    See `src/taxonomy/hierarchy-levels.ts` for the `HIERARCHY_LEVELS` array
    with JSDoc documentation on duration guidelines and usage.

    **Usage:** The level tag organizes work for roadmap generation.
    Phases can have a parent epic; tasks can have a parent phase.

---

## Architecture

**Context:** The taxonomy module structure supports the type-safe annotation system.

    **File Structure:**

    

    **TagRegistry:** The buildRegistry() function creates a TagRegistry
    containing all taxonomy definitions. It is THE single source of truth.

    **Usage Example:**

---

## Tag Generation

**Context:** Developers need a reference of all available tags.

    **Decision:** The generate-tag-taxonomy CLI creates a markdown reference:

    

    **Output:** A markdown file documenting all tags with their formats,
    valid values, and examples - generated from the TagRegistry.

---

## Related Documentation - Taxonomy

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| CONFIGURATION-REFERENCE.md | Reference | Preset configuration and factory API |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## DD-1 - Text output with section markers per ADR-008

Both scope-validate and handoff return string from the router, using
    === SECTION === markers. This follows the dual output path established
    by ADR-008. Both commands are AI-consumption focused — JSON wrapping
    adds overhead without benefit.

---

## DD-2 - Git integration is opt-in via --git flag

The handoff command accepts an optional --git flag. When present, the
    CLI handler calls git diff and passes the file list to the pure
    generator function. The generator receives modifiedFiles as an optional
    readonly string array — no shell dependency in the domain logic.

**Rationale:** Pure functions are testable without mocking child_process. The git call stays in the CLI handler (I/O boundary), not the generator.

---

## DD-3 - Session type inferred from FSM status

The handoff command infers session type from the pattern's current
    FSM status. An explicit --session flag overrides inference.

| Status | Inferred Session |
| --- | --- |
| active | implement |
| completed | review |
| deferred | design |

---

## DD-4 - Severity levels match Process Guard model

Scope validation uses three severity levels. BLOCKED prevents session
    start. WARN indicates suboptimal readiness but does not block.

    The --strict flag (consistent with lint-process) promotes WARN to BLOCKED.

| Severity | Meaning | Example |
| --- | --- | --- |
| BLOCKED | Hard prerequisite missing | Dependency not completed |
| WARN | Recommendation not met | No PDR references found |

---

## DD-5 - Current date only for handoff

The handoff command always uses the current date. No --date flag.
    Handoff is run at session end; backdating is a rare edge case not
    worth the API surface area.

---

## DD-6 - Both positional and flag forms for scope type

scope-validate accepts the scope type as either a positional argument
    or a --type flag: both "scope-validate MyPattern implement" and
    "scope-validate MyPattern --type implement" work.

    This matches how dep-tree accepts --depth as both positional and flag.

---

## DD-7 - Co-located formatter functions

Each new module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Unlike the
    context-assembler/context-formatter split (justified by ContextBundle
    complexity), these commands are simpler and benefit from co-location.

**Rationale:** Avoids file proliferation. The formatter for scope validation is ~30 lines; separating it into its own file adds overhead without benefit. If complexity grows, the split can happen later.

---

## Session Decision Tree

**Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

    

    **Decision:** Session types map to inputs, outputs, and FSM changes:

| Session | Input | Output | FSM Change |
| --- | --- | --- | --- |
| Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
| Design | Complex requirement | Decision specs + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

---

## Planning Session

**Goal:** Create a roadmap spec. Do NOT write implementation code.

    **Checklist:**

    1. Extract metadata from pattern brief
       - Phase number to at-prefix-phase
       - Dependencies to at-prefix-depends-on
       - Status to at-prefix-status:roadmap (always roadmap)

    2. Create spec file at specs/product-area/pattern.feature

    3. Structure the feature with at-prefix tags

    4. Add deliverables table in Background section

    5. Convert tables to Rule blocks (each business constraint becomes a Rule)

    6. Add scenarios per Rule (minimum: 1 happy-path + 1 validation)

    7. Set executable specs location with at-prefix-executable-specs tag

    **Do NOT:**

| Forbidden Action | Rationale |
| --- | --- |
| Create .ts implementation files | Planning only creates specs |
| Transition to active | Active requires implementation readiness |
| Ask Ready to implement? | Planning session ends at roadmap spec |
| Write full implementations | Stubs only if Planning + Design |

---

## Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

    **Checklist:**

    1. Record architectural decisions as PDR .feature files in delivery-process/decisions/

    2. Document options (at least 2-3 approaches with pros/cons in Rule blocks)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs in delivery-process/stubs/{pattern-name}/ with at-prefix-implements and Target: annotations

    **Code Stub Pattern:**

    

    **Do NOT:**

| Use Design Session | Skip Design Session |
| --- | --- |
| Multiple valid approaches | Single obvious path |
| New patterns/capabilities | Bug fix |
| Cross-context coordination | Clear requirements |

| Forbidden Action | Rationale |
| --- | --- |
| Create markdown design documents | Decision specs provide better traceability with structured tags |
| Create implementation plans | Design focuses on architecture |
| Transition spec to active | Requires implementation session |
| Write full implementations | Stubs only |

---

## Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

    **Execution Checklist (CRITICAL - Order Matters):**

    1. Transition to active FIRST (before any code)
       - Change at-prefix-status:roadmap to at-prefix-status:active
       - Protection: active = scope-locked (no new deliverables)

    2. Create executable spec stubs (if at-prefix-executable-specs present)
       - Use at-prefix-implements:PatternName tag

    3. For each deliverable:
       - Read acceptance criteria from spec
       - Implement code (replace throw new Error)
       - Preserve at-prefix-* annotations in JSDoc
       - Write tests
       - Update deliverable status to completed

    4. Transition to completed (only when ALL done)
       - Change at-prefix-status:active to at-prefix-status:completed
       - Protection: completed = hard-locked (requires at-prefix-unlock-reason)

    5. Regenerate docs with: pnpm docs:all

    **Do NOT:**

| Requirement | Why |
| --- | --- |
| Roadmap spec exists with at-prefix-status:roadmap | Cannot implement without spec |
| Decision specs approved (if needed) | Complex decisions need approval |
| Implementation plan exists (for multi-session work) | Prevents scope drift |

| Forbidden Action | Rationale |
| --- | --- |
| Add new deliverables to active spec | Scope-locked state prevents this |
| Mark completed with incomplete work | Hard-locked state cannot be undone |
| Skip FSM transitions | Process Guard will reject |
| Edit generated docs directly | Regenerate from source |

---

## Planning + Design Session

**Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

    **When to Use:**

    **Checklist:**

    1. Complete Planning checklist (see Planning Session rule)

    2. Add at-prefix-executable-specs tag pointing to Tier 2 location

    3. Create code stubs (see Design Session code stub pattern)

    4. Create Tier 2 directory: package/tests/features/behavior/pattern-name/

    5. Create Tier 2 feature stubs with at-prefix-implements:PatternName

    6. Create step definitions stub at tests/planning-stubs/pattern.steps.ts

    **Handoff Complete When:**

    Tier 1:
    - All at-prefix-* tags present
    - at-prefix-executable-specs points to Tier 2
    - Deliverables table complete
    - Status is roadmap

    Tier 2:
    - Directory created with .feature files
    - Each file has at-prefix-implements
    - Step definitions stub compiles

    Validation:
    - pnpm lint passes
    - pnpm typecheck passes

| Use Planning + Design | Use Planning Only |
| --- | --- |
| Need stubs for implementation | Only enhancing spec |
| Preparing for immediate handoff | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet |

---

## FSM Protection

**Context:** The FSM (Finite State Machine) protects work integrity through state-based restrictions.

    **Decision:** Protection levels and valid transitions are defined in TypeScript source:
    - Protection levels: See `PROTECTION_LEVELS` in `src/validation/fsm/states.ts`
    - Valid transitions: See `VALID_TRANSITIONS` in `src/validation/fsm/transitions.ts`

    **Protection Levels:**

    **Valid FSM Transitions:**

    **Invalid Transitions (will fail validation):**

| State | Protection | Can Add Deliverables | Needs Unlock | Allowed Actions | Blocked Actions |
| --- | --- | --- | --- | --- | --- |
| roadmap | None | Yes | No | Full editing, add deliverables | None |
| deferred | None | Yes | No | Full editing, add deliverables | None |
| active | Scope-locked | No | No | Edit existing deliverables | Adding new deliverables |
| completed | Hard-locked | No | Yes | Nothing | Any change without unlock tag |

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| roadmap | active | Start work | Locks scope |
| roadmap | deferred | Postpone | For deprioritized work |
| active | completed | Finish | Terminal state |
| active | roadmap | Regress | For blocked work |
| deferred | roadmap | Resume | To restart planning |

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

---

## FSM Error Messages and Fixes

**Context:** Process Guard validates FSM rules and provides specific error messages with fixes.

    **Error Reference:**

| Error | Cause | Fix |
| --- | --- | --- |
| completed-protection | File has completed status but no unlock tag | Add unlock-reason tag with hyphenated reason |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep | Added deliverable to active spec | Remove deliverable OR revert to roadmap |
| session-scope (warning) | Modified file outside session scope | Add to scope OR use --ignore-session |
| session-excluded | Modified excluded pattern during session | Remove from exclusion OR override |
| deliverable-removed (warning) | Deliverable was removed from spec | Informational only, verify intentional |

---

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Available Escape Hatches:**

    **Unlock Reason Constraints:**

    - Values cannot contain spaces (use hyphens)
    - Must describe why modification is needed
    - Is committed with the change for audit trail

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |
| Emergency hotfix | Combine unlock + ignore | @libar-docs-unlock-reason:'Hotfix' plus --ignore-session |

---

## Handoff Documentation

**Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

    

    **Required Elements:**

| Element | Purpose |
| --- | --- |
| Last completed | What finished this session |
| In progress | What is partially done |
| Blockers | What prevents progress |
| Files Modified | Track changes for review |
| Next Session | Clear starting point |

---

## Discovery Tags

**Context:** Learnings discovered during sessions should be captured inline.

    **Decision:** Three discovery tag types are available:

    **Usage:** Add discovery tags as comments in feature files or code:

    

    **Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

| Tag | Purpose | Example |
| --- | --- | --- |
| at-prefix-discovered-gap | Missing edge case or feature | Missing-validation-for-empty-input |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results |
| at-prefix-discovered-learning | Knowledge gained | Gherkin-requires-strict-indentation |

---

## Common Mistakes

**Context:** Developers frequently make these mistakes when following session workflows.

    **Planning Session Mistakes:**

    **Implementation Session Mistakes:**

    **Design Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating .ts implementation files | Planning only creates specs | Create spec file only, no code |
| Transitioning to active | Active requires implementation readiness | Keep status as roadmap |
| Asking Ready to implement? | Planning session ends at roadmap spec | End session after spec complete |
| Writing full implementations | Stubs only if Planning + Design | Save implementation for Implementation session |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Writing code before transition | FSM must be active first | Change status to active FIRST |
| Adding deliverables to active spec | Scope-locked state prevents this | Revert to roadmap to add scope |
| Marking completed with incomplete work | Hard-locked state cannot be undone | Finish ALL deliverables first |
| Skipping FSM transitions | Process Guard will reject | Follow roadmap to active to completed |
| Editing generated docs directly | Will be overwritten | Regenerate from source |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating markdown design documents | Decision specs provide better traceability | Record decisions as PDR .feature files in delivery-process/decisions/ |
| Creating implementation plans | Design focuses on architecture | Document options and decisions only |
| Transitioning spec to active | Requires implementation session | Keep status as roadmap |
| Writing full implementations | Design creates stubs only | Use throw new Error pattern |

---

## Related Documentation - Session Guides

**Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| METHODOLOGY.md | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md | DataTables, DocStrings, Rule blocks |
| CONFIGURATION.md | Tag prefixes, presets |
| INSTRUCTIONS.md | CLI commands, full tag reference |
| PROCESS-GUARD-REFERENCE.md | FSM validation rules and CLI usage |
| VALIDATION-REFERENCE.md | DoD validation and anti-pattern detection |

---

## Text commands return string from router

---

## SubcommandContext replaces narrow router parameters

---

## QueryResult envelope is a CLI presentation concern

---

## ProcessStateAPI returns remain unchanged

---

## API Types

### DeliveryProcessConfig (interface)

/**
 * Configuration for creating a delivery process instance.
 * Uses generics to preserve literal types from presets.
 */

```typescript
interface DeliveryProcessConfig {
  /** Tag prefix for directives (e.g., "@docs-" or "@libar-docs-") */
  readonly tagPrefix: string;
  /** File-level opt-in tag (e.g., "@docs" or "@libar-docs") */
  readonly fileOptInTag: string;
  /** Category definitions for pattern classification */
  readonly categories: readonly CategoryDefinition[];
  /** Optional metadata tag definitions */
  readonly metadataTags?: readonly MetadataTagDefinitionForRegistry[];
  /**
   * Optional context inference rules for auto-inferring bounded context from file paths.
   *
   * When provided, these rules are merged with the default rules. User-provided rules
   * take precedence over defaults (applied first in the rule list).
   *
   * @example
   * ```typescript
   * contextInferenceRules: [
   *   { pattern: 'packages/orders/**', context: 'orders' },
   *   { pattern: 'packages/inventory/**', context: 'inventory' },
   * ]
   * ```
   */
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
}
```

| Property | Description |
| --- | --- |
| tagPrefix | Tag prefix for directives (e.g., "@docs-" or "@libar-docs-") |
| fileOptInTag | File-level opt-in tag (e.g., "@docs" or "@libar-docs") |
| categories | Category definitions for pattern classification |
| metadataTags | Optional metadata tag definitions |
| contextInferenceRules | Optional context inference rules for auto-inferring bounded context from file paths. |

### DeliveryProcessInstance (interface)

/**
 * Instance returned by createDeliveryProcess with configured registry
 */

```typescript
interface DeliveryProcessInstance {
  /** The fully configured tag registry */
  readonly registry: TagRegistry;
  /** Regex builders for tag detection */
  readonly regexBuilders: RegexBuilders;
}
```

| Property | Description |
| --- | --- |
| registry | The fully configured tag registry |
| regexBuilders | Regex builders for tag detection |

### RegexBuilders (interface)

/**
 * Regex builders for tag detection
 *
 * Provides type-safe regex operations for detecting and normalizing tags
 * based on the configured tag prefix.
 */

```typescript
interface RegexBuilders {
  /** Pattern to match file-level opt-in (e.g., /** @docs *\/) */
  readonly fileOptInPattern: RegExp;
  /** Pattern to match directives (e.g., @docs-pattern, @docs-status) */
  readonly directivePattern: RegExp;
  /** Check if content has the file-level opt-in marker */
  hasFileOptIn(content: string): boolean;
  /** Check if content has any doc directives */
  hasDocDirectives(content: string): boolean;
  /** Normalize a tag by removing @ and prefix (e.g., "@docs-pattern" -> "pattern") */
  normalizeTag(tag: string): string;
}
```

| Property | Description |
| --- | --- |
| fileOptInPattern | Pattern to match file-level opt-in (e.g., /** @docs *\/) |
| directivePattern | Pattern to match directives (e.g., @docs-pattern, @docs-status) |

### createRegexBuilders (function)

/**
 * Creates type-safe regex builders for a given tag prefix configuration.
 * These are used throughout the scanner and validation pipeline.
 *
 * @param tagPrefix - The tag prefix (e.g., "@docs-" or "@libar-docs-")
 * @param fileOptInTag - The file opt-in tag (e.g., "@docs" or "@libar-docs")
 * @returns RegexBuilders instance with pattern matching methods
 *
 * @example
 * ```typescript
 * const builders = createRegexBuilders("@docs-", "@docs");
 *
 * // Check for file opt-in
 * if (builders.hasFileOptIn(sourceCode)) {
 *   console.log("File has @docs marker");
 * }
 *
 * // Normalize a tag
 * const normalized = builders.normalizeTag("@docs-pattern");
 * // Returns: "pattern"
 * ```
 */

```typescript
function createRegexBuilders(tagPrefix: string, fileOptInTag: string): RegexBuilders;
```

### GENERIC_PRESET (const)

/**
 * Generic preset for non-DDD projects.
 *
 * Minimal categories with @docs- prefix. Suitable for:
 * - Simple documentation needs
 * - Non-DDD architectures
 * - Projects that want basic pattern tracking
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess, GENERIC_PRESET } from '@libar-dev/delivery-process';
 *
 * const dp = createDeliveryProcess({ preset: "generic" });
 * // Uses @docs-, @docs-pattern, @docs-status, etc.
 * ```
 */

```typescript
GENERIC_PRESET = {
  tagPrefix: '@docs-',
  fileOptInTag: '@docs',
  categories: [
    {
      tag: 'core',
      domain: 'Core',
      priority: 1,
      description: 'Core patterns',
      aliases: [],
    },
    {
      tag: 'api',
      domain: 'API',
      priority: 2,
      description: 'Public APIs',
      aliases: [],
    },
    {
      tag: 'infra',
      domain: 'Infrastructure',
      priority: 3,
      description: 'Infrastructure',
      aliases: ['infrastructure'],
    },
  ] as const satisfies readonly CategoryDefinition[],
} as const satisfies DeliveryProcessConfig
```

### LIBAR_GENERIC_PRESET (const)

/**
 * Generic preset with @libar-docs- prefix.
 *
 * Same minimal categories as GENERIC_PRESET but with @libar-docs- prefix.
 * This is the universal default preset for both `createDeliveryProcess()` and
 * `loadConfig()` fallback.
 *
 * Suitable for:
 * - Most projects (default choice)
 * - Projects already using @libar-docs- tags
 * - Package-level configuration (simplified categories, same prefix)
 * - Gradual adoption without tag migration
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess } from '@libar-dev/delivery-process';
 *
 * // Default preset (libar-generic):
 * const dp = createDeliveryProcess();
 * // Uses @libar-docs-, @libar-docs-pattern, @libar-docs-status, etc.
 * // With 3 category tags: @libar-docs-core, @libar-docs-api, @libar-docs-infra
 * ```
 */

```typescript
LIBAR_GENERIC_PRESET = {
  tagPrefix: DEFAULT_TAG_PREFIX,
  fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  categories: [
    {
      tag: 'core',
      domain: 'Core',
      priority: 1,
      description: 'Core patterns',
      aliases: [],
    },
    {
      tag: 'api',
      domain: 'API',
      priority: 2,
      description: 'Public APIs',
      aliases: [],
    },
    {
      tag: 'infra',
      domain: 'Infrastructure',
      priority: 3,
      description: 'Infrastructure',
      aliases: ['infrastructure'],
    },
  ] as const satisfies readonly CategoryDefinition[],
} as const satisfies DeliveryProcessConfig
```

### DDD_ES_CQRS_PRESET (const)

/**
 * Full DDD/ES/CQRS preset (current @libar-dev taxonomy).
 *
 * Complete 21-category taxonomy with @libar-docs- prefix. Suitable for:
 * - DDD architectures
 * - Event sourcing projects
 * - CQRS implementations
 * - Full roadmap/phase tracking
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess, DDD_ES_CQRS_PRESET } from '@libar-dev/delivery-process';
 *
 * const dp = createDeliveryProcess({ preset: "ddd-es-cqrs" });
 * ```
 */

```typescript
DDD_ES_CQRS_PRESET = {
  tagPrefix: DEFAULT_TAG_PREFIX,
  fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  categories: CATEGORIES,
  metadataTags: buildRegistry().metadataTags,
} as const satisfies DeliveryProcessConfig
```

### PresetName (type)

/**
 * Available preset names
 */

```typescript
type PresetName = 'generic' | 'libar-generic' | 'ddd-es-cqrs';
```

### PRESETS (const)

/**
 * Preset lookup map
 *
 * @example
 * ```typescript
 * import { PRESETS, type PresetName } from '@libar-dev/delivery-process';
 *
 * function getPreset(name: PresetName) {
 *   return PRESETS[name];
 * }
 * ```
 */

```typescript
const PRESETS: Record<PresetName, DeliveryProcessConfig>;
```

### CreateDeliveryProcessOptions (interface)

/**
 * Options for creating a delivery process instance
 */

```typescript
interface CreateDeliveryProcessOptions {
  /** Use a preset configuration */
  preset?: PresetName;
  /** Custom tag prefix (overrides preset) */
  tagPrefix?: string;
  /** Custom file opt-in tag (overrides preset) */
  fileOptInTag?: string;
  /** Custom categories (replaces preset categories entirely) */
  categories?: DeliveryProcessConfig['categories'];
}
```

| Property | Description |
| --- | --- |
| preset | Use a preset configuration |
| tagPrefix | Custom tag prefix (overrides preset) |
| fileOptInTag | Custom file opt-in tag (overrides preset) |
| categories | Custom categories (replaces preset categories entirely) |

### createDeliveryProcess (function)

/**
 * Creates a configured delivery process instance.
 *
 * Configuration resolution order:
 * 1. Start with preset (or libar-generic default)
 * 2. Preset categories REPLACE base taxonomy categories (not merged)
 * 3. Apply explicit overrides (tagPrefix, fileOptInTag, categories)
 * 4. Create regex builders from final configuration
 *
 * Note: Presets define complete category sets. The libar-generic preset
 * has 3 categories (core, api, infra), while ddd-es-cqrs has 21.
 * Categories from the preset replace base categories entirely.
 *
 * @param options - Configuration options
 * @returns Configured delivery process instance
 *
 * @example
 * ```typescript
 * // Use generic preset
 * const dp = createDeliveryProcess({ preset: "generic" });
 * ```
 *
 * @example
 * ```typescript
 * // Custom prefix with DDD taxonomy
 * const dp = createDeliveryProcess({
 *   preset: "ddd-es-cqrs",
 *   tagPrefix: "@my-project-",
 *   fileOptInTag: "@my-project"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Default (libar-generic preset with 3 categories)
 * const dp = createDeliveryProcess();
 * ```
 */

```typescript
function createDeliveryProcess(
  options: CreateDeliveryProcessOptions =;
```

### ConfigDiscoveryResult (interface)

/**
 * Result of config file discovery
 */

```typescript
interface ConfigDiscoveryResult {
  /** Whether a config file was found */
  found: boolean;
  /** Absolute path to the config file (if found) */
  path?: string;
  /** The loaded configuration instance */
  instance: DeliveryProcessInstance;
  /** Whether the default configuration was used */
  isDefault: boolean;
}
```

| Property | Description |
| --- | --- |
| found | Whether a config file was found |
| path | Absolute path to the config file (if found) |
| instance | The loaded configuration instance |
| isDefault | Whether the default configuration was used |

### ConfigLoadError (interface)

/**
 * Error during config loading
 */

```typescript
interface ConfigLoadError {
  /** Discriminant for error type identification */
  type: 'config-load-error';
  /** Absolute path to the config file that failed to load */
  path: string;
  /** Human-readable error description */
  message: string;
  /** The underlying error that caused the failure (if any) */
  cause?: Error | undefined;
}
```

| Property | Description |
| --- | --- |
| type | Discriminant for error type identification |
| path | Absolute path to the config file that failed to load |
| message | Human-readable error description |
| cause | The underlying error that caused the failure (if any) |

### ConfigLoadResult (type)

/**
 * Result type for config loading (discriminated union)
 */

```typescript
type ConfigLoadResult =
  | {
      /** Indicates successful config resolution */
      ok: true;
      /** The discovery result containing configuration instance */
      value: ConfigDiscoveryResult;
    }
  | {
      /** Indicates config loading failure */
      ok: false;
      /** Error details for the failed load */
      error: ConfigLoadError;
    };
```

### findConfigFile (function)

/**
 * Find config file by walking up from startDir
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */

```typescript
async function findConfigFile(startDir: string): Promise<string | null>;
```

### loadConfig (function)

/**
 * Load configuration from file or use defaults
 *
 * Discovery strategy:
 * 1. Search for `delivery-process.config.ts` starting from baseDir
 * 2. Walk up parent directories until repo root
 * 3. If found, import and return the configuration
 * 4. If not found, return default libar-generic preset configuration
 *
 * @param baseDir - Directory to start searching from (usually cwd or project root)
 * @returns Result with loaded configuration or error
 *
 * @example
 * ```typescript
 * // In CLI tool
 * const result = await loadConfig(process.cwd());
 * if (!result.ok) {
 *   console.error(result.error.message);
 *   process.exit(1);
 * }
 *
 * const { instance, isDefault, path } = result.value;
 * if (!isDefault) {
 *   console.log(`Using config from: ${path}`);
 * }
 *
 * // Use instance.registry for scanning/extracting
 * ```
 */

```typescript
async function loadConfig(baseDir: string): Promise<ConfigLoadResult>;
```

### formatConfigError (function)

/**
 * Format config load error for console display
 *
 * @param error - Config load error
 * @returns Formatted error message
 */

```typescript
function formatConfigError(error: ConfigLoadError): string;
```

---
