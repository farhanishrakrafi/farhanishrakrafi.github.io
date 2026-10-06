/**
 * CV as code (SPEC.md section 9): renders cv/cv.tex from src/data/cv.yaml,
 * src/data/profile.yaml and the publications, so the website and the PDF
 * never disagree. CI compiles it with LaTeX and copies the PDF to /cv.pdf.
 *
 *   npm run cv:tex   write cv/cv.tex
 *   npm run cv:pdf   write cv/cv.tex and compile public/cv.pdf (needs a local LaTeX install)
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SITE } from '../src/config/site.ts';
import { splitItalic } from '../src/lib/italics.ts';
import {
  comparePublications,
  matchesName,
  mergePublication,
  shortName,
  sourceDetails,
  type EnrichedRecord,
  type PublicationEntry,
} from '../src/lib/publication-merge.ts';

const ROOT = resolve(import.meta.dirname, '..');
const read = <T>(path: string) => parseYaml(readFileSync(resolve(ROOT, path), 'utf8')) as T;

interface Item {
  title: string;
  org?: string;
  location?: string;
  start?: string;
  end?: string;
  details?: string;
  bullets?: string[];
  showOnSite?: boolean;
}

interface Cv {
  education?: Item[];
  researchExperience?: Item[];
  training?: Item[];
  workshops?: Item[];
  experience?: Item[];
  leadership?: Item[];
  awards?: Item[];
  memberships?: string[];
  languages?: Array<{ name: string; level: string }>;
  skills: Record<'wetLab' | 'genomics' | 'structural' | 'omics' | 'tools', string[] | undefined>;
}

interface Profile {
  name: string;
  nameVariants: string[];
  headline: string;
  affiliation: string;
  location: string;
  email: string;
  links: Record<string, string | undefined>;
  showProfessionalExperience?: boolean;
}

/** Escapes LaTeX special characters and maps common Unicode symbols. */
export function tex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/·/g, '\\textperiodcentered{}')
    .replace(/µ/g, '\\textmu{}')
    .replace(/°/g, '\\textdegree{}')
    .replace(/×/g, '\\texttimes{}')
    .replace(/β/g, '$\\beta$')
    .replace(/–/g, '--')
    .replace(/[‘’]/g, "'")
    .replace(/“/g, '``')
    .replace(/”/g, "''");
}

/** Escaped text with listed species and gene names in italics. */
function rich(text: string): string {
  return splitItalic(text)
    .map((part) => (part.italic ? `\\textit{${tex(part.text)}}` : tex(part.text)))
    .join('');
}

const range = (i: Item) => (i.start && i.end ? `${i.start} -- ${i.end}` : (i.start ?? i.end ?? ''));

function entry(i: Item): string {
  const lines: string[] = [];
  const when = range(i);
  lines.push(`\\textbf{${rich(i.title)}}${when ? `\\hfill{\\small ${tex(when)}}` : ''}`);
  const place = [i.org, i.location].filter(Boolean).join(', ');
  if (place) lines.push(rich(place));
  if (i.details) lines.push(rich(i.details));
  let out = `${lines.join('\\\\\n')}\\par\n`;
  if (i.bullets?.length) {
    out += `\\begin{itemize}\n${i.bullets.map((b) => `  \\item ${rich(b)}`).join('\n')}\n\\end{itemize}\n`;
  }
  return `\\begin{minipage}{\\linewidth}\n${out}\\end{minipage}\n\\medskip\n`;
}

function section(title: string, items: Item[] | undefined): string {
  const shown = (items ?? []).filter((i) => i.showOnSite !== false);
  if (!shown.length) return '';
  return `\\section*{${tex(title)}}\n${shown.map(entry).join('\n')}\n`;
}

function publicationsSection(profile: Profile): string {
  const raw = read<Array<Partial<PublicationEntry> & { id: string; title: string; year: number }>>(
    'src/data/publications.yaml',
  );
  let enriched: Record<string, EnrichedRecord> = {};
  try {
    const file = JSON.parse(readFileSync(resolve(ROOT, 'src/data/generated/publications.enriched.json'), 'utf8'));
    enriched = file.records ?? {};
  } catch {
    /* no cache yet */
  }
  const pubs = raw
    .map((r) =>
      mergePublication(
        {
          type: 'journal',
          status: 'published',
          authors: [],
          authorsComplete: true,
          openAccess: false,
          role: 'co-author',
          keywords: [],
          selected: false,
          ...r,
        } as PublicationEntry,
        enriched[r.id],
      ),
    )
    .sort(comparePublications);
  if (!pubs.length) return '';

  const variants = [profile.name, ...profile.nameVariants];
  const items = pubs.map((p) => {
    const authors = p.authors
      .map((a) => (matchesName(a, variants) ? `\\textbf{${tex(shortName(a))}}` : tex(shortName(a))))
      .join(', ');
    const parts = [p.etAl ? `${authors}, \\textit{et al.}` : `${authors}.`, `${rich(p.title)}.`];
    const journal = p.status === 'in-preparation' ? undefined : p.journal;
    const source = [journal ? `\\textit{${tex(journal)}}` : '', tex(sourceDetails(p))].filter(Boolean).join(' ');
    parts.push(`${source}${source ? ' ' : ''}(${p.date[0]}).`);
    if (p.doi) parts.push(`\\href{https://doi.org/${p.doi}}{doi:${tex(p.doi)}}`);
    if (p.status !== 'published') parts.push(`[${tex(p.status.replace('-', ' '))}]`);
    return `  \\item ${parts.join(' ')}`;
  });
  return `\\section*{Publications}\n\\begin{enumerate}[label={[\\arabic*]}]\n${items.join('\n')}\n\\end{enumerate}\n`;
}

