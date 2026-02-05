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
| Preset Quick Reference | THIS DECISION (Rule: Preset Quick Reference) | Rule block table |
| Preset Category Behavior | THIS DECISION (Rule: Preset Category Behavior) | Rule block table |
| Default Preset Selection | THIS DECISION (Rule: Default Preset Selection) | Rule block table |
| Libar Generic Preset | THIS DECISION (Rule: Libar Generic Preset) | Rule block table |
| Generic Preset | THIS DECISION (Rule: Generic Preset) | Rule block table |
| DDD ES CQRS Preset | THIS DECISION (Rule: DDD ES CQRS Preset) | Rule block table |
| Presets | src/config/presets.ts | extract-shapes tag |
| Factory Options | src/config/factory.ts | extract-shapes tag |
| Types | src/config/types.ts | extract-shapes tag |
| Hierarchical Configuration | THIS DECISION (Rule: Hierarchical Configuration) | Rule block table |
| Config File Format | THIS DECISION (Rule: Config File Format) | DocString examples |
| Config Loader | src/config/config-loader.ts | extract-shapes tag |
| RegexBuilders API | THIS DECISION (Rule: RegexBuilders API) | Rule block table |
| RegexBuilders | src/config/regex-builders.ts | extract-shapes tag |
| Custom Configuration | THIS DECISION (Rule: Custom Configuration) | DocString examples |
| Programmatic Config Loading | THIS DECISION (Rule: Programmatic Config Loading) | DocString examples |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Configuration reference feature file | Complete | specs/docs/configuration-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/CONFIGURATIONREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/config/configurationreference.md |

  Rule: Preset Quick Reference

    **Context:** Three presets are available with different tag prefixes and category counts.

    **Quick Reference Table:**

| Preset | Tag Prefix | Categories | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | prefix libar-docs- | 3 | Simple projects (this package) |
| generic | prefix docs- | 3 | Simple projects with docs- prefix |
| ddd-es-cqrs | prefix libar-docs- | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

  Rule: Preset Category Behavior

    **Context:** Presets define complete category sets that replace base taxonomy.

    **Category Replacement Behavior:**

| Preset | Categories | Count |
| --- | --- | --- |
| generic | core, api, infra | 3 |
| libar-generic | core, api, infra | 3 |
| ddd-es-cqrs | Full DDD taxonomy | 21 |

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

  Rule: Default Preset Selection

    **Context:** All entry points use consistent defaults.

    **Default Preset Table:**

| Entry Point | Default | Context |
| --- | --- | --- |
| createDeliveryProcess() | libar-generic (3 categories) | Programmatic API |
| loadConfig() fallback | libar-generic (3 categories) | CLI tools when no config file |
| This package config | libar-generic (3 categories) | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

  Rule: Libar Generic Preset

    **Context:** Default preset with libar-docs- prefix and 3 categories.

| Property | Value |
| --- | --- |
| Tag Prefix | at-libar-docs- |
| File Opt-In | at-libar-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern PatternScanner
     * at-libar-docs-status completed
     * at-libar-docs-core
     * at-libar-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {
      // Implementation
    }
    """

  Rule: Generic Preset

    **Context:** Same 3 categories as libar-generic but with shorter docs- prefix.

| Property | Value |
| --- | --- |
| Tag Prefix | at-docs- |
| File Opt-In | at-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

    """typescript
    /**
     * at-docs
     * at-docs-pattern PatternScanner
     * at-docs-status completed
     * at-docs-core
     * at-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {
      // Implementation
    }
    """

  Rule: DDD ES CQRS Preset

    **Context:** Full taxonomy for domain-driven architectures with 21 categories.

| Property | Value |
| --- | --- |
| Tag Prefix | at-libar-docs- |
| File Opt-In | at-libar-docs |
| Categories | 21 (domain, ddd, bounded-context, event-sourcing, decider, cqrs, etc.) |

    **When to Use:**

    - DDD architectures
    - Event sourcing projects
    - CQRS implementations
    - Full roadmap/phase tracking

  Rule: Hierarchical Configuration

    **Context:** CLI tools discover config files automatically via directory traversal.

    **Discovery Order:**

| Step | Action |
| --- | --- |
| 1 | Look for delivery-process.config.ts in current directory |
| 2 | Walk up parent directories until repo root (.git folder) |
| 3 | Fall back to libar-generic preset (3 categories) |

    **Config File Variants:**

| File Name | Notes |
| --- | --- |
| delivery-process.config.ts | TypeScript config (primary) |
| delivery-process.config.js | JavaScript config (pre-compiled) |

  Rule: Config File Format

    **Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

    """typescript
    // delivery-process.config.ts
    import { createDeliveryProcess } from 'at-libar-dev/delivery-process';

    // Default preset
    export default createDeliveryProcess();

    // Or explicit preset
    export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
    """

    **Monorepo Example:**

    """text
    my-monorepo/
      delivery-process.config.ts          <- Repo: ddd-es-cqrs
      packages/
        my-package/
          delivery-process.config.ts      <- Package: generic
    """

    CLI tools use the nearest config file to the working directory.

  Rule: Custom Configuration

    **Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Tag Prefix:**

    """typescript
    const dp = createDeliveryProcess({
      preset: 'libar-generic',
      tagPrefix: 'at-team-',
      fileOptInTag: 'at-team',
    });

    // Your annotations:
    // /** at-team */
    // /** at-team-pattern DualSourceExtractor */
    // /** at-team-core */
    """

    **Custom Categories:**

    """typescript
    const dp = createDeliveryProcess({
      tagPrefix: 'at-docs-',
      fileOptInTag: 'at-docs',
      categories: [
        { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File scanning', aliases: [] },
        { tag: 'extractor', domain: 'Extractor', priority: 2, description: 'Pattern extraction', aliases: [] },
        { tag: 'generator', domain: 'Generator', priority: 3, description: 'Doc generation', aliases: [] },
      ],
    });
    """

  Rule: RegexBuilders API

    **Context:** DeliveryProcessInstance includes utilities for tag detection.

    **API Methods:**

| Method | Description |
| --- | --- |
| hasFileOptIn(content) | true if content contains file opt-in marker |
| hasDocDirectives(content) | true if content contains doc directives |
| normalizeTag(tag) | Strips prefix: at-libar-docs-pattern becomes pattern |

    **Usage Example:**

    """typescript
    const dp = createDeliveryProcess(); // Uses libar-generic (default)

    // Check if file should be scanned
    dp.regexBuilders.hasFileOptIn(fileContent);  // true if contains /** at-libar-docs */

    // Check for any documentation directives
    dp.regexBuilders.hasDocDirectives(fileContent);  // true if contains at-libar-docs-*

    // Normalize tag for lookup
    dp.regexBuilders.normalizeTag('at-libar-docs-pattern');  // "pattern"
    """

  Rule: Programmatic Config Loading

    **Context:** Tools that need to load configuration files dynamically.

    **Usage Example:**

    """typescript
    import { loadConfig, formatConfigError } from 'at-libar-dev/delivery-process/config';

    const result = await loadConfig(process.cwd());

    if (!result.ok) {
      console.error(formatConfigError(result.error));
      process.exit(1);
    }

    const { instance, isDefault, path } = result.value;
    // instance.registry - TagRegistry for scanning/extraction
    // instance.regexBuilders - Regex utilities for detection
    // isDefault - true if no config file found
    // path - config file path (if found)
    """

  @acceptance-criteria
  Scenario: Reference generates Configuration documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all preset information
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And preset comparison tables are included in output
