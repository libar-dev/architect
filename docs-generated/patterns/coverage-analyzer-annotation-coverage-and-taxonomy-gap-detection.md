# 📋 CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection

**Purpose:** Detailed documentation for the CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Reports annotation completeness by comparing scannable files (from glob)
against annotated patterns in MasterDataset. Also detects unused taxonomy
values defined in TagRegistry but never applied.

### Coverage Data Access Strategy (DS-D-1)

Uses independent glob via findFilesToScan() from src/scanner/pattern-scanner.ts.
Re-running a glob is cheap (~1ms) and avoids changing buildPipeline() to
thread scan results. The coverage analyzer receives CLI config (input globs,
baseDir) and TagRegistry via SubcommandContext.

findUnannotatedFiles() also reads file content to check hasFileOptIn() —
this is a fast regex check, not AST parsing.

### What Counts as "Scannable"

- TypeScript files matching input globs (e.g., src/**\/*.ts)
- Excluding: node_modules, dist, test files, declaration files
- Same exclusion rules as the scanner: findFilesToScan() defaults

Target: src/api/coverage-analyzer.ts
See: DataAPIArchitectureQueries spec, Rule 2 (Architecture Coverage)
Since: DS-D

---

[← Back to Pattern Registry](../PATTERNS.md)
