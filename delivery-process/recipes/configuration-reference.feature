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
      | Configuration reference feature file | Complete | delivery-process/recipes/configuration-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/CONFIGURATIONREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/config/configurationreference.md |

  Rule: Preset Quick Reference

    **Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

  Rule: Preset Category Behavior

    **Context:** Presets define complete category sets that replace base taxonomy.
    Category definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

  Rule: Default Preset Selection

    **Context:** All entry points use consistent defaults.
    Default behavior is documented in `createDeliveryProcess` (factory.ts) and `loadConfig` (config-loader.ts).

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

  Rule: Libar Generic Preset

    **Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

  Rule: Generic Preset

    **Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

  Rule: DDD ES CQRS Preset

    **Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

  Rule: Hierarchical Configuration

    **Context:** CLI tools discover config files automatically via directory traversal.
    Discovery logic extracted from `findConfigFile` and `loadConfig` in `src/config/config-loader.ts`.

  Rule: Config File Format

    **Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

    """typescript
    // delivery-process.config.ts
    import { createDeliveryProcess } from '@libar-dev/delivery-process';

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
    API methods extracted from `createRegexBuilders` in `src/config/regex-builders.ts`.

  Rule: Programmatic Config Loading

    **Context:** Tools that need to load configuration files dynamically.

    **Usage Example:**

    """typescript
    import { loadConfig, formatConfigError } from '@libar-dev/delivery-process/config';

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
