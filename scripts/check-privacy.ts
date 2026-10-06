/**
 * Blocks personal data from the public repository (SPEC.md section 11).
 * Fails on phone-number patterns and on CV fields that must never be published.
 */
import { listFiles, scan } from './lib.ts';

const files = listFiles(['src', 'cv', 'public'], (p) => p.startsWith('cv/private') || p.includes('node_modules'));

const rules: Array<{ name: string; pattern: RegExp }> = [
  // Bangladesh mobile numbers: 01XXXXXXXXX, +8801XXXXXXXXX, 880-1XXX-XXXXXX
  { name: 'Bangladesh phone number', pattern: /(?<![\d.\/])(?:\+?880[\s-]?|0)1[3-9]\d{2}[\s-]?\d{6}(?!\d)/ },
  // International format with a leading plus: +44 20 7946 0958
  { name: 'International phone number', pattern: /(?<![\w\/])\+\d{1,3}[\s-]\(?\d{1,4}\)?(?:[\s-]\d{2,4}){2,4}(?!\d)/ },
  { name: 'Personal data field', pattern: /\b(date of birth|blood group|marital status|religion)\b/i },
  { name: 'National ID', pattern: /\b(NID|national id(entity)? (card )?(no|number))\b/i },
];

let failed = 0;
for (const rule of rules) {
  const hits = scan(files, new RegExp(rule.pattern.source, rule.pattern.flags));
  for (const h of hits) {
    console.error(`${rule.name}: ${h.file}:${h.line}  ${h.text}`);
    failed++;
  }
}

if (failed) {
  console.error(`\ncheck-privacy: ${failed} problem(s). Remove personal data before committing (SPEC.md section 11).`);
  process.exit(1);
}
console.log(`check-privacy: ${files.length} files clean.`);
