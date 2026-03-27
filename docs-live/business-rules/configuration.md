# Configuration Business Rules

**Purpose:** Business rules for the Configuration product area

---

**30 rules** from 7 features. 30 rules have explicit invariants.

---

## Uncategorized

### Config Loader

_- Different directories need different taxonomies_

---

#### Config files are discovered by walking up directories

> **Invariant:** The config loader must search for configuration files starting from the current directory and walking up parent directories until a match is found or the filesystem root is reached.
>
> **Rationale:** Projects may run CLI commands from subdirectories — upward traversal ensures the nearest config file is always found regardless of working directory.

**Verified by:**

- Find config file in current directory
- Find config file in parent directory
- Prefer TypeScript config over JavaScript
- Return null when no config file exists

---

#### Config discovery stops at repo root

> **Invariant:** Directory traversal must stop at repository root markers (e.g., .git directory) and not search beyond them.
>
> **Rationale:** Searching beyond the repo root could find unrelated config files from parent projects, producing confusing cross-project behavior.

**Verified by:**

- Stop at .git directory marker

---

#### Config is loaded and validated

> **Invariant:** Loaded config files must have a valid default export matching the expected configuration schema, with appropriate error messages for invalid formats.
>
> **Rationale:** Invalid configurations produce cryptic downstream errors — early validation with clear messages prevents debugging wasted on malformed config.

**Verified by:**

- Load valid config with default fallback
- Load valid minimal config file
- Error on config without default export
- Error on config with wrong type

---

#### Config errors are formatted for display

> **Invariant:** Configuration loading errors must be formatted as human-readable messages including the file path and specific error description.
>
> **Rationale:** Raw error objects are not actionable — developers need the config file path and a clear description to diagnose and fix configuration issues.

**Verified by:**

- Format error with path and message

_config-loader.feature_

### Config Resolution

_- Raw user config is partial with many optional fields_

---

#### Default config provides sensible fallbacks

> **Invariant:** A config created without user input must have isDefault=true and empty source collections.
>
> **Rationale:** Downstream consumers need a safe starting point when no config file exists.

**Verified by:**

- Default config has empty sources and isDefault flag

---

#### Preset creates correct taxonomy instance

> **Invariant:** Each preset must produce a taxonomy with the correct number of categories and tag prefix.
>
> **Rationale:** Presets are the primary user-facing configuration — wrong category counts break downstream scanning.

**Verified by:**

- libar-generic preset creates 3 categories

---

#### Stubs are merged into typescript sources

> **Invariant:** Stub glob patterns must appear in resolved typescript sources alongside original globs.
>
> **Rationale:** Stubs extend the scanner's source set without requiring users to manually list them.

**Verified by:**

- Stubs appended to typescript sources

---

#### Output defaults are applied

> **Invariant:** Missing output configuration must resolve to "docs/architecture" with overwrite=false.
>
> **Rationale:** Consistent defaults prevent accidental overwrites and establish a predictable output location.

**Verified by:**

- Default output directory and overwrite
- Explicit output overrides defaults

---

#### Generator defaults are applied

> **Invariant:** A config with no generators specified must default to the "patterns" generator.
>
> **Rationale:** Patterns is the most commonly needed output — defaulting to it reduces boilerplate.

**Verified by:**

- Generators default to patterns

---

#### Context inference rules are prepended

> **Invariant:** User-defined inference rules must appear before built-in defaults in the resolved array.
>
> **Rationale:** Prepending gives user rules priority during context matching without losing defaults.

**Verified by:**

- User rules prepended to defaults

---

#### Config path is carried from options

> **Invariant:** The configPath from resolution options must be preserved unchanged in resolved config.
>
> **Rationale:** Downstream tools need the original config file location for error reporting and relative path resolution.

**Verified by:**

- configPath carried from resolution options

_config-resolution.feature_

### Configuration API

_- Different projects need different tag prefixes_

---

