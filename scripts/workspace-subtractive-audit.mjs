#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const WORKSPACE_CODE_DIRS = ['packages', 'scripts', 'tests'];
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const DELETION_MARKER_PATTERN = new RegExp(
  ['deletion target', ['kept for', 'compat'].join(' '), 'TODO remove', '// removed', 'legacy'].join(
    '|',
  ),
  'iu',
);
const PROPERTY_NAME_EVASION_PATTERN = /['"][A-Za-z0-9_$-]+['"]\s*\+\s*['"][A-Za-z0-9_$-]+['"]/u;

async function main() {
  const packageDirs = await listPackageDirs();
  const publicEntryFiles = await collectPublicEntryFiles(packageDirs);
  const workspaceFiles = await collectWorkspaceFiles(WORKSPACE_CODE_DIRS);
  const fileContents = await loadFileContents(workspaceFiles);

  const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    ruleFamilies: {
      zeroConsumerPublicExports: await auditZeroConsumerPublicExports(
        publicEntryFiles,
        workspaceFiles,
        fileContents,
      ),
      pureConstAliases: auditPureConstAliases(workspaceFiles, fileContents),
      pureTypeAliases: auditPureTypeAliases(workspaceFiles, fileContents),
      runtimePropertyNameEvasionStrips: auditRuntimePropertyNameEvasionStrips(
        workspaceFiles,
        fileContents,
      ),
      staleDeletionTargetMarkers: auditStaleDeletionTargetMarkers(workspaceFiles, fileContents),
      dogfoodFilesReachableFromPublicExports: await auditDogfoodReachability(publicEntryFiles),
      handwrittenInterfacesShadowingZodInfer: auditInterfaceShadows(workspaceFiles, fileContents),
    },
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (process.argv.includes('--strict')) {
    const totalFindings = Object.values(summary.ruleFamilies).reduce(
      (count, family) => count + family.count,
      0,
    );
    if (totalFindings > 0) {
      process.exitCode = 1;
    }
  }
}

async function listPackageDirs() {
  const packagesRoot = path.join(ROOT, 'packages');
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(packagesRoot, entry.name));
}

async function collectPublicEntryFiles(packageDirs) {
  const publicEntries = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    } catch {
      continue;
    }

    if (packageJson.exports === undefined || packageJson.name === '@libar-dev/architect') {
      continue;
    }

    const packageName = packageJson.name;
    for (const [subpath, exportEntry] of Object.entries(packageJson.exports)) {
      const resolvedPath = resolvePackageExportToSource(packageDir, exportEntry);
      if (resolvedPath === null) {
        continue;
      }

      publicEntries.push({
        packageDir,
        packageName,
        subpath,
        sourceFile: resolvedPath,
      });
    }
  }

  return publicEntries;
}

