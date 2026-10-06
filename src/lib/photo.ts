import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export interface HeroPhoto {
  avifSrcset: string;
  webpSrcset: string;
  fallback: string;
}

const assets = import.meta.glob<{ default: ImageMetadata }>('/src/assets/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

/** The image file named in profile.yaml, or undefined if it has not been added yet. */
export function findAsset(fileName: string): ImageMetadata | undefined {
  const key = Object.keys(assets).find((k) => k.endsWith(`/${fileName}`));
  return key ? assets[key]?.default : undefined;
}

/** Hero photo at 176 px and 352 px (2x), as AVIF and WebP with a JPEG fallback. */
export async function heroPhoto(fileName: string): Promise<HeroPhoto | undefined> {
  const src = findAsset(fileName);
  if (!src) return undefined;
  const make = (format: 'avif' | 'webp' | 'jpeg', width: number) =>
    getImage({ src, format, width, height: width, fit: 'cover', quality: format === 'avif' ? 55 : 70 });
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
