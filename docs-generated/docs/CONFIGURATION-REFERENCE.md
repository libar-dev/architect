# ConfigurationReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

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
| Quick Reference | THIS DECISION (Rule: Preset Quick Reference) | Rule block table |
| Category Behavior | THIS DECISION (Rule: Preset Category Behavior) | Rule block table |
| Default Preset | THIS DECISION (Rule: Default Preset Selection) | Rule block table |
| Presets | src/config/presets.ts | extract-shapes tag |
| Factory Options | src/config/factory.ts | extract-shapes tag |
| Types | src/config/types.ts | extract-shapes tag |
| Discovery Order | THIS DECISION (Rule: Hierarchical Configuration) | Rule block table |
| Config Loader | src/config/config-loader.ts | extract-shapes tag |
| RegexBuilders | src/config/regex-builders.ts | extract-shapes tag |
| Custom Config | THIS DECISION (Rule: Custom Configuration) | DocString examples |

---

## Implementation Details

### Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.

    **Quick Reference Table:**

| Preset | Tag Prefix | Categories | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | prefix libar-docs- | 3 | Simple projects (this package) |
| generic | prefix docs- | 3 | Simple projects with docs- prefix |
| ddd-es-cqrs | prefix libar-docs- | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

### Category Behavior

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

### Default Preset

**Context:** All entry points use consistent defaults.

    **Default Preset Table:**

| Entry Point | Default | Context |
| --- | --- | --- |
| createDeliveryProcess() | libar-generic (3 categories) | Programmatic API |
| loadConfig() fallback | libar-generic (3 categories) | CLI tools when no config file |
| This package config | libar-generic (3 categories) | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

### Presets

```typescript
/**
 * Available preset names
 */
type PresetName = 'generic' | 'libar-generic' | 'ddd-es-cqrs';
```

```typescript
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
const PRESETS: Record<PresetName, DeliveryProcessConfig>;
```

### Factory Options

```typescript
/**
 * Options for creating a delivery process instance
 */
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

```typescript
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
function createDeliveryProcess(
  options: CreateDeliveryProcessOptions =;
```

### Types

```typescript
/**
 * Configuration for creating a delivery process instance.
 * Uses generics to preserve literal types from presets.
 */
interface DeliveryProcessConfig {
  /** Tag prefix for directives (e.g., "@docs-" or "@libar-docs-") */
  readonly tagPrefix: string;
  /** File-level opt-in tag (e.g., "@docs" or "@libar-docs") */
  readonly fileOptInTag: string;
  /** Category definitions for pattern classification */
  readonly categories: readonly CategoryDefinition[];
  /** Optional metadata tag definitions */
  readonly metadataTags?: readonly MetadataTagDefinitionForRegistry[];
}
```

```typescript
/**
 * Instance returned by createDeliveryProcess with configured registry
 */
interface DeliveryProcessInstance {
  /** The fully configured tag registry */
  readonly registry: TagRegistry;
  /** Regex builders for tag detection */
  readonly regexBuilders: RegexBuilders;
}
```

```typescript
/**
 * Regex builders for tag detection
 *
 * Provides type-safe regex operations for detecting and normalizing tags
 * based on the configured tag prefix.
 */
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

### Discovery Order

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

### Config Loader

```typescript
/**
 * Result of config file discovery
 */
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

```typescript
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
async function loadConfig(baseDir: string): Promise<ConfigLoadResult>;
```

```typescript
/**
 * Find config file by walking up from startDir
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */
async function findConfigFile(startDir: string): Promise<string | null>;
```

### RegexBuilders

```typescript
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
function createRegexBuilders(tagPrefix: string, fileOptInTag: string): RegexBuilders;
```

## Preset Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.

    **Quick Reference Table:**

| Preset | Tag Prefix | Categories | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | prefix libar-docs- | 3 | Simple projects (this package) |
| generic | prefix docs- | 3 | Simple projects with docs- prefix |
| ddd-es-cqrs | prefix libar-docs- | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

## Preset Category Behavior

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

## Default Preset Selection

**Context:** All entry points use consistent defaults.

    **Default Preset Table:**

| Entry Point | Default | Context |
| --- | --- | --- |
| createDeliveryProcess() | libar-generic (3 categories) | Programmatic API |
| loadConfig() fallback | libar-generic (3 categories) | CLI tools when no config file |
| This package config | libar-generic (3 categories) | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

## Libar Generic Preset

**Context:** Default preset with libar-docs- prefix and 3 categories.

| Property | Value |
| --- | --- |
| Tag Prefix | at-libar-docs- |
| File Opt-In | at-libar-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

```typescript
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
```

## Generic Preset

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.

| Property | Value |
| --- | --- |
| Tag Prefix | at-docs- |
| File Opt-In | at-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

```typescript
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
```

## DDD ES CQRS Preset

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

## Hierarchical Configuration

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

## Config File Format

**Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

```typescript
// delivery-process.config.ts
    import { createDeliveryProcess } from 'at-libar-dev/delivery-process';

    // Default preset
    export default createDeliveryProcess();

    // Or explicit preset
    export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
```

**Monorepo Example:**

```text
my-monorepo/
      delivery-process.config.ts          <- Repo: ddd-es-cqrs
      packages/
        my-package/
          delivery-process.config.ts      <- Package: generic
```

CLI tools use the nearest config file to the working directory.

## Custom Configuration

**Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Tag Prefix:**

```typescript
const dp = createDeliveryProcess({
      preset: 'libar-generic',
      tagPrefix: 'at-team-',
      fileOptInTag: 'at-team',
    });

    // Your annotations:
    // /** at-team */
    // /** at-team-pattern DualSourceExtractor */
    // /** at-team-core */
```

**Custom Categories:**

```typescript
const dp = createDeliveryProcess({
      tagPrefix: 'at-docs-',
      fileOptInTag: 'at-docs',
      categories: [
        { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File scanning', aliases: [] },
        { tag: 'extractor', domain: 'Extractor', priority: 2, description: 'Pattern extraction', aliases: [] },
        { tag: 'generator', domain: 'Generator', priority: 3, description: 'Doc generation', aliases: [] },
      ],
    });
```

## RegexBuilders API

**Context:** DeliveryProcessInstance includes utilities for tag detection.

    **API Methods:**

| Method | Description |
| --- | --- |
| hasFileOptIn(content) | true if content contains file opt-in marker |
| hasDocDirectives(content) | true if content contains doc directives |
| normalizeTag(tag) | Strips prefix: at-libar-docs-pattern becomes pattern |

    **Usage Example:**

```typescript
const dp = createDeliveryProcess(); // Uses libar-generic (default)

    // Check if file should be scanned
    dp.regexBuilders.hasFileOptIn(fileContent);  // true if contains /** at-libar-docs */

    // Check for any documentation directives
    dp.regexBuilders.hasDocDirectives(fileContent);  // true if contains at-libar-docs-*

    // Normalize tag for lookup
    dp.regexBuilders.normalizeTag('at-libar-docs-pattern');  // "pattern"
```

## Programmatic Config Loading

**Context:** Tools that need to load configuration files dynamically.

    **Usage Example:**

```typescript
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
```
