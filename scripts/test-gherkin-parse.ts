#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { parseFeatureFile } from "../src/scanner/gherkin-ast-parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../..");

async function main() {
  const featureFile = path.join(
    projectRoot,
    "examples/order-management/tests/features/timeline/phase-01-core-infrastructure.feature"
  );
  const content = await fs.readFile(featureFile, "utf-8");

  console.log("Parsing:", featureFile);
  console.log("Content length:", content.length);
  console.log("First 100 chars:", content.substring(0, 100));
  console.log("\n---\n");

  const result = parseFeatureFile(content, featureFile);

  if (!result.ok) {
    console.error("Parse failed:", result.error);
  } else {
    console.log("Parse succeeded!");
    console.log("Feature:", result.value.feature.name);
    console.log("Tags:", result.value.feature.tags);
    console.log("Description length:", result.value.feature.description.length);
    console.log("Scenarios:", result.value.scenarios.length);
  }
}

main().catch(console.error);
