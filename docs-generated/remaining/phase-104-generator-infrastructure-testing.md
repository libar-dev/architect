# GeneratorInfrastructureTesting - Remaining Work

**Purpose:** Detailed remaining work for GeneratorInfrastructureTesting

---

## Summary

**Progress:** [░░░░░░░░░░░░░░░░░░░░] 0/1 (0%)

**Remaining:** 1 patterns (0 active, 1 planned)

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Generator Infrastructure Testing | 2d | ensure generator orchestration works correctly |

---

## All Remaining Patterns

### 📋 Generator Infrastructure Testing

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | ensure generator orchestration works correctly |

**Problem:**
  Core generator infrastructure lacks behavior specs:
  - `src/generators/orchestrator.ts` (~420 lines) - Main entry point, untested
  - `src/generators/registry.ts` - Registry pattern, untested
  - `src/generators/codec-based.ts` - Adapter pattern, untested

  These components orchestrate all document generation but have no executable tests.

  **Solution:**
  Create behavior specs for:
  - Orchestrator integration (dual-source merging, error handling)
  - Registry operations (register, get, list)
  - CodecBasedGenerator adapter (delegation, error handling)

  **Business Value:**
  | Benefit | How |
  | Pipeline Reliability | Generation orchestration works correctly |
  | Error Visibility | Failures produce clear error messages |
  | Extension Safety | New generators integrate correctly |

#### Acceptance Criteria

**Orchestrator merges TypeScript and Gherkin patterns**

- Given TypeScript files with 5 patterns
- And feature files with 3 patterns (2 overlap)
- When generateDocumentation is called
- Then merged dataset has 6 unique patterns
- And overlapping patterns have combined metadata

**Orchestrator detects pattern name conflicts**

- Given TypeScript pattern "MyFeature" with status "completed"
- And Gherkin pattern "MyFeature" with status "roadmap"
- When generateDocumentation is called
- Then conflict is reported for "MyFeature"
- And generation continues with warning

**Orchestrator generates requested document types**

- Given source files with pattern metadata
- When generateDocumentation with generators ["patterns", "roadmap"]
- Then PATTERNS.md and ROADMAP.md are generated
- And other document types are not generated

**Unknown generator name fails gracefully**

- When generateDocumentation with generators ["invalid-gen"]
- Then error is returned
- And available generators are listed

**Partial success when some generators fail**

- Given source files with pattern metadata
- And one generator has internal error
- When generateDocumentation is called
- Then successful generators produce output
- And failed generator is reported with error

**Register generator with unique name**

- Given empty registry
- When registering generator "my-generator"
- Then registration succeeds
- And registry has generator "my-generator"

**Duplicate registration throws error**

- Given registry with generator "patterns"
- When registering generator "patterns" again
- Then error is thrown
- And error message contains "already registered"

**Get registered generator**

- Given registry with generators ["patterns", "roadmap"]
- When getting generator "patterns"
- Then generator is returned
- And generator name is "patterns"

**Get unknown generator returns undefined**

- Given registry with generators ["patterns"]
- When getting generator "unknown"
- Then undefined is returned

**Available returns sorted list**

- Given registry with generators ["roadmap", "patterns", "changelog"]
- When calling available()
- Then list is ["changelog", "patterns", "roadmap"]

**Generator delegates to codec**

- Given CodecBasedGenerator wrapping PatternsDocumentCodec
- And context with MasterDataset
- When generator.generate() is called
- Then codec.decode() is invoked with dataset
- And RenderableDocument is returned

**Missing MasterDataset returns error**

- Given CodecBasedGenerator for patterns
- And context WITHOUT MasterDataset
- When generator.generate() is called
- Then error file is returned
- And error message indicates missing dataset

**Codec options are passed through**

- Given CodecBasedGenerator with codecOptions
- And context with MasterDataset
- When generator.generate() is called
- Then codec receives codecOptions

**PR changes filters to git diff base**

- Given source files with patterns
- And gitDiffBase is "main"
- When generating pr-changes
- Then only patterns changed since main are included

**PR changes filters to explicit file list**

- Given source files with 10 patterns
- And changedFiles lists 3 feature files
- When generating pr-changes
- Then only patterns from those 3 files are included

**PR changes filters by release version**

- Given patterns with releases v0.1.0, v0.2.0, unreleased
- And releaseFilter is "v0.2.0"
- When generating pr-changes
- Then only v0.2.0 patterns are included

#### Business Rules

**Orchestrator coordinates full documentation generation pipeline**

**Invariant:** Orchestrator merges TypeScript and Gherkin patterns,
    handles conflicts, and produces requested document types.

    **API:** See `src/generators/orchestrator.ts`

    **Verified by:** Dual-source merging, Conflict detection, Generator selection

_Verified by: Orchestrator merges TypeScript and Gherkin patterns, Orchestrator detects pattern name conflicts, Orchestrator generates requested document types, Unknown generator name fails gracefully, Partial success when some generators fail_

**Registry manages generator registration and retrieval**

**Invariant:** Registry prevents duplicate names, returns undefined for
    unknown generators, and lists available generators alphabetically.

    **API:** See `src/generators/registry.ts`

    **Verified by:** Registration, Retrieval, Listing

_Verified by: Register generator with unique name, Duplicate registration throws error, Get registered generator, Get unknown generator returns undefined, Available returns sorted list_

**CodecBasedGenerator adapts codecs to generator interface**

**Invariant:** Generator delegates to underlying codec for transformation.
    Missing MasterDataset produces descriptive error.

    **API:** See `src/generators/codec-based.ts`

    **Verified by:** Delegation, Error handling

_Verified by: Generator delegates to codec, Missing MasterDataset returns error, Codec options are passed through_

**Orchestrator supports PR changes generation options**

**Invariant:** PR changes can filter by git diff, changed files, or release version.

    **API:** See `src/generators/orchestrator.ts` prChangesOptions

    **Verified by:** Git diff filtering, Changed files filtering, Release filtering

_Verified by: PR changes filters to git diff base, PR changes filters to explicit file list, PR changes filters by release version_

---

[← Back to Remaining Work](../REMAINING-WORK.md)