#### Factory creates configured instances with correct defaults

> **Invariant:** The configuration factory must produce a fully initialized instance for any supported preset, with the libar-generic preset as the default when no arguments are provided.
>
> **Rationale:** A sensible default preset eliminates boilerplate for the common case while still supporting specialized presets (ddd-es-cqrs) for advanced monorepo configurations.

**Verified by:**

- Create with no arguments uses libar-generic preset
- Create with libar-generic preset
- Create with ddd-es-cqrs preset explicitly

---

#### Custom prefix configuration works correctly

> **Invariant:** Custom tag prefix and file opt-in tag overrides must be applied to the configuration instance, replacing the preset defaults.
>
> **Rationale:** Consuming projects may use different annotation prefixes — custom prefixes enable the toolkit to work with any tag convention without forking presets.

**Verified by:**

- Custom tag prefix overrides preset
- Custom file opt-in tag overrides preset
- Both prefix and opt-in tag can be customized together

---

#### Preset categories replace base categories entirely

> **Invariant:** When a preset defines its own category set, it must fully replace (not merge with) the base categories.
>
> **Rationale:** Category sets are curated per-preset — merging would include irrelevant categories (e.g., DDD categories in a generic project) that pollute taxonomy reports.

**Verified by:**

- Libar-generic preset excludes DDD categories

---

#### Regex builders use configured prefix

> **Invariant:** All regex builders (hasFileOptIn, hasDocDirectives, normalizeTag) must use the configured tag prefix, not a hardcoded one.
>
> **Rationale:** Regex patterns that ignore the configured prefix would miss annotations in projects using custom prefixes, silently skipping source files.

**Verified by:**

- hasFileOptIn detects configured opt-in tag
- hasFileOptIn rejects wrong opt-in tag
- hasDocDirectives detects configured prefix
- hasDocDirectives rejects wrong prefix
- normalizeTag removes configured prefix
- normalizeTag handles tag without prefix

_configuration-api.feature_

### Define Config

_- Users need type-safe config authoring without runtime overhead_

---

#### defineConfig is an identity function

> **Invariant:** The defineConfig helper must return its input unchanged, serving only as a type annotation aid for IDE autocomplete.
>
> **Rationale:** defineConfig exists for TypeScript type inference in config files — any transformation would surprise users who expect their config object to pass through unmodified.

**Verified by:**

- defineConfig returns input unchanged

---

#### Schema validates correct configurations

> **Invariant:** Valid configuration objects (both minimal and fully-specified) must pass schema validation without errors.
>
> **Rationale:** The schema must accept all legitimate configuration shapes — rejecting valid configs would block users from using supported features.

**Verified by:**

- Valid minimal config passes validation
- Valid minimal file-opt-in config passes validation
- Valid reference-doc config passes validation
- Valid full config passes validation

---

#### Schema rejects invalid configurations

> **Invariant:** The configuration schema must reject invalid values including empty globs, directory traversal patterns, mutually exclusive options, invalid preset names, removed compatibility aliases, and unknown fields.
>
> **Rationale:** Schema validation is the first line of defense against misconfiguration — permissive validation lets invalid configs produce confusing downstream errors.

**Verified by:**

- Empty glob pattern rejected
- Parent directory traversal rejected in globs
- replaceFeatures and additionalFeatures mutually exclusive
- Invalid preset name rejected
- Legacy preset alias rejected
- Unknown fields rejected in strict mode

---

#### Type guard validates config format

> **Invariant:** The isProjectConfig type guard must correctly identify valid project configs.
>
> **Rationale:** Config loading relies on type detection to apply the correct parsing path.

**Verified by:**

- isProjectConfig returns true for minimal config
- isProjectConfig returns true for file-opt-in-only config
- isProjectConfig returns true for reference-doc config
- isProjectConfig returns false for non-config object

_define-config.feature_

### Preset System

_- New users need sensible defaults for their project type_

---

#### Libar generic preset provides minimal taxonomy with libar prefix

