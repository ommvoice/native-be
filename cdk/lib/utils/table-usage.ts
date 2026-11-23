import * as fs from 'fs';
import * as path from 'path';

/**
 * Least-privilege DynamoDB grants: finds which tables a Lambda can actually touch by walking the
 * handler's relative-import graph and collecting `TABLES.<key>` references (app/shared/db/tables.ts
 * is the only way app code resolves a table name). Runs at synth time, so grants follow the code —
 * a new repository call is picked up on the next deploy without editing the registry.
 *
 * Over-approximates (everything reachable through imports counts), never under-approximates as long
 * as tables are only referenced via TABLES.<key>.
 */

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]|import\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const TABLE_RE = /\bTABLES\.([A-Za-z]+)\b/g;

const cache = new Map<string, Set<string>>();

function resolveImport(fromFile: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromFile), spec.replace(/\.js$/, ''));
  for (const candidate of [`${base}.ts`, path.join(base, 'index.ts'), base]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Table keys (as in TABLE_ENV_VARS / LambdaStack `tables`) reachable from `entryFile`. */
export function tablesUsedBy(entryFile: string): string[] {
  const hit = cache.get(entryFile);
  if (hit) return [...hit];

  const tables = new Set<string>();
  const seen = new Set<string>();
  const stack = [entryFile];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(TABLE_RE)) tables.add(m[1]!);
    for (const m of src.matchAll(IMPORT_RE)) {
      const resolved = resolveImport(file, (m[1] ?? m[2])!);
      if (resolved && !seen.has(resolved)) stack.push(resolved);
    }
  }
  cache.set(entryFile, tables);
  return [...tables];
}
