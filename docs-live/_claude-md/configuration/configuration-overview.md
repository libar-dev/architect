### Configuration Overview

**How do I configure the tool?** Configuration is the entry boundary — it transforms a user-authored `architect.config.ts` file into a fully resolved `ArchitectInstance` that powers the entire pipeline. The flow is: `defineConfig()` provides type-safe authoring (Vite convention, zero validation), `ConfigLoader` discovers and loads the file, `ProjectConfigSchema` validates via Zod, `ConfigResolver` applies defaults and merges stubs into sources, and `ArchitectFactory` builds the final instance with `TagRegistry` and `RegexBuilders`. Three presets define escalating taxonomy complexity — from 3 categories (`generic`, `libar-generic`) to 21 (`ddd-es-cqrs`). `SourceMerger` computes per-generator source overrides, enabling generators like changelog to pull from different feature sets than the base config.

#### Key Invariants

- Preset-based taxonomy: `generic` (3 categories, `@docs-`), `libar-generic` (3 categories, `@architect-`), `ddd-es-cqrs` (21 categories, full DDD). Presets replace base categories entirely — they define prefix, categories, and metadata tags as a unit
- Resolution pipeline: defineConfig() → ConfigLoader → ProjectConfigSchema (Zod) → ConfigResolver → ArchitectFactory → ArchitectInstance. Each stage has a single responsibility
- Stubs merged at resolution time: Stub directory globs are appended to typescript sources, making stubs transparent to the downstream pipeline
- Source override composition: SourceMerger applies per-generator overrides (`replaceFeatures`, `additionalFeatures`, `additionalInput`) to base sources. Exclude is always inherited from base

**Components:** Config (WorkflowLoader, ConfigurationTypes, ConfigResolver, RegexBuilders, ProjectConfigTypes, ProjectConfigSchema, ConfigurationPresets, SourceMerger, ArchitectFactory, DefineConfig, ConfigurationDefaults, ConfigLoader)

#### API Types

| Type                    | Kind      |
| ----------------------- | --------- |
| ArchitectConfig         | interface |
| ArchitectInstance       | interface |
| RegexBuilders           | interface |
| ArchitectProjectConfig  | interface |
| SourcesConfig           | interface |
| OutputConfig            | interface |
| GeneratorSourceOverride | interface |
| ResolvedProjectConfig   | interface |
| ResolvedSourcesConfig   | interface |
| CreateArchitectOptions  | interface |
| ConfigDiscoveryResult   | interface |
| ConfigLoadError         | interface |
| ResolvedConfig          | type      |
| PresetName              | type      |
| ConfigLoadResult        | type      |
| createRegexBuilders     | function  |
| createArchitect         | function  |
| findConfigFile          | function  |
| loadConfig              | function  |
| formatConfigError       | function  |
