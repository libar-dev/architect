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
