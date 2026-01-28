#!/usr/bin/env node
/**
 * CLI entry point for modular-claude-md.
 *
 * @module @libar-dev/modular-claude-md/cli
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Metadata, BuildResult } from "../types.js";
import { loadMetadata, validateMetadata } from "../builder/loader.js";
import { buildVariationContent } from "../builder/renderer.js";
import { countMatchingModules } from "../builder/matcher.js";
import { writeVariationFile, getVariationOutputPath, createBuildResult } from "../utils/writer.js";
import { log, logSection, colors } from "../utils/colors.js";
import {
  generateAllAdditiveLayers,
  getAdditiveLayer,
  generateAdditiveLayer,
} from "../additive/generator.js";
import { writeManifest } from "../additive/manifest.js";
import {
  getModuleLines,
  getModuleHeadings,
  collectAllTags,
  getMatchingModules,
  validateModuleStructure,
  type StructureIssue,
} from "../info/helpers.js";

/** CLI configuration */
export interface CLIConfig {
  command: "build" | "validate" | "additive" | "manifest" | "init" | "info" | "help";
  variation?: string;
  layer?: string;
  preview: boolean;
  baseDir: string;
  projectRoot: string;
  metadataPath: string;
}

const VERSION = "0.1.0";

/**
 * Parse command-line arguments.
 * @internal Exported for testing only
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): CLIConfig {
  const config: CLIConfig = {
    command: "help",
    preview: false,
    baseDir: path.join(process.cwd(), "_claude-md"),
    projectRoot: process.cwd(),
    metadataPath: path.join(process.cwd(), "_claude-md", "metadata.json"),
  };

  for (const arg of argv) {
    if (arg === "build") {
      config.command = "build";
    } else if (arg === "validate") {
      config.command = "validate";
    } else if (arg === "additive") {
      config.command = "additive";
    } else if (arg === "manifest") {
      config.command = "manifest";
    } else if (arg === "init") {
      config.command = "init";
    } else if (arg === "info") {
      config.command = "info";
    } else if (arg === "help" || arg === "--help" || arg === "-h") {
      config.command = "help";
    } else if (arg === "--version" || arg === "-v") {
      console.log(`modular-claude-md v${VERSION}`);
      process.exit(0);
    } else if (arg === "--preview" || arg === "-p") {
      config.preview = true;
    } else if (arg.startsWith("--variation=")) {
      const value = arg.split("=")[1];
      if (value) config.variation = value;
    } else if (arg.startsWith("--layer=")) {
      const value = arg.split("=")[1];
      if (value) config.layer = value;
    } else if (arg.startsWith("--base-dir=")) {
      const value = arg.split("=")[1];
      if (value) {
        config.baseDir = value;
        config.metadataPath = path.join(config.baseDir, "metadata.json");
      }
    } else if (arg.startsWith("--project-root=")) {
      const value = arg.split("=")[1];
      if (value) config.projectRoot = value;
    }
  }

  // If no command specified but args exist, default to build
  if (
    config.command === "help" &&
    argv.length > 0 &&
    !argv.includes("help") &&
    !argv.includes("--help")
  ) {
    config.command = "build";
  }

  return config;
}

/**
 * Show help message.
 */
function showHelp(): void {
  console.log(`
${colors.bright}modular-claude-md${colors.reset} - Modular CLAUDE.md generator v${VERSION}

${colors.cyan}USAGE${colors.reset}
  modular-claude-md <command> [options]

${colors.cyan}COMMANDS${colors.reset}
  build       Build complete CLAUDE.md variations
  validate    Validate configuration and module files
  additive    Generate additive layer files for --add-dir
  manifest    Generate shell manifest for layer aliases
  info        Show information architecture and tag coverage
  init        Initialize _claude-md/ structure
  help        Show this help message

${colors.cyan}OPTIONS${colors.reset}
  --preview, -p          Preview without writing files
  --variation=<name>     Build only the specified variation
  --layer=<name>         Generate only the specified layer
  --base-dir=<path>      Base directory (default: ./_claude-md)
  --project-root=<path>  Project root (default: current directory)
  --version, -v          Show version

${colors.cyan}EXAMPLES${colors.reset}
  modular-claude-md build                    Build all variations
  modular-claude-md build --preview          Preview build output
  modular-claude-md build --variation=default Build specific variation
  modular-claude-md validate                 Validate configuration
  modular-claude-md additive                 Generate all additive layers
  modular-claude-md additive --layer=testing Generate specific layer
  modular-claude-md manifest                 Generate shell manifest
  modular-claude-md info                     Show information architecture

${colors.cyan}ADDITIVE MODE (Claude Code v2.1.20+)${colors.reset}
  Generate layer files for Claude Code's --add-dir feature:

  1. Add additive_variations to metadata.json
  2. Run: modular-claude-md additive
  3. Run: modular-claude-md manifest
  4. Source: source .claude-layers/manifest.sh
  5. Use: claude-<layer-name> or claude-full
`);
}

