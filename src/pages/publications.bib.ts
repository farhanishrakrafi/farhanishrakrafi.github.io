import { bibliographyBibtex } from '../lib/citations.ts';
import { getPublications } from '../lib/publications.ts';

/** Every publication as one BibTeX file, at /publications.bib. */
export async function GET() {
  const body = bibliographyBibtex(await getPublications());
  return new Response(body, { headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' } });
}
