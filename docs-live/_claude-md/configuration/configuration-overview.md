=== CONFIGURATION OVERVIEW ===

Purpose: Configuration product area overview
Detail Level: Compact summary

**How do I configure the tool?** Configuration controls what gets scanned, which tags are recognized, and how output is organized. Three presets define escalating taxonomy complexity — from 3 categories for simple projects to 21 for full DDD/ES/CQRS architectures. The `defineConfig()` function provides type-safe configuration following the Vite convention.

=== KEY INVARIANTS ===

- Preset-based taxonomy: `generic` (3 categories, `@docs-`), `libar-generic` (3 categories, `@libar-docs-`), `ddd-es-cqrs` (21 categories, full DDD)
- Stubs merged at resolution time: Stub directory globs are appended to typescript sources, making stubs transparent to the downstream pipeline

=== API TYPES ===

| Type                         | Kind      |
| ---------------------------- | --------- |
| CreateDeliveryProcessOptions | interface |
| ConfigDiscoveryResult        | interface |
| ConfigLoadError              | interface |
| ConfigLoadResult             | type      |
| createDeliveryProcess        | function  |
| findConfigFile               | function  |
| loadConfig                   | function  |
| formatConfigError            | function  |

=== BEHAVIOR SPECIFICATIONS ===

--- SourceMerging ---

| Rule                                                | Description |
| --------------------------------------------------- | ----------- |
| No override returns base unchanged                  |             |
| Feature overrides control feature source selection  |             |
| TypeScript source overrides append additional input |             |
| Combined overrides apply together                   |             |
| Exclude is always inherited from base               |             |

--- ProjectConfigLoader ---

| Rule                                                | Description |
| --------------------------------------------------- | ----------- |
| Missing config returns defaults                     |             |
| New-style config is loaded and resolved             |             |
| Legacy config is loaded with backward compatibility |             |
| Invalid configs produce clear errors                |             |

--- PresetSystem ---

| Rule                                                             | Description                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Generic preset provides minimal taxonomy                         | **Invariant:** The generic preset must provide exactly 3 categories (core, api, infra) with @docs- prefix....       |
| Libar generic preset provides minimal taxonomy with libar prefix | **Invariant:** The libar-generic preset must provide exactly 3 categories with @libar-docs- prefix....              |
| DDD-ES-CQRS preset provides full taxonomy                        | **Invariant:** The DDD preset must provide all 21 categories spanning DDD, ES, CQRS, and infrastructure domains.... |
| Presets can be accessed by name                                  | **Invariant:** All preset instances must be accessible via the PRESETS map using their canonical string key....     |

--- DefineConfigTesting ---

| Rule                                    | Description |
| --------------------------------------- | ----------- |
| defineConfig is an identity function    |             |
| Schema validates correct configurations |             |
| Schema rejects invalid configurations   |             |
| Type guards distinguish config formats  |             |

--- ConfigurationAPI ---

| Rule                                                       | Description |
| ---------------------------------------------------------- | ----------- |
| Factory creates configured instances with correct defaults |             |
| Custom prefix configuration works correctly                |             |
| Preset categories replace base categories entirely         |             |
| Regex builders use configured prefix                       |             |

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

| Rule                                                  | Description |
| ----------------------------------------------------- | ----------- |
| Config files are discovered by walking up directories |             |
| Config discovery stops at repo root                   |             |
| Config is loaded and validated                        |             |
| Config errors are formatted for display               |             |
