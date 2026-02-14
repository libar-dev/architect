# ADR005ConfigurableTagPrefix

**Purpose:** Detailed patterns for ADR005ConfigurableTagPrefix

---

## Summary

**Progress:** [███████░░░░░░░░░░░░░] 1/3 (33%)

| Status | Count |
| --- | --- |
| ✅ Completed | 1 |
| 🚧 Active | 0 |
| 📋 Planned | 2 |
| **Total** | 3 |

---

## 📋 Planned Patterns

### 📋 Kebab Case Slugs

| Property | Value |
| --- | --- |
| Status | planned |

As a documentation generator
  I need to generate readable, URL-safe slugs from pattern names
  So that generated file names are discoverable and human-friendly

  The slug generation must handle:
  - CamelCase patterns like "DeciderPattern" → "decider-pattern"
  - Consecutive uppercase like "APIEndpoint" → "api-endpoint"
  - Numbers in names like "OAuth2Flow" → "o-auth-2-flow"
  - Special characters removal
  - Proper phase prefixing for requirements

#### Acceptance Criteria

**Convert pattern names to readable slugs**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Handle edge cases in slug generation**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Requirement slugs include phase number**

- Given pattern "<pattern>" with phase "<phase>"
- When generating requirement slug
- Then the slug is "<expected>"

**Requirement without phase uses phase 00**

- Given pattern "SomeUnassigned" without a phase
- When generating requirement slug
- Then the slug is "phase-00-some-unassigned"

**Phase slugs combine number and kebab-case name**

- Given phase number "<number>" with name "<name>"
- When generating phase slug
- Then the slug is "<expected>"

**Phase without name uses "unnamed"**

- Given phase number "5" without a name
- When generating phase slug
- Then the slug is "phase-05-unnamed"

#### Business Rules

**CamelCase names convert to kebab-case**

_Verified by: Convert pattern names to readable slugs_

**Edge cases are handled correctly**

_Verified by: Handle edge cases in slug generation_

**Requirements include phase prefix**

_Verified by: Requirement slugs include phase number, Requirement without phase uses phase 00_

**Phase slugs use kebab-case for names**

_Verified by: Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"_

---

### 📋 Rich Content Helpers Testing

| Property | Value |
| --- | --- |
| Status | planned |

As a document codec author
  I need helpers to render Gherkin rich content
  So that DataTables, DocStrings, and scenarios render consistently across codecs

  The helpers handle edge cases like:
  - Unclosed DocStrings (fallback to plain paragraph)
  - Windows CRLF line endings (normalized to LF)
  - Empty inputs (graceful handling)
  - Missing table cells (empty string fallback)

#### Acceptance Criteria

**Empty description returns empty array**

- Given a description ""
- When parsing for DocStrings
- Then the result is an empty array

**Description with no DocStrings returns single paragraph**

- Given a description "This is plain text without any code blocks."
- When parsing for DocStrings
- Then the result contains 1 block
- And block 1 is a paragraph with text "This is plain text without any code blocks."

**Single DocString parses correctly**

- Given a description with embedded DocString containing typescript code
- When parsing for DocStrings
- Then the result contains 3 blocks with types:

| index | type | language |
| --- | --- | --- |
| 1 | paragraph |  |
| 2 | code | typescript |
| 3 | paragraph |  |

**DocString without language hint uses text**

- Given a description with embedded DocString without language hint
- When parsing for DocStrings
- Then block 2 is a code block with language "text"

**Unclosed DocString returns plain paragraph fallback**

- Given a description with unclosed DocString
- When parsing for DocStrings
- Then the result contains 1 block
- And block 1 is a paragraph

**Windows CRLF line endings are normalized**

- Given a description with CRLF line endings
- When parsing for DocStrings
- Then line endings are normalized to LF

**Single row DataTable renders correctly**

- Given a DataTable with headers "Name" and "Value"
- And a row with values "foo" and "bar"
- When rendering the DataTable
- Then the output is a table block with 1 row

**Multi-row DataTable renders correctly**

- Given a DataTable with headers "A" and "B" and "C"
- And rows:
- When rendering the DataTable
- Then the output is a table block with 2 rows

| A | B | C |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |

**Missing cell values become empty strings**

- Given a DataTable with headers "Col1" and "Col2"
- And a row with only "Col1" value "only-first"
- When rendering the DataTable
- Then the row has empty string for "Col2"

