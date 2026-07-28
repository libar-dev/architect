/**
 * The single repo-root anchor for the whole sandbox.
 *
 * Derived from THIS file's own location — never `process.cwd()` — so every
 * cwd-sensitive operation is location-stable no matter where the entrypoint is
 * invoked: the pipeline `baseDir` (live.ts), the `git` calls (extract.ts, cli.ts),
 * and shell-outs inside scratch scripts. `q.ts` additionally `process.chdir()`s
 * here, so any script piped through the front door runs from the repo root even if
 * you launched `q.ts` from a subdirectory. Standalone scratch files import
 * `REPO_ROOT` and pass it as `cwd`. This is a leaf module (imports only node:path),
 * so everything can depend on it without an import cycle.
 */
import { resolve } from 'node:path';

export const REPO_ROOT = resolve(import.meta.dirname, '..');
