/**
 * @architect
 * @architect-cli
 * @architect-pattern MechanicalSubstrateExtractor
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses GraphHandleShapes
 * @architect-usecase Use when a question legitimately wants the import firehose — impact, find-all-usages, curation assist — never to derive the architecture.
 *
 * ## MechanicalSubstrateExtractor — Layer 1 builder (derived, exhaustive, 0 annotation burden)
 *
 * Walks `packages/*​/src` with the TypeScript compiler API (syntactic only, no
 * type-checker) and emits exported symbols + import/export edges, with re-export
 * barrels FOLLOWED to the defining symbol. This is the language-server-grade
 * firehose the curated graph deliberately abstracts over — kept separate, built
 * on demand, never hand-curated. Divergence between this substrate and the
 * curated graph is curation, not drift; the architecture is never derived from it.
 *
 * `buildMechanicalCore(baseDir)` returns the core IN-MEMORY — the handle calls it
 * every `loadGraph()`, so the substrate always reflects the working tree. No file
 * is read or written beyond source + `git rev-parse HEAD`.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import ts from 'typescript';

import {
  type ImportEdge,
  type MechanicalCore,
  MechanicalCoreSchema,
  type SymbolNode,
} from './schema.js';

const pkgOf = (f: string) => /^packages\/([^/]+)\//.exec(f)?.[1] ?? '(root)';

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist' || e === '.turbo') continue;
    const p = join(dir, e);
    let isDir = false;
    try {
      isDir = statSync(p).isDirectory();
    } catch {
      continue; // broken symlink or racing delete — skip, never crash the walk
    }
    if (isDir) walk(p, out);
    else if (e.endsWith('.ts') && !e.endsWith('.d.ts') && !/\.(steps|test|spec)\.ts$/.test(e))
      out.push(p);
  }
  return out;
}

type Reexport = { exported: string; original: string; from: string } | { star: true; from: string };
interface FileRec {
  localExports: Map<string, SymbolNode['kind']>;
  reexports: Reexport[];
  imports: {
    name: string;
    from: string;
    kind: 'named' | 'default' | 'namespace';
    typeOnly: boolean;
  }[];
}

// parse is pure: reads one file, returns its export/import record.
function parse(abs: string, relPath: string): FileRec {
  const sf = ts.createSourceFile(relPath, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true);
  const rec: FileRec = { localExports: new Map(), reexports: [], imports: [] };
  const hasExport = (n: ts.Node) =>
    ts.canHaveModifiers(n) &&
    ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  for (const s of sf.statements) {
    if (
      (ts.isFunctionDeclaration(s) ||
        ts.isClassDeclaration(s) ||
        ts.isInterfaceDeclaration(s) ||
        ts.isTypeAliasDeclaration(s) ||
        ts.isEnumDeclaration(s)) &&
      hasExport(s) &&
      s.name
    ) {
      const kind = ts.isFunctionDeclaration(s)
        ? 'function'
        : ts.isClassDeclaration(s)
          ? 'class'
          : ts.isInterfaceDeclaration(s)
            ? 'interface'
            : ts.isTypeAliasDeclaration(s)
              ? 'type'
              : 'enum';
      rec.localExports.set(s.name.text, kind);
    } else if (ts.isVariableStatement(s) && hasExport(s)) {
      for (const d of s.declarationList.declarations)
        if (ts.isIdentifier(d.name)) rec.localExports.set(d.name.text, 'const');
    } else if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier)) {
      const from = s.moduleSpecifier.text;
      const clause = s.importClause;
      if (!clause) continue;
      const clauseTypeOnly = clause.phaseModifier === ts.SyntaxKind.TypeKeyword;
      if (clause.name)
        rec.imports.push({
          name: clause.name.text,
          from,
          kind: 'default',
          typeOnly: clauseTypeOnly,
        });
      const nb = clause.namedBindings;
      if (nb && ts.isNamespaceImport(nb))
        rec.imports.push({ name: nb.name.text, from, kind: 'namespace', typeOnly: clauseTypeOnly });
      else if (nb && ts.isNamedImports(nb))
        for (const el of nb.elements)
          rec.imports.push({
            name: (el.propertyName ?? el.name).text,
            from,
            kind: 'named',
            typeOnly: clauseTypeOnly || el.isTypeOnly,
          });
    } else if (ts.isExportDeclaration(s)) {
      const from =
        s.moduleSpecifier && ts.isStringLiteral(s.moduleSpecifier) ? s.moduleSpecifier.text : null;
      if (from && s.exportClause && ts.isNamedExports(s.exportClause))
        for (const el of s.exportClause.elements)
          rec.reexports.push({
            exported: el.name.text,
            original: (el.propertyName ?? el.name).text,
            from,
          });
      else if (from && !s.exportClause) rec.reexports.push({ star: true, from });
      else if (!from && s.exportClause && ts.isNamedExports(s.exportClause))
        for (const el of s.exportClause.elements) rec.localExports.set(el.name.text, 'reexport');
    }
  }
  return rec;
}

// resolve (file, exportedName) → its DEFINING file, following re-export barrels
function resolveDef(
  file: string,
  name: string,
  files: Map<string, FileRec>,
  resolveModule: (fromFile: string, spec: string) => string | null,
  seen = new Set<string>(),
): string | null {
  const key = `${file}#${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  const rec = files.get(file);
  if (!rec) return null;
  if (rec.localExports.has(name)) return file;
  for (const re of rec.reexports) {
    if ('star' in re || re.exported !== name) continue;
    const tgt = resolveModule(file, re.from);
    if (tgt) {
      const d = resolveDef(tgt, re.original, files, resolveModule, seen);
      if (d) return d;
    }
  }
  for (const re of rec.reexports) {
    if (!('star' in re)) continue;
    const tgt = resolveModule(file, re.from);
    if (tgt) {
      const d = resolveDef(tgt, name, files, resolveModule, seen);
      if (d) return d;
    }
  }
  return null;
}

/**
 * Build the mechanical substrate fresh from the working tree under `baseDir`.
 * Pure (no IO except reading source + `git rev-parse HEAD`), deterministic
 * (sorted symbols/edges), reentrant. Validated against `MechanicalCoreSchema`
 * before return — fails loud.
 */