**Render scenario with steps**

- Given a scenario "Test Scenario" with steps:
- When rendering scenario content with default options
- Then the output contains a list block with 3 items

| keyword | text |
| --- | --- |
| Given | initial state |
| When | action taken |
| Then | expected result |

**Skip steps when includeSteps is false**

- Given a scenario "Test Scenario" with steps:
- When rendering scenario content with includeSteps false
- Then the output does not contain a list block

| keyword | text |
| --- | --- |
| Given | some step |

**Render scenario with DataTable in step**

- Given a scenario "Table Test" with a step containing a DataTable
- When rendering scenario content with default options
- Then the output contains a table block

**Rule with simple description**

- Given a business rule "Must validate input" with description "Ensures all input is validated."
- When rendering the business rule
- Then the output contains a bold paragraph with the rule name
- And the output contains the description as a paragraph

**Rule with no description**

- Given a business rule "Simple Rule" with no description
- When rendering the business rule
- Then the output contains a bold paragraph with the rule name
- And no description paragraph is rendered

**Rule with embedded DocString in description**

- Given a business rule "Code Example" with description containing a DocString
- When rendering the business rule
- Then the description is parsed for DocStrings
- And code blocks are rendered from embedded DocStrings

**Code block preserves internal relative indentation**

- Given a description with DocString containing nested code
- When parsing for DocStrings
- Then the code block has correct nested indentation

**Empty lines in code block are preserved**

- Given a description with DocString containing empty lines:
- When parsing for DocStrings
- Then the code block contains 3 lines
- And line 2 of the code block is empty

```markdown
line1

line2
```

**Trailing whitespace is trimmed from each line**

- Given a description with DocString where lines have trailing spaces
- When parsing for DocStrings
- Then no line in the code block ends with whitespace

**Code with mixed indentation is preserved**

- Given a description with DocString containing mixed indent code
- When parsing for DocStrings
- Then the code block preserves the indentation structure

#### Business Rules

**DocString parsing handles edge cases**

_Verified by: Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized_

**DataTable rendering produces valid markdown**

_Verified by: Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings_

**Scenario content rendering respects options**

_Verified by: Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step_

**Business rule rendering handles descriptions**

_Verified by: Rule with simple description, Rule with no description, Rule with embedded DocString in description_

**DocString content is dedented when parsed**

_Verified by: Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved_

---

## ✅ Completed Patterns

### ✅ ADR 005 Configurable Tag Prefix

| Property | Value |
| --- | --- |
| Status | completed |

**Context:**
  The delivery process uses `@libar-docs-*` as the default tag prefix for all metadata annotations.
  - Consumers may want to use their own prefix (e.g., `@myorg-docs-*`)
  - Hardcoding the prefix limits package reusability
  - Different projects have different naming conventions
  - The opt-in marker `@libar-docs` may conflict with existing tags

  **Decision:**
  Make the tag prefix configurable through the preset system:
  - Default prefix remains `@libar-docs-` for backward compatibility
  - Consumers can override via `createDeliveryProcess({ tagPrefix: '@myorg-' })`
  - File opt-in tag follows the prefix pattern (`@myorg-docs` if prefix is `@myorg-`)
  - All scanners, extractors, and validators respect the configured prefix
  - Presets define sensible defaults for common use cases

  **Consequences:**
  - (+) Package can be used by any organization without tag conflicts
  - (+) Backward compatible - existing consumers continue to work
  - (+) Presets provide quick configuration for common patterns
  - (-) Slightly more complex configuration API
  - (-) Documentation must clarify which prefix is active

#### Acceptance Criteria

**Custom tag prefix is respected by scanner**

- Given a delivery process configured with tagPrefix "@myorg-"
- When scanning a file with @myorg-docs-pattern:MyPattern
- Then the pattern is extracted with name "MyPattern"

**Default prefix remains libar-docs for backward compatibility**

- Given a delivery process created with default options
- When scanning a file with @libar-docs-pattern:MyPattern
- Then the pattern is extracted with name "MyPattern"

#### Business Rules

**Preset Quick Reference**

**Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Preset Comparison:**

