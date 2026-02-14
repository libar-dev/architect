# ✅ Validation Rules Codec Testing

**Purpose:** Detailed documentation for the Validation Rules Codec Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

Validates the Validation Rules Codec that transforms MasterDataset into a
  RenderableDocument for Process Guard validation rules reference (VALIDATION-RULES.md).

## Acceptance Criteria

**Document title is Validation Rules**

- When decoding with default options
- Then document title should be "Validation Rules"

**Document purpose describes Process Guard**

- When decoding with default options
- Then document purpose should contain "validation"

**Detail level reflects generateDetailFiles option**

- When decoding with generateDetailFiles disabled
- Then document detailLevel should be "Compact summary"

**All 6 rules appear in table**

- When decoding with default options
- Then the Validation Rules section should have a table
- And the table should contain all 6 validation rules

**Rules have correct severity levels**

- When decoding with default options
- Then error rules and warning rules should have correct severity

**Mermaid diagram generated when includeFSMDiagram enabled**

- When decoding with includeFSMDiagram enabled
- Then a mermaid block should exist

**Diagram includes all 4 states**

- When decoding with default options
- Then the mermaid diagram should contain all 4 FSM states

**FSM diagram excluded when includeFSMDiagram disabled**

- When decoding with includeFSMDiagram disabled
- Then a mermaid block should not exist

**Matrix shows all 4 statuses with protection levels**

- When decoding with default options
- Then the Protection Levels section should have a table
- And all protection levels should be correctly documented

**Protection matrix excluded when includeProtectionMatrix disabled**

- When decoding with includeProtectionMatrix disabled
- Then a section with heading "Protection Levels" should not exist

**CLI example code block included**

- When decoding with default options
- Then the CLI Usage section should have a code block

**All 6 CLI options documented**

- When decoding with default options
- Then all CLI options should be documented

**Exit codes documented**

- When decoding with default options
- Then both exit codes should be documented

**CLI section excluded when includeCLIUsage disabled**

- When decoding with includeCLIUsage disabled
- Then a section with heading "CLI Usage" should not exist

**All 3 escape hatches documented**

- When decoding with default options
- Then the Escape Hatches section should have a table
- And all escape hatches should be documented

**Escape hatches section excluded when includeEscapeHatches disabled**

- When decoding with includeEscapeHatches disabled
- Then a section with heading "Escape Hatches" should not exist

## Business Rules

**Document metadata is correctly set**

The validation rules document has standard metadata fields for title,
    purpose, and detail level.

_Verified by: Document title is Validation Rules, Document purpose describes Process Guard, Detail level reflects generateDetailFiles option_

**All validation rules are documented in a table**

The rules table includes all 6 Process Guard validation rules with
    their severity levels and descriptions.

_Verified by: All 6 rules appear in table, Rules have correct severity levels_

**FSM state diagram is generated from transitions**

The Mermaid diagram shows all valid state transitions for the
    Process Guard FSM.

_Verified by: Mermaid diagram generated when includeFSMDiagram enabled, Diagram includes all 4 states, FSM diagram excluded when includeFSMDiagram disabled_

**Protection level matrix shows status protections**

The protection matrix documents which statuses have which protection
    levels (none, scope-locked, hard-locked).

_Verified by: Matrix shows all 4 statuses with protection levels, Protection matrix excluded when includeProtectionMatrix disabled_

**CLI usage is documented with options and exit codes**

The CLI section shows how to invoke the Process Guard linter
    with various options.

_Verified by: CLI example code block included, All 6 CLI options documented, Exit codes documented, CLI section excluded when includeCLIUsage disabled_

**Escape hatches are documented for special cases**

The escape hatches section documents how to override Process Guard
    validation for legitimate use cases.

_Verified by: All 3 escape hatches documented, Escape hatches section excluded when includeEscapeHatches disabled_

---

[← Back to Pattern Registry](../PATTERNS.md)
