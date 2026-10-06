/** Every PDF under public/ (and the built CV) must be under 5 MB, as Google Scholar asks. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './lib.ts';

const LIMIT = 5 * 1024 * 1024;
const big: string[] = [];
const walk = (dir: string) => {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.toLowerCase().endsWith('.pdf') && statSync(full).size > LIMIT) big.push(relative(ROOT, full));
  }
};
['public', 'dist'].forEach((d) => walk(join(ROOT, d)));

if (big.length) {
  console.error(`PDF files over 5 MB:\n  ${big.join('\n  ')}`);
  process.exit(1);
}
console.log('check-pdf-size: all PDFs under 5 MB.');