| Preset | Tag Prefix | File Opt-In | Categories | Use Case |
| --- | --- | --- | --- | --- |
| libar-generic (default) | libar-docs- | libar-docs | 3 | Simple projects (this package) |
| generic | docs- | docs | 3 | Simple projects with shorter prefix |
| ddd-es-cqrs | libar-docs- | libar-docs | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

**Preset Category Behavior**

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

**Default Preset Selection**

**Context:** All entry points use consistent defaults.
    Default behavior is documented in `createDeliveryProcess` (factory.ts) and `loadConfig` (config-loader.ts).

    **Default Selection by Entry Point:**

| Entry Point | Default Preset | Categories | Context |
| --- | --- | --- | --- |
| createDeliveryProcess() | libar-generic | 3 | Programmatic API |
| loadConfig() fallback | libar-generic | 3 | CLI tools (no config file) |
| This package config file | libar-generic | 3 | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

**Libar Generic Preset**

**Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 3 (core, api, infra) |

    **Example Annotation:**

```typescript
/**
     * libar-docs
     * libar-docs-pattern PatternScanner
     * libar-docs-status completed
     * libar-docs-core
     * libar-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {}
```

Note: Tag lines above should each be prefixed with the at-symbol.

**Generic Preset**

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | docs- |
| File Opt-In | docs |
| Categories | 3 (core, api, infra) |

    **Example Annotation:**

```typescript
/**
     * docs
     * docs-pattern PatternScanner
     * docs-status completed
     * docs-core
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {}
```

Note: Tag lines above should each be prefixed with the at-symbol.

**DDD ES CQRS Preset**

**Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 21 |

    **DDD Categories:** See "Complete Category Reference" below for the full 21-category
    list with priorities, descriptions, and aliases.

**Hierarchical Configuration**

**Context:** CLI tools discover config files automatically via directory traversal.
    Discovery logic extracted from `findConfigFile` and `loadConfig` in `src/config/config-loader.ts`.

    **Discovery Order:**

| Step | Location | Action |
| --- | --- | --- |
| 1 | Current directory | Look for delivery-process.config.ts |
| 2 | Parent directories | Walk up to repo root (find .git folder) |
| 3 | Fallback | Use libar-generic preset (3 categories) |

    **Monorepo Strategy:**

| Location | Config File | Typical Preset | Use Case |
| --- | --- | --- | --- |
| Repo root | delivery-process.config.ts | ddd-es-cqrs | Full DDD taxonomy for platform |
| packages/my-package/ | delivery-process.config.ts | generic | Simpler taxonomy for individual package |
| packages/simple/ | (none) | libar-generic (fallback) | Uses root or default |

    CLI tools use the nearest config file to the working directory.

**Config File Format**

**Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

```typescript
// delivery-process.config.ts
    import { createDeliveryProcess } from 'delivery-process-pkg';

    // Default preset
    export default createDeliveryProcess();

    // Or explicit preset
    export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
```

CLI tools use the nearest config file to the working directory.

**Custom Configuration**

**Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Configuration Options:**

| Option | Type | Description |
| --- | --- | --- |
| preset | string | Base preset to use (libar-generic, generic, ddd-es-cqrs) |
| tagPrefix | string | Custom tag prefix (replaces preset default) |
| fileOptInTag | string | Custom file opt-in marker |
| categories | array | Custom category definitions (replaces preset categories) |

    **Custom Tag Prefix Example:**

```typescript
const dp = createDeliveryProcess({
      preset: 'libar-generic',
      tagPrefix: 'team-',
      fileOptInTag: 'team',
    });
```

**Custom Categories Example:**

```typescript
const dp = createDeliveryProcess({
      tagPrefix: 'docs-',
      fileOptInTag: 'docs',
      categories: [
        { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File scanning', aliases: [] },
        { tag: 'extractor', domain: 'Extractor', priority: 2, description: 'Pattern extraction', aliases: [] },
        { tag: 'generator', domain: 'Generator', priority: 3, description: 'Doc generation', aliases: [] },
      ],
    });
```

**RegexBuilders API**

**Context:** DeliveryProcessInstance includes utilities for tag detection.
    API methods extracted from `createRegexBuilders` in `src/config/regex-builders.ts`.

    **RegexBuilders Methods:**

| Method | Return Type | Description |
| --- | --- | --- |
| hasFileOptIn(content) | boolean | Check if file contains opt-in marker |
| hasDocDirectives(content) | boolean | Check for any documentation directives |
| normalizeTag(tag) | string | Normalize tag for lookup (strip prefix) |
| directivePattern | RegExp | Pattern to match documentation directives |

    **Usage Example:**

