import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export interface HeroPhoto {
  avifSrcset: string;
  webpSrcset: string;
  fallback: string;
}

// Upper-case extensions too: phones and cameras often save "IMG_1234.JPG".
const assets = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

const baseName = (path: string) => path.split('/').pop() ?? path;
const stem = (name: string) => name.replace(/\.[^.]+$/, '').toLowerCase();

/** File names that clearly mean "this is the headshot", for example "photo (1).jpg" or "Headshot.PNG". */
const PORTRAIT_NAME = /^(photo|headshot|portrait|profile|avatar)\b/;

let warned = false;

/**
 * The headshot in src/assets. In order of preference:
 * 1. the file named in profile.yaml (any upper or lower case),
 * 2. a file called photo, headshot, portrait, profile or avatar (any extension),
 * 3. the only image in the folder, whatever its name.
 * Returns undefined when there is no usable image, and the site shows initials.
 */
export function findAsset(fileName: string): ImageMetadata | undefined {
  const files = Object.keys(assets).sort();
  const wanted = fileName.toLowerCase();
  const pick =
    files.find((f) => baseName(f).toLowerCase() === wanted) ??
    files.find((f) => stem(baseName(f)) === stem(wanted)) ??
    files.find((f) => PORTRAIT_NAME.test(stem(baseName(f)))) ??
    (files.length === 1 ? files[0] : undefined);

  if (!pick && !warned) {
    warned = true;
    warnAboutAssets(files.map(baseName));
  }
  return pick ? assets[pick]?.default : undefined;
}

/** Explains in the build log why no photo was used. */
function warnAboutAssets(images: string[]) {
  let others: string[] = [];
  try {
    others = readdirSync(resolve(process.cwd(), 'src/assets')).filter((n) => /\.(heic|heif)$/i.test(n));
  } catch {
    /* folder missing: nothing to explain */
  }
  if (others.length) {
    console.warn(
      `\n[photo] ${others.join(', ')}: HEIC photos (iPhone format) cannot be used. Save the photo as JPG or PNG and upload that instead.`,
    );
  } else if (images.length > 1) {
    console.warn(
      `\n[photo] Several images in src/assets (${images.join(', ')}) and none is named photo.jpg. Rename the headshot to photo.jpg.`,
    );
  }
}

/**
 * Hero photo at 176 px and 352 px (2x), as AVIF and WebP with a JPEG fallback.
 * Cropped to a square around the most interesting part of the picture (usually the face).
 */
export async function heroPhoto(fileName: string): Promise<HeroPhoto | undefined> {
  const src = findAsset(fileName);
  if (!src) return undefined;
  const make = (format: 'avif' | 'webp' | 'jpeg', width: number) =>
    getImage({
      src,
      format,
      width,
      height: width,
      fit: 'cover',
      position: 'attention',
      quality: format === 'avif' ? 55 : 70,
    });
  const [a1, a2, w1, w2, j1] = await Promise.all([
    make('avif', 176),
    make('avif', 352),
    make('webp', 176),
    make('webp', 352),
    make('jpeg', 352),
  ]);
  return {
    avifSrcset: `${a1.src} 1x, ${a2.src} 2x`,
    webpSrcset: `${w1.src} 1x, ${w2.src} 2x`,
    fallback: j1.src,
  };
}
