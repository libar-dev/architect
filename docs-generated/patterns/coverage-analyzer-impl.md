# 🚧 Coverage Analyzer Impl

**Purpose:** Detailed documentation for the Coverage Analyzer Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Pattern |

## Description

Reports annotation completeness by comparing scannable files (from glob)
against annotated patterns in MasterDataset. Uses independent glob via
findFilesToScan() — cheap (~1ms) and avoids changing buildPipeline().

---

[← Back to Pattern Registry](../PATTERNS.md)