```typescript
const dp = createDeliveryProcess();

    // Check if file should be scanned
    dp.regexBuilders.hasFileOptIn(fileContent);

    // Check for any documentation directives
    dp.regexBuilders.hasDocDirectives(fileContent);

    // Normalize tag for lookup
    dp.regexBuilders.normalizeTag('libar-docs-pattern');
```

**Programmatic Config Loading**

**Context:** Tools that need to load configuration files dynamically.

    **loadConfig Return Value:**

| Field | Type | Description |
| --- | --- | --- |
| instance | DeliveryProcessInstance | The loaded configuration instance |
| isDefault | boolean | True if no config file was found |
| path | string or undefined | Path to config file (if found) |

    **Usage Example:**

```typescript
import { loadConfig, formatConfigError } from 'delivery-process-pkg/config';

    const result = await loadConfig(process.cwd());

    if (!result.ok) {
      console.error(formatConfigError(result.error));
      process.exit(1);
    }

    const { instance, isDefault, path } = result.value;
```

**Common Configuration Patterns**

**Context:** Frequently used configuration patterns.

    **Pattern Selection Guide:**

| Scenario | Recommended Config | Reason |
| --- | --- | --- |
| Simple library | libar-generic (default) | Minimal categories sufficient |
| DDD microservice | ddd-es-cqrs | Full domain modeling taxonomy |
| Multi-team monorepo | Root: ddd-es-cqrs, packages: vary | Shared taxonomy with package overrides |
| Custom domain vocabulary | Custom categories | Domain-specific terms |
| Shorter annotations | generic preset | Uses docs- prefix vs libar-docs- |

    **Tag Registry Access:**

| Access Pattern | Description |
| --- | --- |
| instance.registry.categories | Array of category definitions |
| instance.registry.statusValues | Valid status values (roadmap, active, completed, deferred) |
| instance.registry.metadataTags | Metadata tag definitions |

**Related Documentation - Configuration**

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

**Concept**

**Context:** A taxonomy is a classification system for organizing knowledge.

    **Definition:** In delivery-process, the taxonomy defines the vocabulary for
    pattern annotations. It determines what tags exist, their valid values, and
    how they are parsed from source code.

    **Components:**

| Component | Purpose | Source File |
| --- | --- | --- |
| Categories | Domain classifications (e.g., core, api, ddd) | categories.ts |
| Status Values | FSM states (roadmap, active, completed, deferred) | status-values.ts |
| Format Types | How tag values are parsed (flag, csv, enum) | format-types.ts |
| Hierarchy Levels | Work item levels (epic, phase, task) | hierarchy-levels.ts |
| Risk Levels | Risk assessment (low, medium, high) | risk-levels.ts |
| Layer Types | Feature layer (timeline, domain, integration) | layer-types.ts |

    **Key Principle:** The taxonomy is NOT a fixed schema. Presets select
    different subsets, and you can define custom categories.

**Complete Category Reference**

**Context:** The ddd-es-cqrs preset includes all 21 categories. Simpler
    presets use subsets (core, api, infra for libar-generic).

    **All Categories:**

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

    **Category Selection Guide:**

| Project Type | Recommended Preset | Categories Available |
| --- | --- | --- |
| Simple utility packages | libar-generic | core, api, infra |
| DDD/Event Sourcing systems | ddd-es-cqrs | All 21 categories |
| Generic projects | generic | core, api, infra |

    **Usage:** Add category tags to patterns using the tag prefix:

```typescript
// For libar-generic preset
    // @libar-docs-core      - marks as core utility
    // @libar-docs-api       - marks as public API
    // @libar-docs-infra     - marks as infrastructure
```

**Format Types**

**Context:** Tags have different value formats that determine parsing.

    **Decision:** Six format types are supported. See `src/taxonomy/format-types.ts`
    for the canonical `FORMAT_TYPES` array with inline documentation.

    **Format Types Reference:**

