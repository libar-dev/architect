# ✅ Reference Codec Diagram Testing

**Purpose:** Detailed documentation for the Reference Codec Diagram Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

Scoped diagram generation from diagramScope and diagramScopes config,
  including archContext, include, archLayer, patterns filters, and
  multiple diagram scope composition.

## Acceptance Criteria

**Config with diagramScope produces mermaid block at detailed level**

- Given a reference config with diagramScope archContext "lint"
- And a MasterDataset with arch-annotated patterns in context "lint"
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the document has a heading "Component Overview"

**Neighbor patterns appear in diagram with distinct style**

- Given a reference config with diagramScope archContext "lint"
- And a MasterDataset with arch patterns where lint uses validation
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains "neighbor"
- And the mermaid diagram includes a Related subgraph
- And the mermaid diagram includes dashed neighbor styling

**include filter selects patterns by include tag membership**

- Given a reference config with diagramScope include "pipeline-stages"
- And a MasterDataset with patterns in include "pipeline-stages"
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains "PatternScanner"

**Self-contained scope produces no Related subgraph**

- Given a reference config with diagramScope archContext "lint"
- And a MasterDataset with self-contained lint patterns
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content does not contain "Related"

**Multiple filter dimensions OR together**

- Given a reference config with diagramScope combining archContext and include
- And a MasterDataset where one pattern matches archContext and another matches include
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains both "LintRules" and "DocExtractor"

**Explicit pattern names filter selects named patterns**

- Given a reference config with diagramScope patterns "LintRules"
- And a MasterDataset with multiple arch-annotated patterns
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains "LintRules"
- And the mermaid content does not contain "DocExtractor"

**Config without diagramScope produces no diagram section**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with arch-annotated patterns in context "lint"
- When decoding at detail level "detailed"
- Then the document does not have a heading "Component Overview"

**archLayer filter selects patterns by architectural layer**

- Given a reference config with diagramScope archLayer "domain"
- And a MasterDataset with patterns in domain and infrastructure layers
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains "DomainPattern"
- And the mermaid content does not contain "InfraPattern"

**archLayer and archContext compose via OR**

- Given a reference config with diagramScope archLayer "domain" and archContext "shared"
- And a MasterDataset with a domain-layer pattern and a shared-context pattern
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains both "DomainPattern" and "SharedPattern"

**Summary level omits scoped diagram**

- Given a reference config with diagramScope archContext "lint"
- And a MasterDataset with arch-annotated patterns in context "lint"
- When decoding at detail level "summary"
- Then the document does not contain a mermaid block

**Config with diagramScopes array produces multiple diagrams**

- Given a reference config with two diagramScopes
- And a MasterDataset with patterns in two different include groups
- When decoding at detail level "detailed"
- Then the document contains 2 mermaid blocks
- And the document has headings "Codec Transformation" and "Pipeline Data Flow"

**Diagram direction is reflected in mermaid output**

- Given a reference config with LR direction diagramScope
- And a MasterDataset with patterns in include "pipeline-stages"
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the mermaid content contains "graph LR"

**Legacy diagramScope still works when diagramScopes is absent**

- Given a reference config with diagramScope archContext "lint"
- And a MasterDataset with arch-annotated patterns in context "lint"
- When decoding at detail level "detailed"
- Then the document contains a mermaid block
- And the document has a heading "Component Overview"

## Business Rules

**Scoped diagrams are generated from diagramScope config**

_Verified by: Config with diagramScope produces mermaid block at detailed level, Neighbor patterns appear in diagram with distinct style, include filter selects patterns by include tag membership, Self-contained scope produces no Related subgraph, Multiple filter dimensions OR together, Explicit pattern names filter selects named patterns, Config without diagramScope produces no diagram section, archLayer filter selects patterns by architectural layer, archLayer and archContext compose via OR, Summary level omits scoped diagram_

**Multiple diagram scopes produce multiple mermaid blocks**

_Verified by: Config with diagramScopes array produces multiple diagrams, Diagram direction is reflected in mermaid output, Legacy diagramScope still works when diagramScopes is absent_

---

[← Back to Pattern Registry](../PATTERNS.md)