/**
 * Validate that required paths exist before running commands.
 */
function validatePaths(config: CLIConfig): void {
  if (!fs.existsSync(config.baseDir)) {
    log(`Error: Base directory not found: ${config.baseDir}`, "red");
    log("Use --base-dir to specify the correct path, or run 'init' first", "dim");
    process.exit(1);
  }

  if (!fs.existsSync(config.projectRoot)) {
    log(`Error: Project root not found: ${config.projectRoot}`, "red");
    log("Use --project-root to specify the correct path", "dim");
    process.exit(1);
  }
}

/**
 * Build command - generate complete variations.
 */
function cmdBuild(config: CLIConfig): void {
  validatePaths(config);
  const metadata = loadMetadata(config.metadataPath);

  // Filter variations if specific one requested
  const variations = config.variation
    ? metadata.variations.filter((v) => v.name === config.variation)
    : metadata.variations;

  if (config.variation && variations.length === 0) {
    log(`Error: Unknown variation: ${config.variation}`, "red");
    log(`Available: ${metadata.variations.map((v) => v.name).join(", ")}`, "dim");
    process.exit(1);
  }

  logSection(config.preview ? "Preview Mode" : "Building Variations");

  const results: BuildResult[] = [];

  for (const variation of variations) {
    log(`\n📄 ${variation.name}`, "bright");
    if (variation.description) {
      log(`   ${variation.description}`, "dim");
    }

    const moduleCount = countMatchingModules(metadata.sections, variation.tags);
    log(`   Modules: ${moduleCount} matching [${variation.tags.join(", ")}]`, "dim");

    const content = buildVariationContent(metadata, variation, config.baseDir);
    const outputPath = getVariationOutputPath(variation, config.projectRoot);

    writeVariationFile(outputPath, content, variation.budget_tokens, config.preview);

    results.push(createBuildResult(variation, content, outputPath, variation.budget_tokens));
  }

  logSection("Complete");
  log(
    config.preview
      ? "Run without --preview to write files"
      : `Built ${results.length} variation(s)`,
    "green"
  );
}

/**
 * Validate command - check configuration.
 */
function cmdValidate(config: CLIConfig): void {
  validatePaths(config);
  logSection("Validating Configuration");

  let metadata: Metadata;
  try {
    metadata = loadMetadata(config.metadataPath);
    log("✓ Metadata file loaded successfully", "green");
  } catch (error) {
    log(`✗ ${(error as Error).message}`, "red");
    process.exit(1);
  }

  const result = validateMetadata(metadata, config.baseDir, config.projectRoot);

  // Show errors
  if (result.errors.length > 0) {
    logSection("Errors");
    for (const error of result.errors) {
      log(`  ✗ ${error}`, "red");
    }
  }

  // Show warnings
  if (result.warnings.length > 0) {
    logSection("Warnings");
    for (const warning of result.warnings) {
      log(`  ⚠ ${warning}`, "yellow");
    }
  }

  // Show coverage
  logSection("Variation Coverage");
  for (const variation of metadata.variations) {
    const count = countMatchingModules(metadata.sections, variation.tags);
    log(`  ${variation.name}: ${count} modules [${variation.tags.join(", ")}]`, "dim");
  }

  if (metadata.additive_variations) {
    logSection("Additive Layer Coverage");
    for (const layer of metadata.additive_variations) {
      const count = countMatchingModules(metadata.sections, layer.tags);
      log(`  ${layer.name}: ${count} modules [${layer.tags.join(", ")}]`, "dim");
    }
  }

  logSection("Result");
  if (result.valid) {
    log("✓ Configuration valid", "green");
    process.exit(0);
  } else {
    log("✗ Configuration invalid", "red");
    process.exit(1);
  }
}

/**
 * Additive command - generate layer files.
 */