| Format | Example Tag | Example Value | Parsing Behavior |
| --- | --- | --- | --- |
| flag | @libar-docs-core | (none) | Boolean presence, no value needed |
| value | @libar-docs-pattern | MyPattern | Simple string value |
| enum | @libar-docs-status | completed | Constrained to predefined list |
| csv | @libar-docs-uses | A, B, C | Comma-separated values |
| number | @libar-docs-phase | 15 | Numeric value |
| quoted-value | @libar-docs-brief | 'Multi-word-text' | Preserves quoted values (use hyphens in .feature tags) |

    **Implementation:** The format type is specified in the tag definition
    within the TagRegistry. The extractor uses the format to parse values.

**Status Values**

**Context:** Status values control the FSM workflow for pattern lifecycle.

    **Decision:** Four canonical status values are defined (per PDR-005).
    See `src/taxonomy/status-values.ts` for the `PROCESS_STATUS_VALUES` array
    with inline documentation on FSM transitions and protection levels.

    **Status Values Reference:**

| Status | Protection Level | Description | Editable |
| --- | --- | --- | --- |
| roadmap | None | Planned work, not yet started | Full editing |
| active | Scope-locked | Work in progress | Edit existing only |
| completed | Hard-locked | Work finished | Requires unlock tag |
| deferred | None | On hold, may resume later | Full editing |

    **Valid FSM Transitions:**

| From | To | Trigger |
| --- | --- | --- |
| roadmap | active | Start work |
| roadmap | deferred | Postpone before start |
| active | completed | Finish work |
| active | roadmap | Regress (blocked) |
| deferred | roadmap | Resume planning |

    **FSM Diagram:**

```mermaid
stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Hard-locked
        note right of active : Scope-locked
```

**Normalized Status**

**Context:** Display requires mapping 4 FSM states to 3 presentation buckets.

    **Decision:** Raw status values normalize to display status.
    See `src/taxonomy/normalized-status.ts` for the `STATUS_NORMALIZATION_MAP`
    and `normalizeStatus()` function with complete mapping logic.

    **Rationale:** This separation follows DDD principles - the domain model
    (raw FSM states) is distinct from the view model (normalized display).

**Presets**

**Context:** Different projects need different taxonomy subsets.

    **Decision:** Three presets are available:

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | docs- | Simple projects with docs- prefix |

    **Behavior:** The preset determines which categories are available.
    All presets share the same status values and format types.

**Hierarchy Levels**

**Context:** Work items need hierarchical breakdown for planning.

    **Decision:** Three hierarchy levels are defined (epic, phase, task).
    See `src/taxonomy/hierarchy-levels.ts` for the `HIERARCHY_LEVELS` array
    with JSDoc documentation on duration guidelines and usage.

    **Usage:** The level tag organizes work for roadmap generation.
    Phases can have a parent epic; tasks can have a parent phase.

**Architecture**

**Context:** The taxonomy module structure supports the type-safe annotation system.

    **File Structure:**

```text
src/taxonomy/
      registry-builder.ts   -- buildRegistry() - creates TagRegistry
      categories.ts         -- Category definitions
      status-values.ts      -- FSM state values (PDR-005)
      normalized-status.ts  -- Display normalization (3 buckets)
      format-types.ts       -- Tag value parsing rules
      hierarchy-levels.ts   -- epic/phase/task
      risk-levels.ts        -- low/medium/high
      layer-types.ts        -- timeline/domain/integration/e2e
```

**TagRegistry:** The buildRegistry() function creates a TagRegistry
    containing all taxonomy definitions. It is THE single source of truth.

    **Usage Example:**

```typescript
import { buildRegistry } from '@libar-dev/delivery-process/taxonomy';

    const registry = buildRegistry();
    // registry.tagPrefix       -> "@libar-docs-"
    // registry.fileOptInTag    -> "@libar-docs"
    // registry.categories      -> CategoryDefinition[]
    // registry.metadataTags    -> MetadataTagDefinitionForRegistry[]
```

**Tag Generation**

**Context:** Developers need a reference of all available tags.

    **Decision:** The generate-tag-taxonomy CLI creates a markdown reference:

```bash
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

**Output:** A markdown file documenting all tags with their formats,
    valid values, and examples - generated from the TagRegistry.

**Related Documentation - Taxonomy**

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| CONFIGURATION-REFERENCE.md | Reference | Preset configuration and factory API |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

_Verified by: Custom tag prefix is respected by scanner, Default prefix remains libar-docs for backward compatibility_

---

[← Back to Roadmap](../ROADMAP.md)
