import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');

const TEXT = /\.(astro|md|mdx|ya?ml|json|ts|tsx|js|mjs|css|html|tex|txt|bib|svg)$/i;

/** Every text file under the given folders, relative to the repository root. */
export function listFiles(dirs: string[], skip: (path: string) => boolean = () => false): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      const rel = relative(ROOT, full);
      if (skip(rel)) continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (TEXT.test(name)) out.push(rel);
    }
  };
  dirs.forEach((d) => walk(resolve(ROOT, d)));
  return out;
}

export interface Hit {
  file: string;
  line: number;
  text: string;
}

export function scan(files: string[], pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    const lines = readFileSync(resolve(ROOT, file), 'utf8').split('\n');
    lines.forEach((text, i) => {
      pattern.lastIndex = 0;
      if (pattern.test(text)) hits.push({ file, line: i + 1, text: text.trim().slice(0, 140) });
    });
  }
  return hits;
}