function cmdAdditive(config: CLIConfig): void {
  validatePaths(config);
  const metadata = loadMetadata(config.metadataPath);

  if (config.layer) {
    // Generate specific layer
    const layer = getAdditiveLayer(metadata, config.layer);
    if (!layer) {
      log(`Error: Unknown additive layer: ${config.layer}`, "red");
      const available = metadata.additive_variations?.map((l) => l.name).join(", ") || "(none)";
      log(`Available: ${available}`, "dim");
      process.exit(1);
    }

    logSection(config.preview ? "Preview Additive Layer" : "Generating Additive Layer");
    log(`\n📄 ${layer.name}`, "bright");
    if (layer.description) {
      log(`   ${layer.description}`, "dim");
    }

    generateAdditiveLayer(metadata, layer, config.baseDir, config.projectRoot, config.preview);
  } else {
    // Generate all layers
    generateAllAdditiveLayers(metadata, config.baseDir, config.projectRoot, config.preview);
  }

  logSection("Complete");
  log(
    config.preview ? "Run without --preview to write files" : "Additive layers generated",
    "green"
  );
}

/**
 * Manifest command - generate shell manifest.
 */
function cmdManifest(config: CLIConfig): void {
  validatePaths(config);
  const metadata = loadMetadata(config.metadataPath);

  logSection(config.preview ? "Preview Manifest" : "Generating Manifest");

  writeManifest(metadata, config.projectRoot, config.preview);

  if (!config.preview) {
    log("\nTo use the manifest:", "cyan");
    log("  source .claude-layers/manifest.sh", "dim");
    log("\nAvailable aliases:", "cyan");
    if (metadata.additive_variations) {
      for (const layer of metadata.additive_variations) {
        log(`  claude-${layer.name}`, "dim");
      }
    }
    log("  claude-full (all layers)", "dim");
  }
}

/**
 * Init command - initialize _claude-md structure.
 */
function cmdInit(config: CLIConfig): void {
  logSection("Initializing _claude-md Structure");

  const claudeMdDir = config.baseDir;

  if (fs.existsSync(claudeMdDir)) {
    log(`Directory already exists: ${claudeMdDir}`, "yellow");
    log("Use existing directory or remove it first.", "dim");
    process.exit(1);
  }

  // Create directory structure
  fs.mkdirSync(path.join(claudeMdDir, "core"), { recursive: true });

  // Create example module
  const exampleModule = `### Example Module

This is an example module. Replace this with your actual content.

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
`;
  fs.writeFileSync(path.join(claudeMdDir, "core", "example.md"), exampleModule);

  // Create metadata.json
  const metadata: Metadata = {
    document: {
      title: "My Project",
      version: "1.0",
      description: "Project instructions for Claude Code",
    },
    preamble: {
      tagline: "Key principles and rules",
      critical_rules: ["Rule 1 - describe your most important rule"],
    },
    sections: [
      {
        title: "Core Concepts",
        tags: ["core-mandatory"],
        subsections: [
          {
            path: "core/example.md",
            tags: ["core-mandatory"],
            description: "Example module - replace with your content",
          },
        ],
      },
    ],
    variations: [
      {
        name: "default",
        path: "/",
        tags: ["core-mandatory"],
        budget_tokens: 8000,
        description: "Default variation for project root",
      },
    ],
  };

  fs.writeFileSync(path.join(claudeMdDir, "metadata.json"), JSON.stringify(metadata, null, 2));

  log(`✓ Created: ${claudeMdDir}/`, "green");
  log(`✓ Created: ${claudeMdDir}/metadata.json`, "green");
  log(`✓ Created: ${claudeMdDir}/core/example.md`, "green");

  logSection("Next Steps");
  log("1. Edit _claude-md/metadata.json to configure your structure", "dim");
  log("2. Add module files in _claude-md/ directories", "dim");
  log("3. Run: modular-claude-md build", "dim");
}

/**
 * Info command - show information architecture.
 */
