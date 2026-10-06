/**
 * Fails if the em dash character (U+2014) appears in site copy.
 * SPEC.md section 8: use commas, colons or a new sentence instead.
 */
import { listFiles, scan } from './lib.ts';

const EM_DASH = new RegExp(String.fromCharCode(0x2014));
const files = listFiles(['src'], (p) => p.includes('generated'));
const hits = scan(files, EM_DASH);

if (hits.length) {
  console.error(`Em dash found in ${hits.length} place(s). Use a comma, colon or new sentence:\n`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
  process.exit(1);
}
console.log(`check-emdash: ${files.length} files clean.`);
