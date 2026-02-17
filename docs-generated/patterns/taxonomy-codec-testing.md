# ✅ Taxonomy Codec Testing

**Purpose:** Detailed documentation for the Taxonomy Codec Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

Validates the Taxonomy Codec that transforms MasterDataset into a
  RenderableDocument for tag taxonomy reference documentation (TAXONOMY.md).

## Acceptance Criteria

**Document title is Taxonomy Reference**

- When decoding with default options
- Then document title should be "Taxonomy Reference"

**Document purpose describes tag taxonomy**

- When decoding with default options
- Then document purpose should contain "taxonomy"

**Detail level reflects generateDetailFiles option**

- When decoding with generateDetailFiles disabled
- Then document detailLevel should be "Compact summary"

**Categories section is included in output**

- When decoding with default options
- Then a section with heading "Categories" should exist

**Category table has correct columns**

- When decoding with default options
- Then the Categories section should have a table
- And the table should have columns "Tag", "Domain", "Priority", "Description"

**LinkOut to detail file when generateDetailFiles enabled**

- When decoding with default options
- Then a linkOut to "taxonomy/categories.md" should exist

**With groupByDomain enabled tags are grouped into subsections**

- When decoding with groupByDomain enabled
- Then the Metadata Tags section should have subsection "Core Tags"

**With groupByDomain disabled single table rendered**

- When decoding with groupByDomain disabled
- Then the Metadata Tags section should not have subsection "Core Tags"
- And the Metadata Tags section should have a single table

**Core tags correctly classified**

- Given a tag registry with metadata tags "pattern", "status", "core"
- When decoding with groupByDomain enabled
- Then tags "pattern", "status", "core" should be in domain "Core Tags"

**Relationship tags correctly classified**

- Given a tag registry with metadata tags "uses", "used-by", "depends-on"
- When decoding with groupByDomain enabled
- Then tags "uses", "used-by", "depends-on" should be in domain "Relationship Tags"

**Timeline tags correctly classified**

- Given a tag registry with metadata tags "phase", "quarter", "team"
- When decoding with groupByDomain enabled
- Then tags "phase", "quarter", "team" should be in domain "Timeline Tags"

**ADR prefix matching works**

- Given a tag registry with metadata tags "adr-number", "adr-status"
- When decoding with groupByDomain enabled
- Then tags "adr-number", "adr-status" should be in domain "ADR Tags"

**Unknown tags go to Other Tags group**

- Given a tag registry with metadata tags "custom-tag", "special-marker"
- When decoding with groupByDomain enabled
- Then tags "custom-tag", "special-marker" should be in domain "Other Tags"

**includeFormatTypes disabled excludes Format Types section**

- When decoding with includeFormatTypes disabled
- Then a section with heading "Format Types" should not exist

**includePresets disabled excludes Presets section**

- When decoding with includePresets disabled
- Then a section with heading "Presets" should not exist

**includeArchDiagram disabled excludes Architecture section**

- When decoding with includeArchDiagram disabled
- Then a section with heading "Architecture" should not exist

**generateDetailFiles creates 3 additional files**

- When decoding with default options
- Then additionalFiles should have 3 entries

**Detail files have correct paths**

- When decoding with default options
- Then additionalFiles should contain all taxonomy detail files

**generateDetailFiles disabled creates no additional files**

- When decoding with generateDetailFiles disabled
- Then additionalFiles should have 0 entries

**All 6 format types are documented**

- When decoding with default options
- Then all format types should be documented

## Business Rules

**Document metadata is correctly set**

**Invariant:** The taxonomy document must have the title "Taxonomy Reference", a descriptive purpose string, and a detail level reflecting the generateDetailFiles option.
    **Rationale:** Document metadata drives the table of contents and navigation in generated doc sites — incorrect metadata produces broken links and misleading titles.
    **Verified by:** Document title is Taxonomy Reference, Document purpose describes tag taxonomy, Detail level reflects generateDetailFiles option

_Verified by: Document title is Taxonomy Reference, Document purpose describes tag taxonomy, Detail level reflects generateDetailFiles option_

**Categories section is generated from TagRegistry**

**Invariant:** The categories section must render all categories from the configured TagRegistry as a table, with optional linkOut to detail files when progressive disclosure is enabled.
    **Rationale:** Categories are the primary navigation structure in the taxonomy — missing categories leave developers unable to find the correct annotation tags.
    **Verified by:** Categories section is included in output, Category table has correct columns, LinkOut to detail file when generateDetailFiles enabled

_Verified by: Categories section is included in output, Category table has correct columns, LinkOut to detail file when generateDetailFiles enabled_

**Metadata tags can be grouped by domain**

**Invariant:** When groupByDomain is enabled, metadata tags must be organized into domain-specific subsections; when disabled, a single flat table must be rendered.
    **Rationale:** Domain grouping improves scannability for large tag sets (21 categories in ddd-es-cqrs) while flat mode is simpler for small presets (3 categories in generic).
    **Verified by:** With groupByDomain enabled tags are grouped into subsections, With groupByDomain disabled single table rendered

_Verified by: With groupByDomain enabled tags are grouped into subsections, With groupByDomain disabled single table rendered_

**Tags are classified into domains by hardcoded mapping**

**Invariant:** Tags must be classified into domains (Core, Relationship, Timeline, etc.) using a hardcoded mapping, with unrecognized tags placed in an "Other Tags" group.
    **Rationale:** Domain classification is stable across releases — hardcoding prevents miscategorization from user config errors while the "Other" fallback handles future tag additions gracefully.
    **Verified by:** Core tags correctly classified, Relationship tags correctly classified, Timeline tags correctly classified, ADR prefix matching works, Unknown tags go to Other Tags group

_Verified by: Core tags correctly classified, Relationship tags correctly classified, Timeline tags correctly classified, ADR prefix matching works, Unknown tags go to Other Tags group_

**Optional sections can be disabled via codec options**

**Invariant:** Format Types, Presets, and Architecture sections must each be independently disableable via their respective codec option flags.
    **Rationale:** Not all projects need all sections — disabling irrelevant sections reduces generated document size and prevents confusion from inapplicable content.
    **Verified by:** includeFormatTypes disabled excludes Format Types section, includePresets disabled excludes Presets section, includeArchDiagram disabled excludes Architecture section

_Verified by: includeFormatTypes disabled excludes Format Types section, includePresets disabled excludes Presets section, includeArchDiagram disabled excludes Architecture section_

**Detail files are generated for progressive disclosure**

**Invariant:** When generateDetailFiles is enabled, the codec must produce additional detail files (one per domain group) alongside the main taxonomy document; when disabled, no additional files are created.
    **Rationale:** Progressive disclosure keeps the main document scannable while providing deep-dive content in linked pages — monolithic documents become unwieldy for large tag sets.
    **Verified by:** generateDetailFiles creates 3 additional files, Detail files have correct paths, generateDetailFiles disabled creates no additional files

_Verified by: generateDetailFiles creates 3 additional files, Detail files have correct paths, generateDetailFiles disabled creates no additional files_

**Format types are documented with descriptions and examples**

**Invariant:** All 6 format types must be documented with descriptions and usage examples in the generated taxonomy.
    **Rationale:** Format types control how tag values are parsed — undocumented formats force developers to guess the correct syntax, leading to annotation errors.
    **Verified by:** All 6 format types are documented

_Verified by: All 6 format types are documented_

---

[← Back to Pattern Registry](../PATTERNS.md)