function cmdInfo(config: CLIConfig): void {
  validatePaths(config);
  const metadata = loadMetadata(config.metadataPath);

  // Collect structure issues while iterating
  const allIssues: StructureIssue[] = [];

  // Section 1: Structure Overview
  logSection("Information Architecture");
  log(`\n${colors.bright}Document:${colors.reset} ${metadata.document.title}`, "reset");
  if (metadata.document.description) {
    log(`${metadata.document.description}`, "dim");
  }

  // Section 2: Content Hierarchy
  logSection("Content Hierarchy");
  let totalLines = 0;
  let totalModules = 0;

  for (const section of metadata.sections) {
    let sectionLines = 0;
    const moduleCount = section.subsections.length;
    totalModules += moduleCount;

    for (const sub of section.subsections) {
      sectionLines += getModuleLines(config.baseDir, sub.path);
    }
    totalLines += sectionLines;

    log(`\n${colors.bright}${section.title}${colors.reset}`, "reset");
    log(`  Tags: ${section.tags.join(", ")}`, "dim");
    log(`  Modules: ${moduleCount} | Lines: ${sectionLines}`, "dim");

    for (const sub of section.subsections) {
      const lines = getModuleLines(config.baseDir, sub.path);
      const fileName = sub.path.split("/").pop() || sub.path;
      const tagStr = sub.tags.filter((t) => !section.tags.includes(t));
      const extraTags = tagStr.length > 0 ? ` [+${tagStr.join(", ")}]` : "";

      // Get headings and validate structure
      const headings = getModuleHeadings(config.baseDir, sub.path);
      const issues = validateModuleStructure(sub.path, headings);
      allIssues.push(...issues);

      // Show module with error indicator if issues found
      const hasErrors = issues.some((i) => i.severity === "error");
      const hasWarnings = issues.some((i) => i.severity === "warning");
      const indicator = hasErrors
        ? `${colors.red}✗${colors.reset} `
        : hasWarnings
          ? `${colors.yellow}⚠${colors.reset} `
          : "";

      log(`    ${indicator}${fileName} (${lines} lines)${extraTags}`, "dim");

      // Show headings within the module
      for (const h of headings) {
        const indent = "      " + "  ".repeat(h.level - 2); // ## = no extra, ### = 2 spaces, #### = 4 spaces
        const levelIndicator = "#".repeat(h.level);
        // Highlight problematic first heading (should be ### = level 3)
        const isProblematic = h === headings[0] && h.level !== 3;
        const headingColor = isProblematic ? colors.red : colors.dim;
        log(`${indent}${headingColor}${levelIndicator}${colors.reset} ${h.text}`, "reset");
      }
    }
  }

  log(
    `\n${colors.cyan}Total: ${totalModules} modules, ${totalLines} lines${colors.reset}`,
    "reset"
  );

  // Section 2.5: Structure Issues
  if (allIssues.length > 0) {
    logSection("Structure Issues");

    const errors = allIssues.filter((i) => i.severity === "error");
    const warnings = allIssues.filter((i) => i.severity === "warning");

    if (errors.length > 0) {
      log(`\n${colors.red}Errors (${errors.length}):${colors.reset}`, "reset");
      for (const issue of errors) {
        log(`  ✗ ${issue.module}: ${issue.details}`, "red");
      }
    }

    if (warnings.length > 0) {
      log(`\n${colors.yellow}Warnings (${warnings.length}):${colors.reset}`, "reset");
      for (const issue of warnings) {
        log(`  ⚠ ${issue.module}: ${issue.details}`, "yellow");
      }
    }

    log(
      `\n${colors.dim}Expected structure: ### (module top-level) → #### (subsection)${colors.reset}`,
      "reset"
    );
    log(
      `${colors.dim}Note: ## is reserved for section headers in the built output${colors.reset}`,
      "reset"
    );
  } else {
    logSection("Structure Validation");
    log("✓ All modules have correct heading structure", "green");
  }

  // Section 3: Tag Coverage Matrix
  logSection("Tag Coverage");
  const allTags = collectAllTags(metadata);

  // Header
  const tagHeader = allTags.map((t) => t.substring(0, 12).padEnd(12)).join(" ");
  log(`\n${"Module".padEnd(30)} ${tagHeader}`, "bright");
  log("-".repeat(30 + allTags.length * 13), "dim");

  // Rows
  for (const section of metadata.sections) {
    for (const sub of section.subsections) {
      const fileName = (sub.path.split("/").pop() || sub.path).substring(0, 28).padEnd(30);
      const tagRow = allTags
        .map((t) => (sub.tags.includes(t) ? "  ✓".padEnd(12) : "".padEnd(12)))
        .join(" ");
      console.log(`${fileName} ${tagRow}`);
    }
  }

  // Section 4: Variations Composition
  logSection("Variations (Complete CLAUDE.md)");
  for (const variation of metadata.variations) {
    const modules = getMatchingModules(metadata, variation.tags);
    let varLines = 0;
    for (const m of modules) {
      varLines += getModuleLines(config.baseDir, m.path);
    }

    log(`\n${colors.bright}${variation.name}${colors.reset} → ${variation.path}`, "reset");
    log(`  Tags: ${variation.tags.join(", ")}`, "dim");
    log(
      `  Modules: ${modules.length} | Lines: ${varLines} | Budget: ${variation.budget_tokens} tokens`,
      "dim"
    );
    if (variation.description) {
      log(`  ${variation.description}`, "dim");
    }
  }

  // Section 5: Additive Layers Composition
  if (metadata.additive_variations && metadata.additive_variations.length > 0) {
    logSection("Additive Layers (--add-dir)");

    // First, get core-mandatory modules for overlap analysis
    const coreModules = new Set<string>();
    for (const v of metadata.variations) {
      const modules = getMatchingModules(metadata, v.tags);
      modules.forEach((m) => coreModules.add(m.path));
    }

    for (const layer of metadata.additive_variations) {
      const modules = getMatchingModules(metadata, layer.tags);
      let layerLines = 0;
      let overlapCount = 0;
      const uniqueModules: string[] = [];

      for (const m of modules) {
        layerLines += getModuleLines(config.baseDir, m.path);
        if (coreModules.has(m.path)) {
          overlapCount++;
        } else {
          uniqueModules.push(m.path);
        }
      }

      log(`\n${colors.bright}${layer.name}${colors.reset} → ${layer.output_dir}`, "reset");
      log(`  Tags: ${layer.tags.join(", ")}`, "dim");
      log(`  Modules: ${modules.length} | Lines: ${layerLines}`, "dim");

      if (overlapCount > 0) {
        log(
          `  ${colors.yellow}Overlap: ${overlapCount} modules already in variations${colors.reset}`,
          "reset"
        );
      }
      if (uniqueModules.length > 0) {
        log(
          `  ${colors.green}Unique: ${uniqueModules.map((p) => p.split("/").pop()).join(", ")}${colors.reset}`,
          "reset"
        );
      } else if (modules.length > 0) {
        log(
          `  ${colors.yellow}⚠ No unique content - all modules overlap with variations${colors.reset}`,
          "reset"
        );
      }
      if (layer.description) {
        log(`  ${layer.description}`, "dim");
      }
    }

    // Section 6: Overlap Analysis Summary
    logSection("Overlap Analysis");
    log("\nModules appearing in multiple targets:", "bright");

    const moduleTargets = new Map<string, string[]>();
    for (const v of metadata.variations) {
      const modules = getMatchingModules(metadata, v.tags);
      for (const m of modules) {
        if (!moduleTargets.has(m.path)) moduleTargets.set(m.path, []);
        moduleTargets.get(m.path)!.push(`var:${v.name}`);
      }
    }
    for (const layer of metadata.additive_variations) {
      const modules = getMatchingModules(metadata, layer.tags);
      for (const m of modules) {
        if (!moduleTargets.has(m.path)) moduleTargets.set(m.path, []);
        moduleTargets.get(m.path)!.push(`layer:${layer.name}`);
      }
    }

    let hasOverlap = false;
    for (const [modulePath, targets] of moduleTargets) {
      if (targets.length > 1) {
        hasOverlap = true;
        const fileName = modulePath.split("/").pop() || modulePath;
        log(`  ${fileName}: ${targets.join(", ")}`, "dim");
      }
    }

    if (!hasOverlap) {
      log("  No overlapping modules found", "green");
    }
  }

  logSection("Complete");
}

/**
 * Main entry point.
 */
function main(): void {
  const config = parseArgs();

  try {
    switch (config.command) {
      case "build":
        cmdBuild(config);
        break;
      case "validate":
        cmdValidate(config);
        break;
      case "additive":
        cmdAdditive(config);
        break;
      case "manifest":
        cmdManifest(config);
        break;
      case "init":
        cmdInit(config);
        break;
      case "info":
        cmdInfo(config);
        break;
      case "help":
      default:
        showHelp();
        break;
    }
  } catch (error) {
    log(`Error: ${(error as Error).message}`, "red");
    process.exit(1);
  }
}

main();
