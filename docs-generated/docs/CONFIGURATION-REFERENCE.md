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

---

## Implementation Details

### Preset Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

### Preset Category Behavior

**Context:** Presets define complete category sets that replace base taxonomy.
    Category definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

### Default Preset Selection

**Context:** All entry points use consistent defaults.
    Default behavior is documented in `createDeliveryProcess` (factory.ts) and `loadConfig` (config-loader.ts).

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

### Libar Generic Preset

**Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

### Generic Preset

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

### DDD ES CQRS Preset

**Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

### Presets

```typescript
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

```typescript
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
LIBAR_GENERIC_PRESET = {
  tagPrefix: '@libar-docs-',
  fileOptInTag: '@libar-docs',
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

```typescript
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
DDD_ES_CQRS_PRESET = {
  tagPrefix: '@libar-docs-',
  fileOptInTag: '@libar-docs',
  categories: CATEGORIES,
  metadataTags: buildRegistry().metadataTags,
} as const satisfies DeliveryProcessConfig
```

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

### Hierarchical Configuration

**Context:** CLI tools discover config files automatically via directory traversal.
    Discovery logic extracted from `findConfigFile` and `loadConfig` in `src/config/config-loader.ts`.

### Config File Format

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
 * Error during config loading
 */
interface ConfigLoadError {
  type: 'config-load-error';
  path: string;
  message: string;
  /** The underlying error that caused the failure (if any) */
  cause?: Error | undefined;
}
```

```typescript
/**
 * Result type for config loading
 */
type ConfigLoadResult =
  | { ok: true; value: ConfigDiscoveryResult }
  | { ok: false; error: ConfigLoadError };
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
 * Format config load error for console display
 *
 * @param error - Config load error
 * @returns Formatted error message
 */
function formatConfigError(error: ConfigLoadError): string;
```

### RegexBuilders API

**Context:** DeliveryProcessInstance includes utilities for tag detection.
    API methods extracted from `createRegexBuilders` in `src/config/regex-builders.ts`.

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

### Custom Configuration

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

### Programmatic Config Loading

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
