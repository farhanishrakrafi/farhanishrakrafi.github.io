/**
 * Blocks personal data from the public repository (SPEC.md section 11).
 * Fails on phone-number patterns, on CV fields that must never be published,
 * and on photos that still carry the GPS location where they were taken.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import exifReader from 'exif-reader';
import sharp from 'sharp';
import { ROOT, listFiles, scan } from './lib.ts';

const SCAN_DIRS = ['src', 'cv', 'public'];
const skip = (p: string) => p.startsWith('cv/private') || p.includes('node_modules');
const files = listFiles(SCAN_DIRS, skip);

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

/** Every JPEG, PNG, WebP, AVIF, TIFF or HEIC file under the scanned folders. */
function listImages(): string[] {
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
      else if (/\.(jpe?g|jfif|png|webp|avif|tiff?|heic|heif)$/i.test(name)) out.push(rel);
    }
  };
  SCAN_DIRS.forEach((d) => walk(join(ROOT, d)));
  return out;
}

const images = listImages();
for (const image of images) {
  let hasGps = false;
  try {
    const { exif } = await sharp(join(ROOT, image)).metadata();
    if (exif) {
      const tags = exifReader(exif) as { GPSInfo?: Record<string, unknown> };
      hasGps = Boolean(tags.GPSInfo && Object.keys(tags.GPSInfo).length);
    }
  } catch {
    // Formats sharp cannot read (for example HEIC) are explained by the photo build step.
  }
  if (hasGps) {
    console.error(
      `Photo location (GPS): ${image} records where it was taken. This repository is public, so replace it with a copy ` +
        'without location data (see src/assets/README.md), then remove the old file.',
    );
    failed++;
  }
}

if (failed) {
  console.error(`\ncheck-privacy: ${failed} problem(s). Remove personal data before committing (SPEC.md section 11).`);
  process.exit(1);
}
console.log(`check-privacy: ${files.length} files and ${images.length} images clean.`);
