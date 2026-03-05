@libar-docs
@libar-docs-pattern:GherkinPatternsRestructure
@libar-docs-status:roadmap
@libar-docs-phase:41
@libar-docs-effort:0.5d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:single-responsibility-per-doc
@libar-docs-priority:medium
Feature: Gherkin Patterns Guide Restructure

  **Problem:**
  `docs/GHERKIN-PATTERNS.md` is 515 lines and mixes two distinct concerns:
  (a) a writing guide for Gherkin authoring patterns (belongs here), and
  (b) the Step Linting reference — 12 rules, 3 categories, examples, and CLI flags (lines 346–493,
  ~148 lines) — which is quality tooling and belongs in VALIDATION.md alongside lint-patterns,
  lint-process, and validate-patterns.

  The current cross-reference in VALIDATION.md (line 96) already says: "Detailed rules and examples:
  See GHERKIN-PATTERNS.md — Step Linting". This is a forward-reference anti-pattern: the content
  lives in the wrong file and requires a redirect to find it.

  **Solution:**
  Move the Step Linting section (lines 346–493) into VALIDATION.md as a first-class section,
  replacing the current redirect pointer with the actual content. Trim GHERKIN-PATTERNS.md from
  515 lines to approximately 250 lines, retaining only the authoring guide content. Update all
  cross-references between the two files to reflect the new locations.

  **Why It Matters:**
  | Benefit | How |
  | Single responsibility | Each doc covers one concern: writing vs. quality tooling |
  | Reduced navigation | Developers find lint rules in VALIDATION.md, not GHERKIN-PATTERNS.md |
  | Accurate cross-refs | VALIDATION.md becomes self-contained for all validation tooling |
  | Smaller writing guide | 250-line doc is easier to scan during authoring sessions |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Move Step Linting section to VALIDATION.md | pending | docs/VALIDATION.md | No | n/a |
      | Trim GHERKIN-PATTERNS.md to ~250 lines | pending | docs/GHERKIN-PATTERNS.md | No | n/a |
      | Update cross-references between the two docs | pending | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md | No | n/a |
      | Verify related-documentation tables in both files | pending | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md | No | n/a |

  Rule: Step Linting content belongs in VALIDATION.md

    **Invariant:** All validation tooling reference content lives in VALIDATION.md.

    **Rationale:** VALIDATION.md already documents lint-patterns, lint-process, and validate-patterns.
    Step Linting is a fourth quality tool in the same family — it must follow the same pattern.
    Redirecting from VALIDATION.md to GHERKIN-PATTERNS.md for lint rules breaks the principle that
    VALIDATION.md is the single place to find quality tooling documentation.

    **Verified by:** Step Linting section appears in VALIDATION.md after restructure

    @acceptance-criteria @happy-path
    Scenario: Step Linting section appears in VALIDATION.md after restructure
      Given VALIDATION.md currently contains a redirect pointer to GHERKIN-PATTERNS.md for Step Linting rules
      When the restructure is complete
      Then VALIDATION.md contains the full Step Linting section including all 12 rules and the CLI reference
      And the redirect pointer is removed from VALIDATION.md
      And GHERKIN-PATTERNS.md no longer contains the Step Linting section

  Rule: GHERKIN-PATTERNS.md remains the authoring guide

    **Invariant:** GHERKIN-PATTERNS.md covers only Gherkin writing patterns, not tooling reference.

    **Rationale:** The writing guide is useful during spec authoring. Quality tool reference is
    useful during CI setup and debugging. Mixing them forces authors to scroll past 148 lines of
    tooling reference they do not need during writing, and forces CI engineers to look in the
    wrong file for lint rule documentation.

    **Verified by:** Trimmed doc retains all authoring patterns, cross-references updated correctly

    @acceptance-criteria @happy-path
    Scenario: Trimmed doc retains all authoring patterns and cross-references updated correctly
      Given GHERKIN-PATTERNS.md is 515 lines containing authoring patterns and Step Linting content
      When the Step Linting section is moved to VALIDATION.md
      Then GHERKIN-PATTERNS.md is approximately 250 lines
      And it retains all essential patterns section, DataTable and DocString usage, tag conventions, and rich content guidelines
      And its Related Documentation table links to VALIDATION.md for the full lint tool suite
