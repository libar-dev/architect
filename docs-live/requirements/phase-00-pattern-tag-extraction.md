# ✅ Pattern Tag Extraction

**Purpose:** Detailed requirements for the Pattern Tag Extraction feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

The extractPatternTags function parses Gherkin feature tags
into structured metadata objects for pattern processing.

**Problem:**

- Gherkin tags are flat strings needing semantic interpretation
- Multiple tag formats exist: @tag:value, @libar-process-tag:value
- Dependencies and enables can have comma-separated values
- Category tags have no colon and must be distinguished from other tags

**Solution:**

- extractPatternTags parses tag strings into structured metadata
- Normalizes both @tag:value and @libar-process-tag:value formats
- Splits comma-separated values for dependencies and enables
- Filters non-category tags (acceptance-criteria, happy-path, etc.)

## Acceptance Criteria

**Extract pattern name tag**

- Given feature tags containing "pattern:MyPattern"
- When extracting pattern tags
- Then the metadata pattern should be "MyPattern"

**Extract phase number tag**

- Given feature tags containing "phase:15"
- When extracting pattern tags
- Then the metadata phase should be 15

**Extract status roadmap tag**

- Given feature tags containing "status:roadmap"
- When extracting pattern tags
- Then the metadata status should be "roadmap"

**Extract status deferred tag**

- Given feature tags containing "status:deferred"
- When extracting pattern tags
- Then the metadata status should be "deferred"

**Extract status completed tag**

- Given feature tags containing "status:completed"
- When extracting pattern tags
- Then the metadata status should be "completed"

**Extract status active tag**

- Given feature tags containing "status:active"
- When extracting pattern tags
- Then the metadata status should be "active"

**Extract brief path tag**

- Given feature tags containing "brief:docs/pattern-briefs/01-my-pattern.md"
- When extracting pattern tags
- Then the metadata brief should be "docs/pattern-briefs/01-my-pattern.md"

**Extract single dependency**

- Given feature tags containing "depends-on:Pattern1"
- When extracting pattern tags
- Then the metadata dependsOn should contain "Pattern1"

**Extract comma-separated dependencies**

- Given feature tags containing "depends-on:Pattern1" and "depends-on:Pattern2,Pattern3"
- When extracting pattern tags
- Then the metadata dependsOn should contain "Pattern1"
- And the metadata dependsOn should contain "Pattern2"
- And the metadata dependsOn should contain "Pattern3"

**Extract comma-separated enables**

- Given feature tags containing "enables:Pattern1,Pattern2"
- When extracting pattern tags
- Then the metadata enables should contain "Pattern1"
- And the metadata enables should contain "Pattern2"

**Extract category tags (no colon)**

- Given feature tags "ddd", "core", "event-sourcing", and "acceptance-criteria"
- When extracting pattern tags
- Then the metadata categories should contain "ddd"
- And the metadata core flag should be true
- And the metadata categories should contain "event-sourcing"
- And the metadata categories should not contain "acceptance-criteria"

**libar-docs opt-in marker is NOT a category**

- Given feature tags "libar-docs", "ddd", and "core"
- When extracting pattern tags
- Then the metadata categories should contain "ddd"
- And the metadata core flag should be true
- And the metadata categories should not contain "libar-docs"

**Extract all metadata from complex tag list**

- Given a complex tag list with pattern, phase, status, dependencies, enables, brief, and categories
- When extracting pattern tags
- Then the metadata should have pattern equal to "DCB"
- And the metadata should have phase equal to 16
- And the metadata should have status equal to "roadmap"
- And the metadata dependsOn should contain "DeciderTypes"
- And the metadata enables should contain "Reservations"
- And the metadata enables should contain "MultiEntityOps"
- And the metadata should have brief equal to "pattern-briefs/03-dcb.md"
- And the metadata categories should contain "ddd"
- And the metadata core flag should be true

**Empty tag list returns empty metadata**

- Given an empty tag list
- When extracting pattern tags
- Then the metadata should be empty

**Invalid phase number is ignored**

- Given feature tags containing "phase:invalid"
- When extracting pattern tags
- Then the metadata should not have phase

**Extract single convention tag**

- Given feature tags containing "convention:testing-policy"
- When extracting pattern tags
- Then the metadata convention should contain "testing-policy"

**Extract CSV convention tags**

- Given feature tags containing "convention:fsm-rules,testing-policy"
- When extracting pattern tags
- Then the metadata convention should contain "fsm-rules"
- And the metadata convention should contain "testing-policy"

**Convention tag trims whitespace in CSV values**

- Given feature tags containing "convention:fsm-rules, testing-policy , cli-patterns"
- When extracting pattern tags
- Then the metadata convention should contain "fsm-rules"
- And the metadata convention should contain "testing-policy"
- And the metadata convention should contain "cli-patterns"

**Registry-driven enum tag without prior if/else branch**

- Given feature tags containing "adr-theme:persistence"
- When extracting pattern tags
- Then the metadata adrTheme should be "persistence"

**Registry-driven enum rejects invalid value**

- Given feature tags containing "adr-theme:invalid-theme"
- When extracting pattern tags
- Then the metadata should not have adrTheme

**Registry-driven CSV tag accumulates values**

- Given feature tags containing "include:pipeline-overview,codec-transformation"
- When extracting pattern tags
- Then the metadata include should contain "pipeline-overview"
- And the metadata include should contain "codec-transformation"

**Transform applies hyphen-to-space on business value**

- Given feature tags containing "business-value:eliminates-manual-docs"
- When extracting pattern tags
- Then the metadata businessValue should be "eliminates manual docs"

**Transform applies ADR number padding**

- Given feature tags containing "adr:5"
- When extracting pattern tags
- Then the metadata adr should be "005"

**Transform strips quotes from title tag**

- Given feature tags containing "title:'Process Guard Linter'"
- When extracting pattern tags
- Then the metadata title should be "Process Guard Linter"

**Repeatable value tag accumulates multiple occurrences**

- Given feature tags containing "discovered-gap:missing-tests" and "discovered-gap:no-validation"
- When extracting pattern tags
- Then the metadata discoveredGaps should contain "missing tests"
- And the metadata discoveredGaps should contain "no validation"

**CSV with values constraint rejects invalid values**

- Given feature tags containing "convention:testing-policy,nonexistent-value,fsm-rules"
- When extracting pattern tags
- Then the metadata convention should contain "testing-policy"
- And the metadata convention should contain "fsm-rules"
- And the metadata convention should not contain "nonexistent-value"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