export function buildMechanicalCore(baseDir: string): MechanicalCore {
  const root = resolve(baseDir);
  const rel = (abs: string) => abs.slice(root.length + 1);

  const resolveModule = (fromFile: string, spec: string): string | null => {
    if (spec.startsWith('.')) {
      const base = resolve(root, dirname(fromFile), spec.replace(/\.js$/, ''));
      for (const cand of [`${base}.ts`, join(base, 'index.ts')]) {
        const r = rel(cand);
        if (fileSet.has(r)) return r;
      }
      return null;
    }
    const m = /^@libar-dev\/architect-([^/]+)(?:\/(.+))?$/.exec(spec);
    if (m) {
      const pkg = `architect-${m[1] ?? ''}`;
      const sub = m[2];
      const cands = sub
        ? [
            `packages/${pkg}/src/${sub.replace(/\.js$/, '')}.ts`,
            `packages/${pkg}/src/${sub.replace(/\.js$/, '')}/index.ts`,
          ]
        : [`packages/${pkg}/src/index.ts`];
      for (const c of cands) if (fileSet.has(c)) return c;
    }
    return null; // node builtin / external
  };

  const srcAbs = walk(join(root, 'packages')).filter((f) => f.includes('/src/'));
  const fileSet = new Set(srcAbs.map(rel));
  const files = new Map<string, FileRec>();
  for (const abs of srcAbs) files.set(rel(abs), parse(abs, rel(abs)));

  const symbols: SymbolNode[] = [];
  for (const [file, rec] of files)
    for (const [name, kind] of rec.localExports)
      symbols.push({ id: `${file}#${name}`, file, name, kind, pkg: pkgOf(file) });

  const edges: ImportEdge[] = [];
  const unresolved: { fromFile: string; spec: string }[] = [];
  const seenEdge = new Set<string>();
  for (const [file, rec] of files) {
    for (const imp of rec.imports) {
      const tgt = resolveModule(file, imp.from);
      if (!tgt) {
        if (imp.from.startsWith('.') || imp.from.startsWith('@libar-dev/'))
          unresolved.push({ fromFile: file, spec: imp.from });
        continue;
      }
      let toFile = tgt;
      let symbol: string | null = null;
      if (imp.kind === 'named') {
        symbol = imp.name;
        toFile = resolveDef(tgt, imp.name, files, resolveModule) ?? tgt;
      }
      const k = `${file}->${toFile}#${symbol ?? '*'}:${imp.kind}`;
      if (seenEdge.has(k)) continue;
      seenEdge.add(k);
      edges.push({
        fromFile: file,
        toFile,
        symbol,
        kind: imp.kind,
        typeOnly: imp.typeOnly,
        crossPkg: pkgOf(file) !== pkgOf(toFile),
      });
    }
  }

  symbols.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) =>
    (a.fromFile + a.toFile + (a.symbol ?? '')).localeCompare(
      b.fromFile + b.toFile + (b.symbol ?? ''),
    ),
  );

  const out: MechanicalCore = {
    version: '1.0.0',
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: root }).trim(),
    fileCount: files.size,
    symbols,
    edges,
    unresolved,
  };
  return MechanicalCoreSchema.parse(out);
}
