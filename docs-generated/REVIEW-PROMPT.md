# Deep Review Prompt: specs/docs/ Feature Files

**Use this prompt to verify that documentation feature files use annotations instead of hardcoded content.**

---

## Context

The `specs/docs/` directory contains 11 feature files that define auto-generated documentation. These files were created in this PR and need deep review to ensure they follow the code-first principle: **content should be extracted from annotated TypeScript/Gherkin sources, not hardcoded in the feature file**.

### The Problem Pattern

Feature files have **Source Mapping tables** that claim to extract from TypeScript:
```
| Section | Source File | Extraction Method |
| API Types | src/module/types.ts | extract-shapes tag |
```

But if the TypeScript file lacks `@libar-docs-extract-shapes`, the content is actually hardcoded in the feature file's Rule blocks instead of being extracted.

### Files to Review

```
specs/docs/
├── architecture-reference.feature    # Has 4 TypeScript extractions ✓
├── configuration-reference.feature   # Has 5 TypeScript extractions ✓
├── instructions-reference.feature    # Has 5 CLI extractions ✓
├── validation-reference.feature      # Has 4 TypeScript extractions ✓
├── taxonomy-reference.feature        # Has 8 TypeScript extractions ✓
├── process-guard-reference.feature   # Has 4 TypeScript extractions ✓
├── methodology-reference.feature     # Conceptual - manual OK
├── session-guides-reference.feature  # Procedural - manual OK
├── gherkin-patterns-reference.feature # Writing patterns - manual OK
├── publishing-reference.feature      # Workflow - manual OK
└── index-reference.feature           # Navigation - manual OK
```

---

## Review Prompt

```
You are reviewing auto-generated documentation feature files in specs/docs/.

**Your task:** For each feature file, verify that content is properly extracted from
annotated sources rather than hardcoded in the feature file.

**Review Process for Each Feature File:**

1. **Read the Source Mapping table** in the feature description
   - Identify rows with "extract-shapes tag" extraction method
   - These MUST extract from TypeScript, not be hardcoded

2. **For each TypeScript file referenced:**
   - Verify it has @libar-docs-extract-shapes annotation
   - Check the shape list covers the types mentioned in the Source Mapping section name
   - Run: grep "@libar-docs-extract-shapes" [file] to verify

3. **Check for hardcoded content that should be extracted:**
   - TypeScript interfaces/types written directly in Rule blocks
   - Tables that duplicate what's in code (CLI flags, validation rules)
   - Code examples that could use @extract-shapes instead

4. **Verify Rule blocks are appropriate:**
   - Rule blocks should contain: conceptual explanations, decision rationale, tables that summarize behavior
   - Rule blocks should NOT contain: full TypeScript definitions, duplicated code

5. **Run generation and compare:**
   - npx tsx scripts/generate-docs-auto.ts [pattern]
   - Verify generated output contains extracted TypeScript (code blocks with interfaces)
   - If output only has tables/text from Rule blocks, extraction may not be working

**Red Flags to Look For:**

❌ Source Mapping says "extract-shapes tag" but TypeScript file has no annotation
❌ Rule block contains full interface definition that should be extracted
❌ Generated output missing TypeScript code blocks for sections marked as "extract-shapes"
❌ Duplicate content: same table in both feature file and generated TypeScript
❌ CLI flags table hardcoded when CLIConfig interface exists in code

**Green Flags (Correct Patterns):**

✅ TypeScript file has @libar-docs-extract-shapes listing all relevant types
✅ Rule blocks contain conceptual content, not type definitions
✅ Generated output shows actual TypeScript interfaces in code blocks
✅ Feature file references code instead of duplicating it
✅ Conceptual docs (methodology, publishing) have manual Rule blocks (acceptable)

**Verification Commands:**

# Check if TypeScript file has annotation
grep "@libar-docs-extract-shapes" src/path/to/file.ts

# See what exports exist vs what's in annotation
grep "^export" src/path/to/file.ts
grep "@libar-docs-extract-shapes" src/path/to/file.ts

# Generate and check output
npx tsx scripts/generate-docs-auto.ts [filter]
cat docs-generated/docs/[NAME]-REFERENCE.md | grep -A 20 "### [Section]"

# Count extraction coverage
grep -c "THIS DECISION" specs/docs/[name].feature  # Manual content
grep -c "extract-shapes" specs/docs/[name].feature # Extracted content

**Expected Ratios by Document Type:**

| Document Type | Extract % | Manual % | Example |
|---------------|-----------|----------|---------|
| API Reference | 60-80% | 20-40% | architecture, validation |
| CLI Reference | 50-70% | 30-50% | instructions |
| Config Reference | 50-60% | 40-50% | configuration |
| Conceptual | 0-20% | 80-100% | methodology, publishing |

**Report Format:**

For each feature file, report:
1. Source Mapping entries: X total, Y extract-shapes, Z THIS DECISION
2. TypeScript files: all annotated? shape lists complete?
3. Issues found: [list any problems]
4. Recommendations: [what to fix]
```

---

## Quick Verification Script

```bash
#!/bin/bash
# Run from project root

echo "=== Checking annotation coverage in specs/docs/ ==="
for f in specs/docs/*.feature; do
  name=$(basename "$f" .feature)
  this_decision=$(grep -c "THIS DECISION" "$f" 2>/dev/null || echo 0)
  extract=$(grep -c "extract-shapes" "$f" 2>/dev/null || echo 0)
  total=$((this_decision + extract))
  if [ $total -gt 0 ]; then
    pct=$((extract * 100 / total))
    echo "$name: $extract/$total extract-shapes ($pct%)"
  fi
done

echo ""
echo "=== Files with @extract-shapes annotations ==="
grep -rl "@libar-docs-extract-shapes" src/ | wc -l
echo "files annotated"
```

---

## Known Acceptable Manual Content

These feature files are **inherently manual** because they describe concepts/practices, not code:

| File | Why Manual is OK |
|------|------------------|
| methodology-reference.feature | Philosophy - explains "why" not "what" |
| session-guides-reference.feature | Procedural workflows for humans |
| gherkin-patterns-reference.feature | Writing guidance patterns |
| publishing-reference.feature | Release workflow procedures |
| index-reference.feature | Navigation/index tables |

For these, the Rule blocks in the feature file ARE the source of truth. No TypeScript extraction needed.
