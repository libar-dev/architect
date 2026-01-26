#!/usr/bin/env tsx
/**
 * Generate All Documentation Script (Performance Optimized)
 *
 * Runs all RDM codec-based generators in a SINGLE process invocation.
 * This avoids re-scanning and re-extracting patterns 15+ times.
 *
 * Performance improvement: ~10x faster than sequential process spawning
 * - Before: 15 processes x ~3s each = ~45s
 * - After: 1 process x ~5s = ~5s
 */
import * as path from "path";
import { fileURLToPath } from "url";

// Import orchestrator directly to avoid process spawning overhead
import { generateDocumentation } from "../dist/generators/orchestrator.js";

// Import built-in generators to register them
import "../dist/generators/built-in/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

/**
 * All available documentation generators.
 * These are registered by the built-in generators module.
 */
const ALL_GENERATORS = [
  "patterns",
  "roadmap",
  "milestones",
  "current",
  "requirements",
  "session",
  "remaining",
  "planning-checklist",
  "session-plan",
  "session-findings",
  "changelog",
  "traceability",
  "pr-changes",
  "adrs",
  "overview-rdm",
];

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log(`\nGenerating documentation (${ALL_GENERATORS.length} generators)...`);
  console.log(`Package root: ${packageRoot}\n`);

  const result = await generateDocumentation({
    input: ["src/**/*.ts"],
    baseDir: packageRoot,
    outputDir: path.join(packageRoot, "docs-living"),
    tagRegistryPath: null, // Uses built-in TypeScript taxonomy
    features: [
      "tests/features/timeline/*.feature",
      "tests/features/**/*.feature", // For ADRs that scan all features
    ],
    generators: ALL_GENERATORS,
    overwrite: true,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!result.ok) {
    console.error(`\n❌ Generation failed: ${result.error}`);
    process.exit(1);
  }

  const { patterns, files, errors, warnings } = result.value;

  // Summary
  console.log("\n─────────────────────────────────────────────");
  console.log("Generation Summary");
  console.log("─────────────────────────────────────────────");
  console.log(`✅ Patterns extracted: ${patterns.length}`);
  console.log(`✅ Files generated: ${files.filter((f) => f.written).length}`);

  if (files.filter((f) => !f.written).length > 0) {
    console.log(`⏭️  Files skipped: ${files.filter((f) => !f.written).length}`);
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Warnings: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    for (const error of errors) {
      console.error(`   - [${error.type}] ${error.message}`);
    }
  }

  console.log(`\n⏱️  Total time: ${elapsed}s`);
  console.log("─────────────────────────────────────────────\n");

  // Exit with error code if there were errors
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
