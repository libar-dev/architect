@libar-docs
@libar-docs-pattern:GherkinPatternsRestructure
@libar-docs-status:completed
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
  replacing the current redirect pointer (line 96) with the actual content. Trim GHERKIN-PATTERNS.md
  from 515 lines to approximately 370 lines, retaining all authoring guide content. Update all
  cross-references between the two files and in INDEX.md to reflect the new locations.

  **Design Finding — Revised Line Target (250 → ~370):**

  | Finding | Impact | Resolution |
  | Original target was ~250 lines | Section audit shows only Step Linting (148 lines) is misplaced | Revised target to ~370 lines |
  | Remaining 366 lines are ALL authoring content | Essential Patterns, Rich Content, Tag Conventions are referenced by CLAUDE.md and SESSION-GUIDES.md | No further trimming — removing would damage the guide |
  | CLAUDE.md overlap is intentional | Testing section (274 lines) covers same rules but for AI debugging context, not tool reference | No CLAUDE.md trim in this phase |

  **Why It Matters:**
  | Benefit | How |
  | Single responsibility | Each doc covers one concern: writing vs. quality tooling |
  | Reduced navigation | Developers find lint rules in VALIDATION.md, not GHERKIN-PATTERNS.md |
  | Accurate cross-refs | VALIDATION.md becomes self-contained for all validation tooling |
  | Smaller writing guide | 370-line doc is easier to scan during authoring sessions |

  **Section Disposition (from design session audit):**

  | Section | Lines | Line Range | Action |
  | Header + intro | 7 | 1-7 | KEEP |
  | Essential Patterns | 144 | 9-152 | KEEP |
  | DataTable and DocString Usage | 50 | 154-203 | KEEP |
  | Tag Conventions | 39 | 205-243 | KEEP |
  | Feature File Rich Content | 99 | 246-344 | KEEP |
  | Step Linting | 148 | 346-493 | MOVE to VALIDATION.md |
  | Quick Reference | 12 | 495-506 | KEEP, remove lint-steps row |
  | Related Documentation | 8 | 508-515 | KEEP, update descriptions |

  **VALIDATION.md Integration Point:**

  Current lint-steps section (lines 76-97) has a redirect pointer at line 96.
  Replace lines 76-98 with: keep intro (76-95), delete redirect (96), insert
  moved content (Feature File Rules, Step Definition Rules, Cross-File Rules,
  CLI Reference from GHERKIN-PATTERNS.md lines 356-492). Result: ~430 lines.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Move Step Linting section (lines 346-493) to VALIDATION.md, replacing redirect at line 96 | complete | docs/VALIDATION.md | No | n/a |
      | Remove Step Linting section from GHERKIN-PATTERNS.md (result: ~370 lines) | complete | docs/GHERKIN-PATTERNS.md | No | n/a |
      | Update cross-references between the two docs | complete | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md | No | n/a |
      | Verify related-documentation tables in both files | complete | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md | No | n/a |
      | Update INDEX.md section tables and line counts for both docs | complete | docs/INDEX.md | No | n/a |
      | Add lint-steps cross-reference row in GHERKIN-PATTERNS.md Quick Reference | complete | docs/GHERKIN-PATTERNS.md | No | n/a |

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
      Then GHERKIN-PATTERNS.md is approximately 370 lines
      And it retains Essential Patterns, DataTable and DocString usage, Tag Conventions, and Rich Content sections
      And its Quick Reference table links to VALIDATION.md for lint-steps
      And its Related Documentation table links to VALIDATION.md for the full lint tool suite

  Rule: INDEX.md reflects current document structure

    **Invariant:** INDEX.md section tables and line counts must be updated when content moves between docs.

    **Rationale:** INDEX.md serves as the navigation hub for all documentation. Stale line counts
    and missing section entries cause developers to land in the wrong part of a document or miss
    content entirely. Both GHERKIN-PATTERNS.md and VALIDATION.md entries must reflect the restructure.

    **Verified by:** INDEX.md entries match post-restructure line counts and sections

    @acceptance-criteria @validation
    Scenario: INDEX.md entries match post-restructure line counts and sections
      Given INDEX.md lists GHERKIN-PATTERNS.md at lines 1-515 and VALIDATION.md at lines 1-281
      When the restructure moves Step Linting content between the two docs
      Then INDEX.md lists GHERKIN-PATTERNS.md at approximately 370 lines
      And INDEX.md lists VALIDATION.md at approximately 430 lines
      And the GHERKIN-PATTERNS.md section table no longer includes Step Linting
      And the VALIDATION.md section table includes Step Linting with rules and examples