function resolvePackageExportToSource(packageDir, exportEntry) {
  const exportPath =
    typeof exportEntry === 'string'
      ? exportEntry
      : exportEntry !== null && typeof exportEntry === 'object'
        ? exportEntry.import ?? exportEntry.types
        : null;

  if (typeof exportPath !== 'string' || exportPath.startsWith('./bin/') || exportPath === './package.json') {
    return null;
  }

  if (exportPath.startsWith('./dist/')) {
    return path.join(packageDir, exportPath.replace('./dist/', 'src/').replace(/\.d\.ts$/u, '.ts').replace(/\.js$/u, '.ts'));
  }

  return path.join(packageDir, exportPath.replace(/^\.\//u, '').replace(/\.d\.ts$/u, '.ts').replace(/\.js$/u, '.ts'));
}

async function collectWorkspaceFiles(roots) {
  const files = [];

  for (const relativeRoot of roots) {
    files.push(...(await walk(path.join(ROOT, relativeRoot))));
  }

  return files.sort();
}

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
      continue;
    }
    if (entry.isFile() && TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function loadFileContents(files) {
  const entries = await Promise.all(
    files.map(async (filePath) => [filePath, await readFile(filePath, 'utf8')]),
  );
  return new Map(entries);
}

async function auditZeroConsumerPublicExports(publicEntryFiles, workspaceFiles, fileContents) {
  const entryFilesByPackage = new Map();
  for (const entry of publicEntryFiles) {
    const packageEntries = entryFilesByPackage.get(entry.packageName) ?? new Set();
    packageEntries.add(entry.sourceFile);
    entryFilesByPackage.set(entry.packageName, packageEntries);
  }

  const findings = [];
  for (const entry of publicEntryFiles) {
    const sourceText = fileContents.get(entry.sourceFile);
    if (sourceText === undefined) {
      findings.push({
        packageName: entry.packageName,
        subpath: entry.subpath,
        symbol: '(missing-source-file)',
        sourceFile: relative(entry.sourceFile),
        consumerCount: 0,
      });
      continue;
    }

    const exportedSymbols = collectExplicitlyExportedSymbols(entry.sourceFile, sourceText);
    const excludedFiles = entryFilesByPackage.get(entry.packageName) ?? new Set();

    for (const symbol of exportedSymbols) {
      const consumerCount = countWorkspaceSymbolConsumers(symbol, workspaceFiles, fileContents, excludedFiles);
      if (consumerCount === 0) {
        findings.push({
          packageName: entry.packageName,
          subpath: entry.subpath,
          symbol,
          sourceFile: relative(entry.sourceFile),
          consumerCount,
        });
      }
    }
  }

  return makeRuleFamily('Zero-consumer public exports', findings);
}

function collectExplicitlyExportedSymbols(filePath, sourceText) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const names = new Set();

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
      continue;
    }

    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) {
      if (statement.name !== undefined) {
        names.add(statement.name.text);
      }
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.add(declaration.name.text);
        }
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        names.add(element.name.text);
      }
    }
  }

  return [...names].sort();
}

function countWorkspaceSymbolConsumers(symbol, workspaceFiles, fileContents, excludedFiles) {
  const pattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, 'u');
  let count = 0;

  for (const filePath of workspaceFiles) {
    if (excludedFiles.has(filePath)) {
      continue;
    }
    const sourceText = fileContents.get(filePath);
    if (sourceText !== undefined && pattern.test(sourceText)) {
      count += 1;
    }
  }

  return count;
}

function auditPureConstAliases(workspaceFiles, fileContents) {
  const findings = [];
  for (const filePath of workspaceFiles) {
    const sourceText = fileContents.get(filePath);
    if (sourceText === undefined) {
      continue;
    }
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
        continue;
      }
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) {
          continue;
        }
        if (ts.isIdentifier(declaration.initializer)) {
          findings.push({
            file: relative(filePath),
            name: declaration.name.text,
            target: declaration.initializer.text,
          });
        }
      }
    }
  }

  return makeRuleFamily('Pure export const aliases', findings);
}

function auditPureTypeAliases(workspaceFiles, fileContents) {
  const findings = [];
  for (const filePath of workspaceFiles) {
    const sourceText = fileContents.get(filePath);
    if (sourceText === undefined) {
      continue;
    }
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of sourceFile.statements) {
      if (!ts.isTypeAliasDeclaration(statement) || !hasExportModifier(statement)) {
        continue;
      }
      if (ts.isTypeReferenceNode(statement.type) && ts.isIdentifier(statement.type.typeName)) {
        findings.push({
          file: relative(filePath),
          name: statement.name.text,
          target: statement.type.typeName.text,
        });
      }
    }
  }

  return makeRuleFamily('Pure export type aliases', findings);
}

function auditRuntimePropertyNameEvasionStrips(workspaceFiles, fileContents) {
  const findings = [];
  for (const filePath of workspaceFiles) {
    const sourceText = fileContents.get(filePath);
    if (sourceText === undefined || !PROPERTY_NAME_EVASION_PATTERN.test(sourceText)) {
      continue;
    }
    for (const [index, line] of sourceText.split(/\r?\n/u).entries()) {
      if (PROPERTY_NAME_EVASION_PATTERN.test(line)) {
        findings.push({ file: relative(filePath), line: index + 1, snippet: line.trim() });
      }
    }
  }

  return makeRuleFamily('Runtime property-name evasion strips', findings);
}

