@libar-docs
@libar-docs-pattern:ConfigurationReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-config
@libar-docs-claude-md-section:config
Feature: Configuration Reference - Auto-Generated Documentation

  **Problem:**
  Developers need to configure tag prefixes, presets, and custom taxonomies.
  Understanding preset differences, configuration discovery, and RegexBuilders API
  requires documentation that stays in sync with implementation.

  **Solution:**
  Auto-generate the Configuration reference documentation from annotated source code.
  Preset definitions, factory functions, and type definitions become the source of truth.
  Documentation is a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/CONFIGURATIONREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/config/configurationreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Preset Quick Reference | THIS DECISION (Rule: Preset Quick Reference) | Rule block context |
| Preset Category Behavior | THIS DECISION (Rule: Preset Category Behavior) | Rule block context |
| Default Preset Selection | THIS DECISION (Rule: Default Preset Selection) | Rule block context |
| Libar Generic Preset | THIS DECISION (Rule: Libar Generic Preset) | Rule block context |
| Generic Preset | THIS DECISION (Rule: Generic Preset) | Rule block context |
| DDD ES CQRS Preset | THIS DECISION (Rule: DDD ES CQRS Preset) | Rule block context |
| Presets | src/config/presets.ts | extract-shapes tag |
| Factory Options | src/config/factory.ts | extract-shapes tag |
| Types | src/config/types.ts | extract-shapes tag |
| Hierarchical Configuration | THIS DECISION (Rule: Hierarchical Configuration) | Rule block context |
| Config File Format | THIS DECISION (Rule: Config File Format) | DocString examples |
| Config Loader | src/config/config-loader.ts | extract-shapes tag |
| RegexBuilders API | THIS DECISION (Rule: RegexBuilders API) | Rule block context |
| RegexBuilders | src/config/regex-builders.ts | extract-shapes tag |
| Custom Configuration | THIS DECISION (Rule: Custom Configuration) | DocString examples |
| Programmatic Config Loading | THIS DECISION (Rule: Programmatic Config Loading) | DocString examples |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Configuration reference feature file | complete | delivery-process/recipes/configuration-reference.feature |
      | Generated detailed docs | pending | docs-generated/docs/CONFIGURATIONREFERENCE.md |
      | Generated compact docs | pending | docs-generated/_claude-md/config/configurationreference.md |

  Rule: Preset Quick Reference

    **Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Preset Comparison:**

| Preset | Tag Prefix | File Opt-In | Categories | Use Case |
| --- | --- | --- | --- | --- |
| libar-generic (default) | libar-docs- | libar-docs | 3 | Simple projects (this package) |
| generic | docs- | docs | 3 | Simple projects with shorter prefix |
| ddd-es-cqrs | libar-docs- | libar-docs | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

  Rule: Preset Category Behavior

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

  Rule: Default Preset Selection

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

  Rule: Libar Generic Preset

    **Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 3 (core, api, infra) |

    **Example Annotation:**

    """typescript
    /**
     * libar-docs
     * libar-docs-pattern PatternScanner
     * libar-docs-status completed
     * libar-docs-core
     * libar-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {}
    """

    Note: Tag lines above should each be prefixed with the at-symbol.

  Rule: Generic Preset

    **Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | docs- |
| File Opt-In | docs |
| Categories | 3 (core, api, infra) |

    **Example Annotation:**

    """typescript
    /**
     * docs
     * docs-pattern PatternScanner
     * docs-status completed
     * docs-core
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {}
    """

    Note: Tag lines above should each be prefixed with the at-symbol.

  Rule: DDD ES CQRS Preset

    **Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 21 |

    **DDD Category List:**

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

  Rule: Hierarchical Configuration

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

  Rule: Config File Format

    **Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

    """typescript
    // delivery-process.config.ts
    import { createDeliveryProcess } from 'delivery-process-pkg';

    // Default preset
    export default createDeliveryProcess();

    // Or explicit preset
    export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
    """

    CLI tools use the nearest config file to the working directory.

  Rule: Custom Configuration

    **Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Configuration Options:**

| Option | Type | Description |
| --- | --- | --- |
| preset | string | Base preset to use (libar-generic, generic, ddd-es-cqrs) |
| tagPrefix | string | Custom tag prefix (replaces preset default) |
| fileOptInTag | string | Custom file opt-in marker |
| categories | array | Custom category definitions (replaces preset categories) |

    **Custom Tag Prefix Example:**

    """typescript
    const dp = createDeliveryProcess({
      preset: 'libar-generic',
      tagPrefix: 'team-',
      fileOptInTag: 'team',
    });
    """

    **Custom Categories Example:**

    """typescript
    const dp = createDeliveryProcess({
      tagPrefix: 'docs-',
      fileOptInTag: 'docs',
      categories: [
        { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File scanning', aliases: [] },
        { tag: 'extractor', domain: 'Extractor', priority: 2, description: 'Pattern extraction', aliases: [] },
        { tag: 'generator', domain: 'Generator', priority: 3, description: 'Doc generation', aliases: [] },
      ],
    });
    """

  Rule: RegexBuilders API

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

    """typescript
    const dp = createDeliveryProcess();

    // Check if file should be scanned
    dp.regexBuilders.hasFileOptIn(fileContent);

    // Check for any documentation directives
    dp.regexBuilders.hasDocDirectives(fileContent);

    // Normalize tag for lookup
    dp.regexBuilders.normalizeTag('libar-docs-pattern');
    """

  Rule: Programmatic Config Loading

    **Context:** Tools that need to load configuration files dynamically.

    **loadConfig Return Value:**

| Field | Type | Description |
| --- | --- | --- |
| instance | DeliveryProcessInstance | The loaded configuration instance |
| isDefault | boolean | True if no config file was found |
| path | string or undefined | Path to config file (if found) |

    **Usage Example:**

    """typescript
    import { loadConfig, formatConfigError } from 'delivery-process-pkg/config';

    const result = await loadConfig(process.cwd());

    if (!result.ok) {
      console.error(formatConfigError(result.error));
      process.exit(1);
    }

    const { instance, isDefault, path } = result.value;
    """

  Rule: Common Configuration Patterns

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

  Rule: Related Documentation

    **Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

  @acceptance-criteria
  Scenario: Reference generates Configuration documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all preset information
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And preset comparison tables are included in output
