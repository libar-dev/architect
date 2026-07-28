# architect-cli Business Rules

## Overview

Structured business-rule catalog with 2 rules.

## Rules

| Feature                             | Rule Name                                          | Invariant                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CliCommandResolutionExecutableTests | Known command names dispatch to their handler      | Every name in the command table resolves to exactly one handler. Unknown names produce a non-zero exit and a diagnostic naming the unrecognized command on stderr.                                  |
| CliFlagParsingExecutableTests       | Flags are parsed and validated at the CLI boundary | Flag values are validated through a strict schema at the boundary. A flag missing its required value, and an unknown flag on the dangling gate, exit non-zero with a diagnostic naming the problem. |

---

[← Back to Business Rules](../BUSINESS-RULES.md)
