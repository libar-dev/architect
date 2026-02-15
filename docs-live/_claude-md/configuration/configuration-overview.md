=== CONFIGURATION OVERVIEW ===

Purpose: Configuration product area overview
Detail Level: Compact summary

**How do I configure the tool?** Configuration is the entry boundary — it transforms a user-authored `delivery-process.config.ts` file into a fully resolved `DeliveryProcessInstance` that powers the entire pipeline. The flow is: `defineConfig()` provides type-safe authoring (Vite convention, zero validation), `ConfigLoader` discovers and loads the file, `ProjectConfigSchema` validates via Zod, `ConfigResolver` applies defaults and merges stubs into sources, and `DeliveryProcessFactory` builds the final instance with `TagRegistry` and `RegexBuilders`. Three presets define escalating taxonomy complexity — from 3 categories (`generic`, `libar-generic`) to 21 (`ddd-es-cqrs`). `SourceMerger` computes per-generator source overrides, enabling generators like changelog to pull from different feature sets than the base config.

=== KEY INVARIANTS ===

- Preset-based taxonomy: `generic` (3 categories, `@docs-`), `libar-generic` (3 categories, `@libar-docs-`), `ddd-es-cqrs` (21 categories, full DDD). Presets replace base categories entirely — they define prefix, categories, and metadata tags as a unit
- Resolution pipeline: defineConfig() → ConfigLoader → ProjectConfigSchema (Zod) → ConfigResolver → DeliveryProcessFactory → DeliveryProcessInstance. Each stage has a single responsibility
- Stubs merged at resolution time: Stub directory globs are appended to typescript sources, making stubs transparent to the downstream pipeline
- Source override composition: SourceMerger applies per-generator overrides (`replaceFeatures`, `additionalFeatures`, `additionalInput`) to base sources. Exclude is always inherited from base

=== API TYPES ===

| Type                         | Kind      |
| ---------------------------- | --------- |
| DeliveryProcessConfig        | interface |
| DeliveryProcessInstance      | interface |
| RegexBuilders                | interface |
| DeliveryProcessProjectConfig | interface |
| SourcesConfig                | interface |
| OutputConfig                 | interface |
| GeneratorSourceOverride      | interface |
| ResolvedProjectConfig        | interface |
| ResolvedSourcesConfig        | interface |
| CreateDeliveryProcessOptions | interface |
| ConfigDiscoveryResult        | interface |
| ConfigLoadError              | interface |
| ResolvedConfig               | type      |
| PresetName                   | type      |
| ConfigLoadResult             | type      |
| createRegexBuilders          | function  |
| createDeliveryProcess        | function  |
| findConfigFile               | function  |
| loadConfig                   | function  |
| formatConfigError            | function  |

=== BEHAVIOR SPECIFICATIONS ===

--- SourceMerging ---

| Rule                                                | Description                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| No override returns base unchanged                  | **Invariant:** When no source overrides are provided, the merged result must be identical to the base source...        |
| Feature overrides control feature source selection  | **Invariant:** additionalFeatures must append to base feature sources while replaceFeatures must completely replace... |
| TypeScript source overrides append additional input | **Invariant:** additionalInput must append to (not replace) the base TypeScript source paths.<br> **Rationale:**...    |
| Combined overrides apply together                   | **Invariant:** Feature overrides and TypeScript overrides must compose independently when both are provided...         |
| Exclude is always inherited from base               | **Invariant:** The exclude patterns must always come from the base configuration, never from overrides....             |

--- ProjectConfigLoader ---

| Rule                                                | Description                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Missing config returns defaults                     | **Invariant:** When no config file exists, loadProjectConfig must return a default resolved config with...              |
| New-style config is loaded and resolved             | **Invariant:** A file exporting defineConfig must be loaded, validated, and resolved with correct preset categories.... |
| Legacy config is loaded with backward compatibility | **Invariant:** A file exporting createDeliveryProcess must be loaded and produce a valid resolved config....            |
| Invalid configs produce clear errors                | **Invariant:** Config files without a default export or with invalid data must produce descriptive error messages....   |

--- PresetSystem ---

| Rule                                                             | Description                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Generic preset provides minimal taxonomy                         | **Invariant:** The generic preset must provide exactly 3 categories (core, api, infra) with @docs- prefix....       |
| Libar generic preset provides minimal taxonomy with libar prefix | **Invariant:** The libar-generic preset must provide exactly 3 categories with @libar-docs- prefix....              |
| DDD-ES-CQRS preset provides full taxonomy                        | **Invariant:** The DDD preset must provide all 21 categories spanning DDD, ES, CQRS, and infrastructure domains.... |
| Presets can be accessed by name                                  | **Invariant:** All preset instances must be accessible via the PRESETS map using their canonical string key....     |

--- DefineConfigTesting ---

| Rule                                    | Description                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| defineConfig is an identity function    | **Invariant:** The defineConfig helper must return its input unchanged, serving only as a type annotation aid for IDE... |
| Schema validates correct configurations | **Invariant:** Valid configuration objects (both minimal and fully-specified) must pass schema validation without...     |
| Schema rejects invalid configurations   | **Invariant:** The configuration schema must reject invalid values including empty globs, directory traversal...         |
| Type guards distinguish config formats  | **Invariant:** The isProjectConfig and isLegacyInstance type guards must correctly distinguish between new-style...      |

--- ConfigurationAPI ---

| Rule                                                       | Description                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Factory creates configured instances with correct defaults | **Invariant:** The configuration factory must produce a fully initialized instance for any supported preset, with the... |
| Custom prefix configuration works correctly                | **Invariant:** Custom tag prefix and file opt-in tag overrides must be applied to the configuration instance,...         |
| Preset categories replace base categories entirely         | **Invariant:** When a preset defines its own category set, it must fully replace (not merge with) the base...            |
| Regex builders use configured prefix                       | **Invariant:** All regex builders (hasFileOptIn, hasDocDirectives, normalizeTag) must use the configured tag prefix,...  |

--- ConfigResolution ---

| Rule                                       | Description                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Default config provides sensible fallbacks | **Invariant:** A config created without user input must have isDefault=true and empty source collections....         |
| Preset creates correct taxonomy instance   | **Invariant:** Each preset must produce a taxonomy with the correct number of categories and tag prefix....          |
| Stubs are merged into typescript sources   | **Invariant:** Stub glob patterns must appear in resolved typescript sources alongside original globs....            |
| Output defaults are applied                | **Invariant:** Missing output configuration must resolve to "docs/architecture" with overwrite=false....             |
| Generator defaults are applied             | **Invariant:** A config with no generators specified must default to the "patterns" generator.<br> **Rationale:**... |
| Context inference rules are prepended      | **Invariant:** User-defined inference rules must appear before built-in defaults in the resolved array....           |
| Config path is carried from options        | **Invariant:** The configPath from resolution options must be preserved unchanged in resolved config....             |

--- ConfigLoaderTesting ---

| Rule                                                  | Description                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Config files are discovered by walking up directories | **Invariant:** The config loader must search for configuration files starting from the current directory and walking... |
| Config discovery stops at repo root                   | **Invariant:** Directory traversal must stop at repository root markers (e.g., .git directory) and not search beyond... |
| Config is loaded and validated                        | **Invariant:** Loaded config files must have a valid default export matching the expected configuration schema, with... |
| Config errors are formatted for display               | **Invariant:** Configuration loading errors must be formatted as human-readable messages including the file path and... |
