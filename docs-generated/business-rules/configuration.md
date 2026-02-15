# Configuration Business Rules

**Purpose:** Business rules for the Configuration product area

---

**32 rules** from 7 features. 15 rules have explicit invariants.

---

## Uncategorized

### Config Loader

*- Different directories need different taxonomies*

---

#### Config files are discovered by walking up directories

**Verified by:**
- Find config file in current directory
- Find config file in parent directory
- Prefer TypeScript config over JavaScript
- Return null when no config file exists

---

#### Config discovery stops at repo root

**Verified by:**
- Stop at .git directory marker

---

#### Config is loaded and validated

**Verified by:**
- Load valid config with default fallback
- Load valid config file
- Error on config without default export
- Error on config with wrong type

---

#### Config errors are formatted for display

**Verified by:**
- Format error with path and message

*config-loader.feature*

### Config Resolution

*- Raw user config is partial with many optional fields*

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

*config-resolution.feature*

### Configuration API

*- Different projects need different tag prefixes*

---

#### Factory creates configured instances with correct defaults

**Verified by:**
- Create with no arguments uses libar-generic preset
- Create with generic preset
- Create with libar-generic preset
- Create with ddd-es-cqrs preset explicitly

---

#### Custom prefix configuration works correctly

**Verified by:**
- Custom tag prefix overrides preset
- Custom file opt-in tag overrides preset
- Both prefix and opt-in tag can be customized together

---

#### Preset categories replace base categories entirely

**Verified by:**
- Generic preset excludes DDD categories
- Libar-generic preset excludes DDD categories

---

#### Regex builders use configured prefix

**Verified by:**
- hasFileOptIn detects configured opt-in tag
- hasFileOptIn rejects wrong opt-in tag
- hasDocDirectives detects configured prefix
- hasDocDirectives rejects wrong prefix
- normalizeTag removes configured prefix
- normalizeTag handles tag without prefix

*configuration-api.feature*

### Define Config

*- Users need type-safe config authoring without runtime overhead*

---

#### defineConfig is an identity function

**Verified by:**
- defineConfig returns input unchanged

---

#### Schema validates correct configurations

**Verified by:**
- Valid minimal config passes validation
- Valid full config passes validation

---

#### Schema rejects invalid configurations

**Verified by:**
- Empty glob pattern rejected
- Parent directory traversal rejected in globs
- replaceFeatures and additionalFeatures mutually exclusive
- Invalid preset name rejected
- Unknown fields rejected in strict mode

---

#### Type guards distinguish config formats

**Verified by:**
- isProjectConfig returns true for new-style config
- isProjectConfig returns false for legacy instance
- isLegacyInstance returns true for legacy objects
- isLegacyInstance returns false for new-style config

*define-config.feature*

### Preset System

*- New users need sensible defaults for their project type*

---

#### Generic preset provides minimal taxonomy

> **Invariant:** The generic preset must provide exactly 3 categories (core, api, infra) with @docs- prefix.
>
> **Rationale:** Simple projects need minimal configuration without DDD-specific categories cluttering the taxonomy.

**Verified by:**
- Generic preset has correct prefix configuration
- Generic preset has core categories only

---

#### Libar generic preset provides minimal taxonomy with libar prefix

> **Invariant:** The libar-generic preset must provide exactly 3 categories with @libar-docs- prefix.
>
> **Rationale:** This package uses @libar-docs- prefix to avoid collisions with consumer projects' annotations.

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
- Generic preset accessible via PRESETS map
- DDD preset accessible via PRESETS map
- Libar generic preset accessible via PRESETS map

*preset-system.feature*

### Project Config Loader

*- Two config formats exist (new-style and legacy) that need unified loading*

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

#### Legacy config is loaded with backward compatibility

> **Invariant:** A file exporting createDeliveryProcess must be loaded and produce a valid resolved config.
>
> **Rationale:** Backward compatibility prevents breaking existing consumers during migration to the new config format.

**Verified by:**
- Legacy createDeliveryProcess export loads correctly

---

#### Invalid configs produce clear errors

> **Invariant:** Config files without a default export or with invalid data must produce descriptive error messages.
>
> **Rationale:** Actionable error messages reduce debugging time — users need to know what to fix, not just that something failed.

**Verified by:**
- Config without default export returns error
- Config with invalid project config returns Zod error

*project-config-loader.feature*

### Source Merging

*- Different generators may need different feature or input sources*

---

#### No override returns base unchanged

**Verified by:**
- No override returns base sources

---

#### Feature overrides control feature source selection

**Verified by:**
- additionalFeatures appended to base features
- replaceFeatures replaces base features entirely
- Empty replaceFeatures does NOT replace

---

#### TypeScript source overrides append additional input

**Verified by:**
- additionalInput appended to typescript sources

---

#### Combined overrides apply together

**Verified by:**
- additionalFeatures and additionalInput combined

---

#### Exclude is always inherited from base

**Verified by:**
- Exclude always inherited

*source-merging.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
