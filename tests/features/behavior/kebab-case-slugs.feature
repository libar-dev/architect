@libar-docs
@libar-docs-pattern:KebabCaseSlugs
@libar-docs-status:roadmap
@libar-docs-phase:44
@libar-docs-product-area:CoreTypes
@libar-docs-include:core-types
@libar-docs-depends-on:StringUtils

Feature: Slug Generation for Progressive Disclosure
  As a documentation generator
  I need to generate readable, URL-safe slugs from pattern names
  So that generated file names are discoverable and human-friendly

  The slug generation must handle:
  - CamelCase patterns like "DeciderPattern" → "decider-pattern"
  - Consecutive uppercase like "APIEndpoint" → "api-endpoint"
  - Numbers in names like "OAuth2Flow" → "o-auth-2-flow"
  - Special characters removal
  - Proper phase prefixing for requirements

  Rule: CamelCase names convert to kebab-case

    **Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase.
    **Rationale:** Generated file names and URL fragments must be human-readable and URL-safe; unsplit CamelCase produces opaque slugs that are difficult to scan in directory listings.
    **Verified by:** Convert pattern names to readable slugs

    Scenario Outline: Convert pattern names to readable slugs
      Given pattern name "<input>"
      When converting to kebab-case slug
      Then the slug is "<expected>"

      Examples:
        | input                          | expected                            |
        | DeciderPattern                 | decider-pattern                     |
        | BddTestingInfrastructure       | bdd-testing-infrastructure          |
        | ReactiveProjectionSharedEvolve | reactive-projection-shared-evolve   |
        | DCB                            | dcb                                 |
        | ProcessGuardLinter             | process-guard-linter                |
        | APIEndpoint                    | api-endpoint                        |
        | OAuth2Flow                     | o-auth-2-flow                       |
        | HTTPServer                     | http-server                         |
        | JSONParser                     | json-parser                         |
        | already-kebab                  | already-kebab                       |

  Rule: Edge cases are handled correctly

    **Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs.
    **Rationale:** Unhandled edge cases produce malformed file names (double hyphens, leading dashes) that break cross-platform path resolution and make generated links inconsistent.
    **Verified by:** Handle edge cases in slug generation

    Scenario Outline: Handle edge cases in slug generation
      Given pattern name "<input>"
      When converting to kebab-case slug
      Then the slug is "<expected>"

      Examples:
        | input            | expected  |
        | Pattern (v2)     | pattern-v-2 |
        | Test__Name       | test-name  |
        | -trimmed-        | trimmed    |
        | ALLCAPS          | allcaps    |
        | XMLHTTPRequest   | xmlhttp-request |

  Rule: Requirements include phase prefix

    **Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned.
    **Rationale:** Phase prefixes enable lexicographic sorting of requirement files by delivery order, so directory listings naturally reflect the roadmap sequence.
    **Verified by:** Requirement slugs include phase number, Requirement without phase uses phase 00

    Scenario Outline: Requirement slugs include phase number
      Given pattern "<pattern>" with phase "<phase>"
      When generating requirement slug
      Then the slug is "<expected>"

      Examples:
        | pattern                  | phase | expected                              |
        | DeciderPattern           | 14    | phase-14-decider-pattern              |
        | BddTestingInfrastructure | 19    | phase-19-bdd-testing-infrastructure   |
        | ProcessGuardLinter       | 7     | phase-07-process-guard-linter         |
        | DCB                      | 15    | phase-15-dcb                          |

    Scenario: Requirement without phase uses phase 00
      Given pattern "SomeUnassigned" without a phase
      When generating requirement slug
      Then the slug is "phase-00-some-unassigned"

  Rule: Phase slugs use kebab-case for names

    **Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided.
    **Rationale:** A consistent "phase-NN-name" format ensures phase files sort numerically and remain identifiable even when the phase number alone would be ambiguous across roadmap versions.
    **Verified by:** Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"

    Scenario Outline: Phase slugs combine number and kebab-case name
      Given phase number "<number>" with name "<name>"
      When generating phase slug
      Then the slug is "<expected>"

      Examples:
        | number | name                     | expected                               |
        | 14     | DeciderPattern           | phase-14-decider-pattern               |
        | 19     | BddTestingInfrastructure | phase-19-bdd-testing-infrastructure    |
        | 7      | ActiveWorkDemo           | phase-07-active-work-demo              |

    Scenario: Phase without name uses "unnamed"
      Given phase number "5" without a name
      When generating phase slug
      Then the slug is "phase-05-unnamed"