function auditStaleDeletionTargetMarkers(workspaceFiles, fileContents) {
  const findings = [];
  for (const filePath of workspaceFiles) {
    const sourceText = fileContents.get(filePath);
    if (sourceText === undefined || !DELETION_MARKER_PATTERN.test(sourceText)) {
      continue;
    }
    for (const [index, line] of sourceText.split(/\r?\n/u).entries()) {
      if (DELETION_MARKER_PATTERN.test(line)) {
        findings.push({ file: relative(filePath), line: index + 1, snippet: line.trim() });
      }
    }
  }

  return makeRuleFamily('Stale deletion-target markers', findings);
}

async function auditDogfoodReachability(publicEntryFiles) {
  const findings = [];
  for (const entry of publicEntryFiles) {
    const visited = new Set();
    const stack = [{ filePath: entry.sourceFile, chain: [relative(entry.sourceFile)] }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined || visited.has(current.filePath)) {
        continue;
      }
      visited.add(current.filePath);

      const sourceText = await safeRead(current.filePath);
      if (sourceText === null) {
        continue;
      }

      if (isDogfoodFile(current.filePath, sourceText) && current.filePath !== entry.sourceFile) {
        findings.push({
          packageName: entry.packageName,
          subpath: entry.subpath,
          file: relative(current.filePath),
          via: current.chain,
        });
      }

      for (const importPath of collectRelativeImports(current.filePath, sourceText)) {
        stack.push({
          filePath: importPath,
          chain: [...current.chain, relative(importPath)],
        });
      }
    }
  }

  return makeRuleFamily('Dogfood files reachable from public exports', findings);
}

function isDogfoodFile(filePath, sourceText) {
  return (
    /self-hosting|tier-[a-z]-baseline/iu.test(filePath) ||
    sourceText.includes('@architect-bounded-context:dogfood')
  );
}

function collectRelativeImports(filePath, sourceText) {
  const importPattern = /from\s+['"](\.\.?\/[^'"]+)['"]/gu;
  const imports = new Set();

  for (const match of sourceText.matchAll(importPattern)) {
    const resolved = resolveRelativeTsImport(path.dirname(filePath), match[1]);
    if (resolved !== null) {
      imports.add(resolved);
    }
  }

  return [...imports];
}

function resolveRelativeTsImport(directory, specifier) {
  const base = path.resolve(directory, specifier);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];

  return candidates.find((candidate) => ts.sys.fileExists(candidate)) ?? null;
}

function auditInterfaceShadows(workspaceFiles, fileContents) {
  const findings = [];

  for (const filePath of workspaceFiles) {
    const sourceText = fileContents.get(filePath);
    if (sourceText === undefined) {
      continue;
    }

    const inferredNames = new Set();
    const interfaceNames = new Set();
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    for (const statement of sourceFile.statements) {
      if (ts.isTypeAliasDeclaration(statement) && ts.isTypeReferenceNode(statement.type)) {
        if (
          ts.isQualifiedName(statement.type.typeName) &&
          ts.isIdentifier(statement.type.typeName.left) &&
          statement.type.typeName.left.text === 'z' &&
          statement.type.typeName.right.text === 'infer'
        ) {
          inferredNames.add(statement.name.text);
        }
      }

      if (ts.isInterfaceDeclaration(statement)) {
        interfaceNames.add(statement.name.text);
      }
    }

    for (const name of inferredNames) {
      if (interfaceNames.has(name)) {
        findings.push({ file: relative(filePath), name });
      }
    }
  }

  return makeRuleFamily('Handwritten interfaces shadowing z.infer contracts', findings);
}

function makeRuleFamily(description, findings) {
  return {
    description,
    count: findings.length,
    findings,
  };
}

function hasExportModifier(node) {
  return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/gu, '/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

async function safeRead(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