> **Invariant:** The libar-generic preset must provide exactly 3 categories with @architect- prefix.
>
> **Rationale:** This package uses @architect- prefix to avoid collisions with consumer projects' annotations.

**Verified by:**

- Libar generic preset has correct prefix configuration
- Libar generic preset has core categories only

---

#### DDD-ES-CQRS preset provides full taxonomy

> **Invariant:** The DDD preset must provide all 21 categories spanning DDD, ES, CQRS, and infrastructure domains.
>
> **Rationale:** DDD architectures require fine-grained categorization to distinguish bounded contexts, aggregates, and projections.

**Verified by:**

- Full preset has correct prefix configuration
- Full preset has all DDD categories
- Full preset has infrastructure categories
- Full preset has all 21 categories

---

#### Presets can be accessed by name

> **Invariant:** All preset instances must be accessible via the PRESETS map using their canonical string key.
>
> **Rationale:** Programmatic access enables config files to reference presets by name instead of importing instances.

**Verified by:**

- DDD preset accessible via PRESETS map
- Libar generic preset accessible via PRESETS map

_preset-system.feature_

### Project Config Loader

_- Invalid configs must produce actionable error messages_

---

#### Missing config returns defaults

> **Invariant:** When no config file exists, loadProjectConfig must return a default resolved config with isDefault=true.
>
> **Rationale:** Graceful fallback enables zero-config usage — new projects work without requiring config file creation.

**Verified by:**

- No config file returns default resolved config

---

#### New-style config is loaded and resolved

> **Invariant:** A file exporting defineConfig must be loaded, validated, and resolved with correct preset categories.
>
> **Rationale:** defineConfig is the primary config format — correct loading is the critical path for all documentation generation.

**Verified by:**

- defineConfig export loads and resolves correctly

---

#### Invalid configs produce clear errors

> **Invariant:** Config files without a default export or with invalid data must produce descriptive error messages.
>
> **Rationale:** Actionable error messages reduce debugging time — users need to know what to fix, not just that something failed.

**Verified by:**

- Config without default export returns error
- Config with invalid project config returns Zod error

_project-config-loader.feature_

### Source Merging

_- Different generators may need different feature or input sources_

---

#### No override returns base unchanged

> **Invariant:** When no source overrides are provided, the merged result must be identical to the base source configuration.
>
> **Rationale:** The merge function must be safe to call unconditionally — returning modified results without overrides would corrupt default source paths.

**Verified by:**

- No override returns base sources

---

#### Feature overrides control feature source selection

> **Invariant:** additionalFeatures must append to base feature sources while replaceFeatures must completely replace them, and these two options are mutually exclusive.
>
> **Rationale:** Projects need both additive and replacement strategies — additive for extending (monorepo packages), replacement for narrowing (focused generation runs).

**Verified by:**

- additionalFeatures appended to base features
- replaceFeatures replaces base features entirely
- Empty replaceFeatures does NOT replace

---

#### TypeScript source overrides append additional input

> **Invariant:** additionalInput must append to (not replace) the base TypeScript source paths.
>
> **Rationale:** TypeScript sources are always additive — the base sources contain core patterns that must always be included alongside project-specific additions.

**Verified by:**

- additionalInput appended to typescript sources

---

#### Combined overrides apply together

> **Invariant:** Feature overrides and TypeScript overrides must compose independently when both are provided simultaneously.
>
> **Rationale:** Real configs often specify both feature and TypeScript overrides — they must not interfere with each other or produce order-dependent results.

**Verified by:**

- additionalFeatures and additionalInput combined

---

#### Exclude is always inherited from base

> **Invariant:** The exclude patterns must always come from the base configuration, never from overrides.
>
> **Rationale:** Exclude patterns are a safety mechanism — allowing overrides to modify excludes could accidentally include sensitive or generated files in the scan.

**Verified by:**

- Exclude always inherited

_source-merging.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