export function buildTex(): string {
  const profile = read<Profile>('src/data/profile.yaml');
  const cv = read<Cv>('src/data/cv.yaml');
  const website = `${SITE.url}${SITE.base}/`;
  const dot = ' \\textperiodcentered{} ';
  const contact = [tex(profile.location), `\\href{mailto:${profile.email}}{${tex(profile.email)}}`].join(dot);
  const links = [
    `\\href{${website}}{${tex(website.replace(/^https?:\/\//, ''))}}`,
    ...(['orcid', 'linkedin', 'scholar', 'github'] as const)
      .filter((k) => profile.links[k])
      .map((k) => `\\href{${profile.links[k]}}{${tex(profile.links[k]!.replace(/^https?:\/\/(www\.)?/, ''))}}`),
  ].join(dot);

  const skillRows = (
    [
      ['Wet lab', cv.skills.wetLab],
      ['Genomics', cv.skills.genomics],
      ['Structural', cv.skills.structural],
      ['Omics', cv.skills.omics],
      ['Tools', cv.skills.tools],
    ] as const
  )
    .filter(([, items]) => items?.length)
    .map(([label, items]) => `\\textbf{${label}:} & ${items!.map(tex).join('; ')} \\\\`)
    .join('\n');

  const body = [
    section('Education', cv.education),
    section('Research experience', cv.researchExperience),
    publicationsSection(profile),
    section('Training', cv.training),
    section('Workshops and seminars', cv.workshops),
    `\\section*{Skills and methods}\n\\begin{tabularx}{\\linewidth}{@{}l X@{}}\n${skillRows}\n\\end{tabularx}\n`,
    profile.showProfessionalExperience !== false ? section('Professional experience', cv.experience) : '',
    section('Leadership', cv.leadership),
    section('Awards', cv.awards),
    cv.memberships?.length ? `\\section*{Memberships}\n${cv.memberships.map(tex).join('; ')}.\n` : '',
    cv.languages?.length
      ? `\\section*{Languages}\n${cv.languages.map((l) => `${tex(l.name)} (${tex(l.level.toLowerCase())})`).join('; ')}.\n`
      : '',
    `\\section*{References}\nAvailable on request.\n`,
  ]
    .filter(Boolean)
    .join('\n');

  return `% GENERATED by scripts/build-cv-tex.ts from src/data/*.yaml. Do not edit by hand:
% change the YAML files and run \`npm run cv:tex\`. CI compiles this file to /cv.pdf.
\\documentclass[11pt,a4paper]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{textcomp}
\\IfFileExists{newtxtext.sty}{\\usepackage{newtxtext}}{\\usepackage{mathptmx}}
\\usepackage[margin=2cm]{geometry}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{titlesec}
\\usepackage[dvipsnames]{xcolor}
\\usepackage[hidelinks]{hyperref}
\\definecolor{brand}{HTML}{0F766E}
\\titleformat{\\section}{\\large\\bfseries\\color{brand}}{}{0pt}{}[{\\color{brand!40}\\titlerule}]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\setlist[itemize]{leftmargin=1.2em,itemsep=1pt,topsep=2pt,parsep=0pt}
\\setlist[enumerate]{leftmargin=2.2em,itemsep=4pt,topsep=2pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{plain}
\\hypersetup{pdftitle={${tex(profile.name)}: Curriculum vitae},pdfauthor={${tex(profile.name)}}}

\\begin{document}
\\raggedright

{\\LARGE\\bfseries ${tex(profile.name)}}\\par
\\smallskip
{\\color{brand}${tex(profile.headline)}}\\par
${tex(profile.affiliation)}\\par
\\smallskip
{\\small ${contact}\\\\
${links}}\\par

${body}
\\end{document}
`;
}

function main() {
  const out = resolve(ROOT, 'cv/cv.tex');
  writeFileSync(out, buildTex());
  console.log('cv: wrote cv/cv.tex');

  if (process.argv.includes('--pdf')) {
    const build = resolve(ROOT, 'cv/build');
    mkdirSync(build, { recursive: true });
    execFileSync('latexmk', ['-pdf', '-interaction=nonstopmode', '-halt-on-error', `-outdir=${build}`, out], {
      stdio: 'inherit',
    });
    copyFileSync(resolve(build, 'cv.pdf'), resolve(ROOT, 'public/cv.pdf'));
    console.log('cv: compiled public/cv.pdf');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
