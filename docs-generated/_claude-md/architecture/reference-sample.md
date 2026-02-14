# Reference Generation Sample

**Purpose:** Reference document: Reference Generation Sample
**Detail Level:** Compact summary

---

## Text commands return string from router

**Invariant:** Commands returning structured text must bypass JSON.stringify.

---

## SubcommandContext replaces narrow router parameters

**Invariant:** All subcommands receive context via SubcommandContext, not individual parameters.

---

## API Types

| Type | Kind |
| --- | --- |
| RISK_LEVELS | const |
| RiskLevel | type |

---

## Behavior Specifications

### PipelineModule

---
