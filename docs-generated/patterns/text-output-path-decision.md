# 📋 Text Output Path Decision

**Purpose:** Detailed documentation for the Text Output Path Decision pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |

## Description

**Context:**
  The V1 process-api CLI outputs all results via JSON.stringify(). New context
  assembly commands (context, files, dep-tree, overview) produce human/AI-readable
  structured text, not JSON. Architecture discovery commands (tags, sources,
  unannotated, arch coverage) also benefit from compact text output.

  **Problem:**
  The current output path is: routeSubcommand() returns object, main() calls
  JSON.stringify(result, null, 2). Context bundles are designed as compact
  structured text with === section markers. Wrapping them in JSON adds ~30%
  overhead and makes the output harder for AI agents to consume directly.

  **Decision:**
  Introduce a dual output path in main(). The router return type becomes
  string | object. When the result is a string, main() outputs it directly.
  When it is an object, main() continues with JSON.stringify().

  Additionally, introduce SubcommandContext to replace the narrow
  routeSubcommand(api, cmd, args) signature. New commands need access to
  CLI config (input globs, baseDir) and TagRegistry beyond just the API.

  **Rationale:**
  - Context bundles use === section markers designed for AI parsing.
    JSON wrapping provides no benefit and inflates token count.
  - The string/object distinction is a natural type-level contract:
    commands that produce text return string, commands that produce
    data return object. No runtime flag needed.
  - SubcommandContext avoids threading multiple parameters through
    the router. Coverage and unannotated commands need input globs
    and registry for file discovery and opt-in detection.

  **Consequences:**
  - routeSubcommand() signature changes to accept SubcommandContext
  - main() dispatches on typeof result
  - Future text-output commands follow the same pattern
  - JSON commands continue working unchanged
  - SubcommandContext is a CLI-internal type, not part of the public API

  **Parallel Rendering Path:**
  This decision creates a second rendering path alongside the existing
  Codec/RenderableDocument/UniversalRenderer pipeline. The justification:
  Codecs produce Markdown for human documentation (detailed, structured).
  ContextFormatter produces compact text for AI agent consumption (minimal,
  machine-parseable). Different audiences require different rendering systems.
  Future features needing both formats must implement both paths.

## Dependencies

- Depends on: DataAPIContextAssembly
- Depends on: DataAPIArchitectureQueries

## Acceptance Criteria

**Context command outputs structured text**

- Given the CLI receives "context MyPattern --session design"
- When routeSubcommand returns a string result
- Then main() outputs the string directly to stdout
- And no JSON.stringify wrapping is applied

**Existing JSON commands are unchanged**

- Given the CLI receives "status"
- When routeSubcommand returns an object result
- Then main() outputs JSON.stringify(result, null, 2)
- And the output format matches V1 behavior exactly

**Coverage command accesses CLI config via context**

- Given the SubcommandContext contains api, cliConfig, and registry
- When "arch coverage" handler needs input globs for file discovery
- Then it reads cliConfig.input and cliConfig.baseDir
- And calls findFilesToScan with those parameters

## Business Rules

**Text commands return string from router**

**Invariant:** Commands returning structured text must bypass JSON.stringify.

    **Rationale:** Context bundles use === section markers designed for AI parsing.
    JSON wrapping provides no benefit and inflates token count by ~30%.

_Verified by: Context command outputs structured text, Existing JSON commands are unchanged_

**SubcommandContext replaces narrow router parameters**

**Invariant:** All subcommands receive context via SubcommandContext, not individual parameters.

    **Rationale:** Coverage and unannotated commands need input globs and registry for
    file discovery and opt-in detection. Threading multiple parameters through the router
    creates fragile signatures.

_Verified by: Coverage command accesses CLI config via context_

---

[← Back to Pattern Registry](../PATTERNS.md)
