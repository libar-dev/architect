# Configuration Business Rules

**Purpose:** Business rules for the Configuration product area

---

**32 rules** from 7 features. 11 rules have explicit invariants.

---

## Uncategorized

### Config Loader

*- Different directories need different taxonomies*

#### Config files are discovered by walking up directories

_Verified by: Find config file in current directory, Find config file in parent directory, Prefer TypeScript config over JavaScript, Return null when no config file exists_

#### Config discovery stops at repo root

_Verified by: Stop at .git directory marker_

#### Config is loaded and validated

_Verified by: Load valid config with default fallback, Load valid config file, Error on config without default export, Error on config with wrong type_

#### Config errors are formatted for display

_Verified by: Format error with path and message_

*config-loader.feature*

### Config Resolution

*- Raw user config is partial with many optional fields*

#### Default config provides sensible fallbacks

**Invariant:** A config created without user input must have isDefault=true and empty source collections.

**Rationale:** Downstream consumers need a safe starting point when no config file exists.

_Verified by: Default config has empty sources and isDefault flag_

#### Preset creates correct taxonomy instance

**Invariant:** Each preset must produce a taxonomy with the correct number of categories and tag prefix.

**Rationale:** Presets are the primary user-facing configuration — wrong category counts break downstream scanning.

_Verified by: libar-generic preset creates 3 categories_

#### Stubs are merged into typescript sources

**Invariant:** Stub glob patterns must appear in resolved typescript sources alongside original globs.

**Rationale:** Stubs extend the scanner's source set without requiring users to manually list them.

_Verified by: Stubs appended to typescript sources_

#### Output defaults are applied

**Invariant:** Missing output configuration must resolve to "docs/architecture" with overwrite=false.

**Rationale:** Consistent defaults prevent accidental overwrites and establish a predictable output location.

_Verified by: Default output directory and overwrite, Explicit output overrides defaults_

#### Generator defaults are applied

**Invariant:** A config with no generators specified must default to the "patterns" generator.

**Rationale:** Patterns is the most commonly needed output — defaulting to it reduces boilerplate.

_Verified by: Generators default to patterns_

#### Context inference rules are prepended

**Invariant:** User-defined inference rules must appear before built-in defaults in the resolved array.

**Rationale:** Prepending gives user rules priority during context matching without losing defaults.

_Verified by: User rules prepended to defaults_

#### Config path is carried from options

**Invariant:** The configPath from resolution options must be preserved unchanged in resolved config.

**Rationale:** Downstream tools need the original config file location for error reporting and relative path resolution.

_Verified by: configPath carried from resolution options_

*config-resolution.feature*

### Configuration API

*- Different projects need different tag prefixes*

#### Factory creates configured instances with correct defaults

_Verified by: Create with no arguments uses libar-generic preset, Create with generic preset, Create with libar-generic preset, Create with ddd-es-cqrs preset explicitly_

#### Custom prefix configuration works correctly

_Verified by: Custom tag prefix overrides preset, Custom file opt-in tag overrides preset, Both prefix and opt-in tag can be customized together_

#### Preset categories replace base categories entirely

_Verified by: Generic preset excludes DDD categories, Libar-generic preset excludes DDD categories_

#### Regex builders use configured prefix

_Verified by: hasFileOptIn detects configured opt-in tag, hasFileOptIn rejects wrong opt-in tag, hasDocDirectives detects configured prefix, hasDocDirectives rejects wrong prefix, normalizeTag removes configured prefix, normalizeTag handles tag without prefix_

*configuration-api.feature*

### Define Config

*- Users need type-safe config authoring without runtime overhead*

#### defineConfig is an identity function

_Verified by: defineConfig returns input unchanged_

#### Schema validates correct configurations

_Verified by: Valid minimal config passes validation, Valid full config passes validation_

#### Schema rejects invalid configurations

_Verified by: Empty glob pattern rejected, Parent directory traversal rejected in globs, replaceFeatures and additionalFeatures mutually exclusive, Invalid preset name rejected, Unknown fields rejected in strict mode_

#### Type guards distinguish config formats

_Verified by: isProjectConfig returns true for new-style config, isProjectConfig returns false for legacy instance, isLegacyInstance returns true for legacy objects, isLegacyInstance returns false for new-style config_

*define-config.feature*

### Preset System

*- New users need sensible defaults for their project type*

#### Generic preset provides minimal taxonomy

**Invariant:** The generic preset must provide exactly 3 categories (core, api, infra) with @docs- prefix.

**Rationale:** Simple projects need minimal configuration without DDD-specific categories cluttering the taxonomy.

_Verified by: Generic preset has correct prefix configuration, Generic preset has core categories only_

#### Libar generic preset provides minimal taxonomy with libar prefix

**Invariant:** The libar-generic preset must provide exactly 3 categories with @libar-docs- prefix.

**Rationale:** This package uses @libar-docs- prefix to avoid collisions with consumer projects' annotations.

_Verified by: Libar generic preset has correct prefix configuration, Libar generic preset has core categories only_

#### DDD-ES-CQRS preset provides full taxonomy

**Invariant:** The DDD preset must provide all 21 categories spanning DDD, ES, CQRS, and infrastructure domains.

**Rationale:** DDD architectures require fine-grained categorization to distinguish bounded contexts, aggregates, and projections.

_Verified by: Full preset has correct prefix configuration, Full preset has all DDD categories, Full preset has infrastructure categories, Full preset has all 21 categories_

#### Presets can be accessed by name

**Invariant:** All preset instances must be accessible via the PRESETS map using their canonical string key.

**Rationale:** Programmatic access enables config files to reference presets by name instead of importing instances.

_Verified by: Generic preset accessible via PRESETS map, DDD preset accessible via PRESETS map, Libar generic preset accessible via PRESETS map_

*preset-system.feature*

### Project Config Loader

*- Two config formats exist (new-style and legacy) that need unified loading*

#### Missing config returns defaults

_Verified by: No config file returns default resolved config_

#### New-style config is loaded and resolved

_Verified by: defineConfig export loads and resolves correctly_

#### Legacy config is loaded with backward compatibility

_Verified by: Legacy createDeliveryProcess export loads correctly_

#### Invalid configs produce clear errors

_Verified by: Config without default export returns error, Config with invalid project config returns Zod error_

*project-config-loader.feature*

### Source Merging

*- Different generators may need different feature or input sources*

#### No override returns base unchanged

_Verified by: No override returns base sources_

#### Feature overrides control feature source selection

_Verified by: additionalFeatures appended to base features, replaceFeatures replaces base features entirely, Empty replaceFeatures does NOT replace_

#### TypeScript source overrides append additional input

_Verified by: additionalInput appended to typescript sources_

#### Combined overrides apply together

_Verified by: additionalFeatures and additionalInput combined_

#### Exclude is always inherited from base

_Verified by: Exclude always inherited_

*source-merging.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
