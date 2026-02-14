# ✅ Convention Extractor Testing

**Purpose:** Detailed requirements for the Convention Extractor Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

Extracts convention content from MasterDataset decision records
  tagged with @libar-docs-convention. Produces structured ConventionBundles
  with rule content, tables, and invariant/rationale metadata.

## Acceptance Criteria

**Empty convention tags returns empty array**

- Given an empty MasterDataset
- When extracting conventions for no tags
- Then the convention result is empty

**No matching patterns returns empty array**

- Given a MasterDataset with patterns but no convention tags
- When extracting conventions for tag "fsm-rules"
- Then the convention result is empty

**Single pattern with one convention tag produces one bundle**

- Given a pattern tagged with convention "testing-policy"
- When extracting conventions for tag "testing-policy"
- Then 1 convention bundle is returned
- And the bundle convention tag is "testing-policy"
- And the bundle has 1 rule

**Pattern with CSV conventions contributes to multiple bundles**

- Given a pattern tagged with conventions "fsm-rules" and "testing-policy"
- When extracting conventions for tags "fsm-rules" and "testing-policy"
- Then 2 convention bundles are returned

**Multiple patterns with same convention merge into one bundle**

- Given a pattern "ADR006" tagged with convention "fsm-rules" with rule "Transitions"
- And a pattern "ADR009" tagged with convention "fsm-rules" with rule "Protection"
- When extracting conventions for tag "fsm-rules"
- Then 1 convention bundle is returned
- And the bundle has 2 source decisions
- And the bundle has 2 rules

**Invariant and rationale are extracted from rule description**

- Given a pattern with convention "fsm-rules" and rule description:
- When extracting conventions for tag "fsm-rules"
- Then the first rule has invariant "Only valid FSM transitions are allowed."
- And the first rule has rationale "Prevents accidental state corruption."

```markdown
**Invariant:** Only valid FSM transitions are allowed.

**Rationale:** Prevents accidental state corruption.

**Verified by:** Transition validation, State protection
```

**Tables in rule descriptions are extracted as structured data**

- Given a pattern with convention "fsm-rules" and rule description:
- When extracting conventions for tag "fsm-rules"
- Then the first rule has 1 table
- And the table has 3 data rows

```markdown
**Invariant:** Each status has a protection level.

| Status | Protection |
| --- | --- |
| roadmap | None |
| active | Scope-locked |
| completed | Hard-locked |
```

**Mermaid diagram in rule description is extracted as code example**

- Given a convention pattern with a mermaid diagram in tag "fsm-rules"
- When extracting conventions for tag "fsm-rules"
- Then the first rule has 1 code example
- And the code example has language "mermaid"

**Rule description without code examples has no code examples field**

- Given a pattern with convention "fsm-rules" and rule description:
- When extracting conventions for tag "fsm-rules"
- Then the first rule has no code examples

```markdown
**Invariant:** Only valid transitions allowed.

Plain narrative text without any diagrams.
```

**TypeScript pattern with heading sections produces multiple rules**

- Given a TypeScript pattern with convention "fsm-rules" and heading sections
- When extracting conventions for tag "fsm-rules"
- Then 1 convention bundle is returned
- And the bundle has 2 rules
- And the first rule name is "Valid State Transitions"
- And the first rule has invariant "Only defined FSM transitions are allowed."
- And the second rule name is "Terminal States Are Immutable"

**TypeScript pattern without headings becomes single rule**

- Given a TypeScript pattern "FsmRules" with convention "fsm-rules" and description:
- When extracting conventions for tag "fsm-rules"
- Then 1 convention bundle is returned
- And the bundle has 1 rule
- And the first rule name is "FsmRules"
- And the first rule has invariant "Only valid transitions are allowed."

```markdown
**Invariant:** Only valid transitions are allowed.
**Rationale:** Prevents accidental state corruption.
```

**TypeScript and Gherkin conventions merge in same bundle**

- Given a pattern "ADR006" tagged with convention "fsm-rules" with rule "Protection Levels"
- And a TypeScript pattern "TsConventions" with convention "fsm-rules" and description:
- When extracting conventions for tag "fsm-rules"
- Then 1 convention bundle is returned
- And the bundle has 2 source decisions
- And the bundle has 2 rules

```markdown
## Transition Rules
**Invariant:** Only valid FSM transitions are allowed.
```

**TypeScript pattern with convention but empty description**

- Given a TypeScript pattern with convention "fsm-rules" and empty description
- When extracting conventions for tag "fsm-rules"
- Then the convention result is empty

**TypeScript description with tables is extracted correctly**

- Given a TypeScript pattern with convention "fsm-rules" and table description
- When extracting conventions for tag "fsm-rules"
- Then the first rule has 1 table
- And the table has 2 data rows

**TypeScript description with code examples**

- Given a TypeScript pattern with convention "fsm-rules" and mermaid description
- When extracting conventions for tag "fsm-rules"
- Then the first rule has 1 code example
- And the code example has language "mermaid"

## Business Rules

**Empty and missing inputs produce empty results**

_Verified by: Empty convention tags returns empty array, No matching patterns returns empty array_

**Convention bundles are extracted from matching patterns**

_Verified by: Single pattern with one convention tag produces one bundle, Pattern with CSV conventions contributes to multiple bundles, Multiple patterns with same convention merge into one bundle_

**Structured content is extracted from rule descriptions**

_Verified by: Invariant and rationale are extracted from rule description, Tables in rule descriptions are extracted as structured data_

**Code examples in rule descriptions are preserved**

_Verified by: Mermaid diagram in rule description is extracted as code example, Rule description without code examples has no code examples field_

**TypeScript JSDoc conventions are extracted alongside Gherkin**

_Verified by: TypeScript pattern with heading sections produces multiple rules, TypeScript pattern without headings becomes single rule, TypeScript and Gherkin conventions merge in same bundle, TypeScript pattern with convention but empty description, TypeScript description with tables is extracted correctly, TypeScript description with code examples_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
