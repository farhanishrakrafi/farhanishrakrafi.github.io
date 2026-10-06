# Academic Website Spec: Farhan Ishrak Rafi

Oct 5, 2026 · @Farhan

Build specification for a zero-cost, research-grade academic profile site. Written to be handed directly to Claude Code.

## 1. Project overview

The site is a static, $0-per-month academic profile at `farhanishrakrafi.github.io` that sells one story: a wet-lab microbiologist who also does bacterial genomics and computational drug discovery.

### Audiences and what each needs in 30 seconds

| Audience | What they scan for | What the site must surface first |
| --- | --- | --- |
| PhD supervisors (AMR, genomics, drug discovery labs) | Research fit, methods, publications, references | Research statement, thesis project, Q1 paper, methods matrix, CV PDF |
| Pharma recruiters (QC, Micro QC, R&D in Bangladesh) | Lab skills, instruments, GMP awareness, contact | Skills by lab area, BCSIR training, CV PDF, email |
| Collaborators and co-authors | Current projects, contact, ORCID | Project pages with status, ORCID and Scholar links |
| Scholarly crawlers (Google Scholar, OpenAlex, Google) | Machine-readable metadata | Citation meta tags, JSON-LD, sitemap |

### Goals

1. Present research identity in one screen: name, one-line research statement, photo, CV button, scholarly links.
2. Make every project and publication its own indexable page.
3. Keep content in plain Markdown and YAML so updating takes minutes, not code.
4. Generate the CV PDF from the same repository so the site and CV never disagree.
5. Cost nothing: hosting, domain, analytics, search and CI all on free tiers.

### Success criteria (acceptance gates for the final build)

| Metric | Target |
| --- | --- |
| Lighthouse (Performance, Accessibility, Best Practices, SEO) | 95 or higher on every page, mobile profile |
| Largest Contentful Paint | Under 2.0 s on simulated 4G |
| JavaScript shipped on the home page | Under 50 KB gzipped |
| Accessibility | WCAG 2.2 AA, zero axe-core violations |
| Monthly cost | $0 |
| Time to add a publication | Under 5 minutes, one YAML entry, no code |
| Build and deploy | Under 3 minutes from push to live |

### Non-goals

- No backend, database, login, or comments.
- No paid services or trials that later need a card.
- No personal data beyond professional contact details (see section 11).

## 2. Hosting and domain plan ($0)

Host on **GitHub Pages** as a user site; the free `github.io` address is the domain, so nothing is ever bought. GitHub Pages is free for public repositories on GitHub Free ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).

### The address

- Create a GitHub account with username `farhanishrakrafi` (matches the LinkedIn handle). If taken, use the closest variant and change it everywhere in `src/config/site.ts`.
- Create a **public** repository named exactly `farhanishrakrafi.github.io`. That name makes it the account's user site.
- Live URL: `https://farhanishrakrafi.github.io`. HTTPS is issued and renewed automatically, at no cost.

### Limits that matter, from GitHub's own documentation

| Limit | Value | Impact on this site |
| --- | --- | --- |
| Published site size | 1 GB maximum | Fine; target under 50 MB. Keep large PDFs and datasets on Zenodo or OSF |
| Bandwidth | 100 GB per month, soft limit | Roughly 2 million page views at 50 KB each; never a concern |
| Builds | 10 per hour soft limit, not applied to custom Actions workflows | We deploy with a custom Actions workflow, so it does not apply |
| Deployment timeout | 10 minutes | Target build under 3 minutes |
| User sites per account | One | This repository is that one |
| Allowed use | Not for business, e-commerce, or SaaS | A personal academic profile is fine |

Source: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), opened on the as-of date above.

### Optional free vanity subdomain

- [is-a.dev](https://github.com/is-a-dev/register) gives free developer subdomains such as `farhan.is-a.dev`. You request it by opening a pull request on their GitHub repository.
- Their README asks that you **do not use AI to write the request**. Farhan files this PR himself; Claude Code must not.
- It is community-run. Launch on `github.io` first; add the vanity domain later only if wanted. The canonical URL lives in one config value, so switching is a one-line change plus a `CNAME` file.
- Avoid old "free TLD" registrars (`.tk`, `.ml` style). They are no longer a dependable option.

### Fallback host, same code

Cloudflare Pages (`*.pages.dev`) or Netlify (`*.netlify.app`) can serve the identical static build on free plans. Check their free-tier terms at the time of switching; they change more often than GitHub's.

### Monthly cost

| Item | Service | Cost |
| --- | --- | --- |
| Hosting and HTTPS | GitHub Pages | $0 |
| Domain | `farhanishrakrafi.github.io` | $0 |
| Build and CI | GitHub Actions on a public repository | $0 |
| Search | Pagefind, runs at build time | $0 |
| Analytics | Cloudflare Web Analytics or GoatCounter | $0 |
| Publication metrics | OpenAlex and Crossref public APIs | $0 |
| Scholarly IDs | ORCID, Google Scholar profile | $0 |
| **Total** |  | **$0** |

## 3. Tech stack and architecture

Astro builds the entire site into static files inside GitHub Actions, and GitHub Pages only serves those files; there is no server to maintain, pay for, or secure.

&#91;embedded content: build and publish pipeline · 3 stages\]

Farhan edits text files and pushes; the build fetches paper metadata, checks every file against its schema, and publishes plain HTML that loads fast on mobile data.

### Decisions

| Layer | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Framework | Astro, latest stable release | Static HTML by default, islands for the few interactive parts, typed content collections, an official GitHub Pages action | Jekyll templates such as al-folio: popular with academics, but Ruby-based and harder to extend with typed data. Next.js: more JavaScript and setup for a static site |
| Language | TypeScript in strict mode | Data mistakes fail the build instead of reaching visitors | Plain JavaScript |
| Styling | Tailwind CSS plus CSS custom properties for the tokens in section 8 | Consistent spacing fast; tokens drive dark mode | A component library: heavier, generic look |
| Content | Markdown, MDX and YAML in content collections, validated with Zod | Updates are text edits, never code | A headless CMS: another account and moving part |
| Interactivity | Small vanilla TypeScript `<script>` blocks in Astro components; 3Dmol.js loaded on demand | Keeps the JavaScript budget; no UI framework needed | React or Vue across the site |
| Search | Pagefind | Runs at build time, free, no server or account | Hosted search services: accounts and quotas |
| Images | `astro:assets` with AVIF and WebP output | Small, responsive images with fixed dimensions | Unoptimised JPEGs |
| Fonts | `@fontsource` packages, self-hosted | Faster and private | Google Fonts CDN |
| Citations | `citation-js` at build time | Correct APA, Vancouver and BibTeX without client code | Hand-typed citations |
| Testing | Playwright, axe-core, Lighthouse CI, lychee | Every quality target in section 1 is checked automatically | Manual checking |
| Hosting | GitHub Pages through the official Astro action | $0, HTTPS included | Paid hosts |

Astro moves quickly: on the as-of date its documentation already listed a v7 upgrade guide. Claude Code scaffolds with the current major version and reads its upgrade notes before pinning anything.

## 4. Sitemap and information architecture

Nine human-facing routes plus machine routes; every project and publication gets its own URL so each can be indexed and shared.

### Routes

| Route | Page | Purpose | Data source | Phase |
| --- | --- | --- | --- | --- |
| `/` | Home | The 30-second pitch | `profile.yaml`, featured projects, latest 3 news, selected publications | 1 |
| `/research/` | Research | Research themes, then a filterable project grid | `projects` collection | 1 |
| `/research/[slug]/` | Project detail | Question, approach, methods, findings or status, outputs | One MDX file per project | 1 |
| `/publications/` | Publications | Filterable list, metrics, citation export | `publications.yaml` + build-time enrichment | 1 |
| `/publications/[slug]/` | Publication detail | Abstract, authors, DOI, BibTeX, scholarly meta tags | Same | 1 |
| `/cv/` | CV | Full HTML CV plus PDF download | `cv.yaml` + generated `/cv.pdf` | 1 |
| `/contact/` | Contact | Email, scholarly profiles, what he is open to | `profile.yaml` | 1 |
| `/news/` | News | Dated updates, newest first | `news` collection | 2 |
| `/search/` | Search | Full-site search | Pagefind index | 2 |
| `/notes/` and `/notes/[slug]/` | Notes | Protocols and bioinformatics tutorials with math | `notes` MDX collection | 3 |
| `/404.html` | Not found | Helpful links back | Static | 1 |

Machine routes, all generated at build: `/sitemap-index.xml`, `/robots.txt`, `/rss.xml`, `/cv.pdf`, `/og/[slug].png` social cards, `/publications.bib` (all publications as one BibTeX file).

### Navigation

- **Header (sticky, collapses to a menu under 768 px):** name as home link; Research · Publications · CV · Notes · Contact; search button (Phase 2); light/dark toggle.
- **Footer:** ORCID, Google Scholar, GitHub, LinkedIn, ResearchGate and email icons; "Last updated" date from the latest Git commit; licence line (content CC BY 4.0, code MIT); link to the source repository.
- **Skip link** to main content as the first focusable element on every page.
- Any profile link left empty in config hides its icon automatically. No dead links.

### URL rules

- Lowercase, hyphenated slugs from titles, for example `/research/mdr-ecoli-st361-genomics/`.
- Trailing slash on every page route, matching GitHub Pages directory output.
- A slug never changes after publishing. If one must, add a redirect stub page at the old URL.

## 5. Page-by-page specification

Each page below lists its sections in display order; anything marked *island* is the only JavaScript on that page and loads lazily.

### Home `/`

1. **Hero.** Photo (rounded square, 176 px, AVIF with WebP fallback); `h1` name; title line "Biochemist · Bacterial genomics · Computational drug discovery"; one-sentence research statement; affiliation line; location "Dhaka, Bangladesh". Buttons: **Download CV** (primary, links `/cv.pdf`), **View research** (secondary). Icon row: ORCID, Google Scholar, GitHub, LinkedIn, email.
2. **Availability banner.** One line from config, for example "Open to fully funded PhD positions (2027 intake) and pharmaceutical QC, Microbiology and R&D roles." Hidden when the config value is empty.
3. **Research themes.** Three cards: AMR and bacterial genomics; Structure-based drug discovery; Multi-omics and microbiome. Each card has two sentences, four method chips, and links to `/research/?theme=<id>`.
4. **Featured projects.** Up to three project cards where `featured: true`.
5. **Selected publications.** Up to three entries where `selected: true`, with DOI and citation count.
6. **Methods snapshot.** Four columns (Wet lab, Genomics, Structural, Omics), five skills each, linking to `/cv/#skills`.
7. **Latest news.** Three newest items. Section hidden if there are none.

### Research `/research/`

- Long-form research statement, 120 to 180 words.
- Filter chips by theme and by status (Published, Under review, In preparation, Ongoing). *Island:* reads and writes `?theme=` and `?status=` in the URL. Without JavaScript, all projects show.
- Project cards: thumbnail, title, status badge, one-line summary, organism or target chips, method chips, year. Sorted by `order` field, then newest.

### Project detail `/research/[slug]/`

- Header: title, status badge, period, his role, supervisor, lab.
- Fixed sections, in order: **Question**, **Approach**, **My contribution**, **Findings**, **Outputs**, **Methods used**.
- **Findings** renders only when `resultsPublic: true`. Otherwise it shows "Results will be shared after publication." This protects unpublished work and co-authors.
- Optional figure components inside MDX: `<Figure>` with caption and alt text; `<MoleculeViewer>` *island* for docking poses (section 9); `<PhyloTree>` *island* (Phase 3).
- Footer: related publications, previous and next project.

### Publications `/publications/`

- Summary line: number of publications and total citations (OpenAlex). Aggregate metrics such as h-index stay hidden until there are three or more papers (config flag), because they look odd with one.
- Filter by type: Journal article, Preprint, Conference abstract, Thesis.
- Each entry: authors with Farhan's name in bold (match every name variant in config), title linking to its detail page, journal in italics, year, volume, article number, DOI link.
- Badges: Open Access, his role (First author, Co-author, Corresponding), citation count. Journal quartile only with its year and source, for example "Q1 (JCR 2024)".
- **Cite** button opens a native `<dialog>` with APA, Vancouver and BibTeX tabs and a copy button. *Island.*
- Link to download `/publications.bib`.

### Publication detail `/publications/[slug]/`

- Title, full author list, journal, date, DOI, open-access PDF link when one exists.
- Abstract from Crossref when available; otherwise the abstract field in YAML.
- Citation formats block, link to the related project page.
- In `<head>`: Highwire citation meta tags and `ScholarlyArticle` JSON-LD (section 10).

### CV `/cv/`

- **Download PDF** button, sticky on desktop.
- Sections: Education; Research experience; Publications (pulled from the collection, never typed twice); Training (BCSIR in-plant training); Workshops and seminars; Skills and methods (anchor `#skills`); Professional experience (scientific AI evaluation, behind a config toggle); Leadership; Awards; Memberships; Languages; References ("Available on request" only).
- Print stylesheet so the browser's print-to-PDF also produces a clean CV.

### Contact `/contact/`

- Email behind a **Show email** button that builds a `mailto:` link in JavaScript, to cut scraper spam. `<noscript>` fallback: `farhanishrakrafi [at] yahoo [dot] com`.
- Scholarly and professional profiles list.
- "Open to" list: PhD positions, research collaborations, QC, Microbiology and R&D roles.
- Time zone line: Dhaka, UTC+6.
- No phone number and no form in Phase 1.

### News `/news/`

Items grouped by year, newest first: date, one sentence, optional link. Feeds `/rss.xml`.

### Notes `/notes/` (Phase 3)

MDX articles with tags, reading time, sidebar table of contents, KaTeX math, Shiki code highlighting with a copy button, and a "Last updated" date. Good first posts: a colistin broth disk elution protocol, and a bacterial WGS-to-resistome pipeline walkthrough.

### 404

Short message, a search box (Phase 2), and links to Home, Research and Publications.

## 6. Content model and data schemas

All content lives in five typed collections plus two YAML files; the build fails loudly on any schema error, so a typo can never ship. Define them in `src/content.config.ts` using Astro's content layer (`glob()` and `file()` loaders) and Zod. Adjust import paths to the installed Astro version.

### Where each kind of content lives

| Content | File(s) | Loader | Edited how often |
| --- | --- | --- | --- |
| Site identity, links, availability | `src/data/profile.yaml` | `file()` | Rarely |
| CV sections | `src/data/cv.yaml` | `file()` | Per new item |
| Publications | `src/data/publications.yaml` | `file()` | Per paper |
| Projects | `src/content/projects/*.mdx` | `glob()` | Per project |
| News | `src/content/news/*.md` | `glob()` | Monthly |
| Notes | `src/content/notes/*.mdx` | `glob()` | Occasionally |
| Italic scientific terms | `src/data/italic-terms.yaml` | Read by a remark plugin | Per new organism or gene |

### Profile

```ts
const profile = z.object({
  name: z.string(),
  nameVariants: z.array(z.string()),      // used to bold his name in author lists
  headline: z.string().max(90),
  researchStatement: z.string().max(220), // one sentence for the hero
  affiliation: z.string(),
  location: z.string(),
  timezone: z.string(),
  email: z.string().email(),
  availability: z.string().optional(),   // empty string hides the banner
  photo: z.string(),                      // path under src/assets
  photoAlt: z.string(),
  links: z.object({
    orcid: z.string().url().optional(),
    scholar: z.string().url().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    researchgate: z.string().url().optional(),
  }),
  showProfessionalExperience: z.boolean().default(true),
});
```

### Publication

```ts
const publication = z.object({
  id: z.string(),                                   // slug, e.g. "islam-2025-scirep-buche"
  type: z.enum(['journal', 'preprint', 'conference', 'thesis', 'chapter']),
  status: z.enum(['published', 'accepted', 'under-review', 'in-preparation']),
  title: z.string(),
  authors: z.array(z.string()),
  year: z.number().int(),
  journal: z.string().optional(),
  volume: z.string().optional(),
  articleNumber: z.string().optional(),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
  pdf: z.string().url().optional(),
  openAccess: z.boolean().default(false),
  role: z.enum(['first-author', 'equal-first', 'co-author', 'corresponding']),
  abstract: z.string().optional(),                 // fallback when Crossref has none
  keywords: z.array(z.string()).default([]),
  selected: z.boolean().default(false),
  relatedProject: z.string().optional(),            // project slug
  quartile: z.object({ value: z.string(), source: z.string(), year: z.number() }).optional(),
});
```

Rule: entries with status `in-preparation` never show a target journal name.

### Project

```ts
const project = z.object({
  title: z.string(),
  summary: z.string().max(200),
  status: z.enum(['published', 'under-review', 'in-preparation', 'ongoing', 'completed']),
  themes: z.array(z.enum(['amr-genomics', 'drug-discovery', 'multi-omics', 'microbiome', 'other'])).min(1),
  role: z.string(),
  supervisor: z.string().optional(),
  lab: z.string().optional(),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  organisms: z.array(z.string()).default([]),       // rendered in italics
  targets: z.array(z.string()).default([]),         // genes or proteins
  methods: z.array(z.string()).min(1),
  featured: z.boolean().default(false),
  order: z.number().default(100),
  resultsPublic: z.boolean().default(false),        // false hides the Findings section
  visibility: z.enum(['public', 'draft']).default('draft'),
  publications: z.array(z.string()).default([]),    // publication ids
  links: z.object({
    code: z.string().url(), data: z.string().url(),
    preprint: z.string().url(), poster: z.string().url(),
  }).partial().default({}),
  cover: image().optional(),
  coverAlt: z.string().optional(),
}).refine((p) => !p.cover || !!p.coverAlt, { message: 'cover needs coverAlt' });
```

Rule: `visibility: 'draft'` is the default and is excluded from production builds. A project goes public only when Farhan flips it.

### News and notes

```ts
const news = z.object({
  date: z.coerce.date(),
  text: z.string().max(280),
  link: z.string().url().optional(),
});

const note = z.object({
  title: z.string(),
  description: z.string().max(160),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(true),
});
```

### CV

`cv.yaml` holds arrays for `education`, `researchExperience`, `training`, `workshops`, `experience`, `leadership`, `awards`, `memberships`, `languages`, and an object `skills` with keys `wetLab`, `genomics`, `structural`, `omics`, `tools`. Every dated item has `start`, optional `end`, `title`, `org`, `location`, and `bullets`. Publications are never typed into `cv.yaml`; the CV reads them from the publications collection.

## 7. Content inventory (pre-filled, confirm before publishing)

The tables below are the seed data Claude Code writes into the YAML and MDX files; only two projects start public, and everything unpublished defaults to `draft` until Farhan and his co-authors approve it.

### Profile values

| Field | Seed value |
| --- | --- |
| `name` | Farhan Ishrak Rafi |
| `headline` | Biochemist · Bacterial genomics · Computational drug discovery |
| `researchStatement` | I combine wet-lab microbiology with genome analysis and molecular simulation to study antimicrobial resistance and find new drug leads. |
| `affiliation` | Bioinformatics and Structural Biology Laboratory, Department of Biochemistry and Molecular Biology, University of Rajshahi |
| `location` / `timezone` | Dhaka, Bangladesh / Asia/Dhaka (UTC+6) |
| `email` | farhanishrakrafi@yahoo.com |
| `availability` | Open to fully funded PhD positions (2027 intake) and pharmaceutical QC, Microbiology and R&D roles. |
| `links.linkedin` | https://www.linkedin.com/in/farhanishrakrafi |
| `links.orcid`, `scholar`, `github`, `researchgate` | Empty until created (icons stay hidden) |

### Publications

| id | Citation | Role | Flags |
| --- | --- | --- | --- |
| `islam-2025-scirep-buche` | Islam MT, *et al.* In silico screening of naturally derived dietary compounds as potential butyrylcholinesterase inhibitors for Alzheimer's disease treatment. *Scientific Reports* 15, 17134 (2025). doi:10.1038/s41598-025-98092-y | Co-author | `selected`, `openAccess`; full author list fetched from Crossref at build |

### Projects

| Slug | Title (public wording) | Theme | Status | Starts as |
| --- | --- | --- | --- | --- |
| `mdr-ecoli-st361-genomics` | Phenotypic and genomic characterization of MDR *Escherichia coli* ST361 carrying *blaNDM-5* and *blaOXA-181* from a wound infection (M.Sc. thesis) | AMR genomics | In preparation | **public**, `featured`, `resultsPublic: false` |
| `buche-alzheimers-screening` | In silico screening of dietary compounds against butyrylcholinesterase | Drug discovery | Published | **public**, `featured`, `resultsPublic: true` |
| `providencia-comparative-genomics` | Comparative genomics of *Providencia stuartii* and *Providencia rettgeri* | AMR genomics | In preparation | draft |
| `pcos-obesity-mets-esr1` | Computational drug discovery across PCOS, obesity and metabolic syndrome (ESR1) | Drug discovery | In preparation | draft |
| `head-neck-cancer-mapk3` | Network pharmacology of head and neck cancer centred on MAPK3 | Drug discovery | In preparation | draft |
| `sjogren-multiomics` | Methylation and expression integration in Sjögren's syndrome | Multi-omics | Ongoing | draft |
| `gout-microbiome-meta-analysis` | Gut microbiome meta-analysis in gout and hyperuricemia | Microbiome | Ongoing | draft |
| `abroma-augusta-ethnobotany` | Quantitative ethnobotany and KAP survey of *Abroma augusta* | Other | Ongoing | draft |
| `tec-atlas-proposal` | Pan-cancer single-cell atlas of tumor endothelial cells (proposal) | Multi-omics | Proposal | draft |

Draft projects still get full MDX files, so turning one public is a one-word change. Draft summaries must name no compounds, journals or results.

### CV seed

| Section | Items |
| --- | --- |
| Education | M.Sc. Biochemistry and Molecular Biology, University of Rajshahi (appeared); B.Sc. (Honours), same department, CGPA 3.72/4.00. HSC (GPA 4.75, 2019) and SSC (GPA 5.00, 2017) stored with `showOnSite: false`, shown only in the Bangladesh CV variant |
| Research experience | M.Sc. thesis, Bioinformatics and Structural Biology Laboratory (supervisor Prof. Md. Tofazzal Hossain); Research Assistant, Biological Research on the Brain (BRB), May 2024 to February 2026 |
| Training | In-plant training, BCSIR Laboratories Rajshahi, 8 to 12 December 2024: hands-on UV-Visible spectrophotometry, FTIR-ATR, preparative HPLC; observed GC-MS, Ion-Trap MS, automated melting point, Biolog identification |
| Workshops | "Basics of Pharmaceuticals", University of Rajshahi, 31 May 2024; "Preparing for the Corporate World" seminar, 31 July 2026 |
| Professional experience | Scientific AI evaluation, freelance: Poindexter Labs (biology benchmark authoring), Mercor, Outlier (Scale AI), SME Careers, CNTXT AI, TELUS Digital, with the dates on the current CV |
| Leadership | ASM Student Chapter, University of Rajshahi: Vice President (2024 to 2025), Joint Secretary (2023) |
| Awards | Finalist (Top 10), Science, National STEAM Olympiad 2023; 4th place, 1st National Biotechnology Olympiad 2022; Round 2 qualifier, Chemical Metrology Olympiad 2023 (BRiCM) |
| Memberships | American Society for Microbiology; American Chemical Society; British Pharmacological Society; African Society for Laboratory Medicine |
| Languages | Bengali (native); English (full professional); Hindi (working) |
| Skills, wet lab | Aseptic technique; culture and media preparation; disc diffusion; broth microdilution; colistin broth disk elution; biochemical identification |
| Skills, genomics | WGS analysis; resistome, virulome and plasmidome profiling; MLST; phylogenomics; pangenome analysis |
| Skills, structural | Molecular docking; molecular dynamics (GROMACS); MM-GBSA; ADMET profiling; DFT |
| Skills, omics | Differential expression; WGCNA; PPI networks; microbiome (QIIME2, DADA2, LEfSe, PICRUSt2) |
| Tools | R; LaTeX; Linux command line |

### Farhan confirms before launch

- [ ] How his name appears in the *Scientific Reports* author list (sets `nameVariants`)
- [ ] Journal quartile wording, with its source and year, or drop the badge
- [ ] B.Sc. completion year to display (2024 or 2025)
- [ ] Each co-author is comfortable with the thesis title being public
- [ ] Which draft projects may go public, and with what wording
- [ ] Professional experience shows only what is already public on LinkedIn; no client codenames or NDA details
- [ ] A recent professional photo (the CV headshot works)

## 8. Design system

One brand colour, teal `#0F766E`, ties the site to Farhan's CV and LinkedIn banner; every text and background pair below was computed against WCAG and clears AA, the lowest at 5.20:1.

### Colour tokens (CSS custom properties, switched by `data-theme`)

| Token | Light | Dark | Contrast checked |
| --- | --- | --- | --- |
| `--bg` | `#FFFFFF` | `#0B1312` |  |
| `--surface` | `#F6FAF9` | `#111C1B` |  |
| `--text` | `#111827` | `#E6EDEC` | 17.74:1 light, 15.85:1 dark |
| `--muted` | `#4B5563` | `#9FB0AE` | 7.18:1 light on surface, 7.71:1 dark on surface |
| `--primary` (links, accents) | `#0F766E` | `#2DD4BF` | 5.20:1 light on surface, 9.36:1 dark on surface |
| `--on-primary` (button text) | `#FFFFFF` | `#0B1312` | 5.47:1 light, 10.11:1 dark |
| `--border` | `#D1D9D8` | `#1F2F2D` | Decorative only |

### Status badges (always text plus colour, never colour alone)

| Status | Text on background | Contrast |
| --- | --- | --- |
| Published | `#115E59` on `#CCFBF1` | 6.73:1 |
| Under review | `#1E40AF` on `#DBEAFE` | 7.15:1 |
| In preparation | `#92400E` on `#FEF3C7` | 6.37:1 |
| Ongoing | `#334155` on `#E2E8F0` | 8.40:1 |

Dark-mode badges reuse the same hues at higher lightness; Claude Code verifies each with axe in CI.

### Typography

- Headings: **Source Serif 4** (academic tone). Body and UI: **Inter**. Code: **JetBrains Mono**.
- Self-host all three with `@fontsource` packages, Latin subset, `font-display: swap`. No Google Fonts requests.
- Base size 17 px, line height 1.6, measure 68 characters for prose. Scale ratio 1.25: 14, 17, 21, 27, 33, 42 px.
- Fallback stacks: `ui-serif, Georgia, serif` and `ui-sans-serif, system-ui, sans-serif`.

### Layout and spacing

- Content container 1120 px; prose column 720 px; 4 px spacing base (Tailwind defaults).
- Radius: 10 px cards, full-round chips. Shadows only on hover for cards.
- Breakpoints: 640, 768, 1024, 1280 px. Design mobile-first; test at 360 px wide.

### Components

`Header`, `Footer`, `Hero`, `AvailabilityBanner`, `ThemeCard`, `ProjectCard`, `StatusBadge`, `Chip`, `Button` (primary, secondary, ghost), `IconLink`, `PublicationItem`, `CiteDialog`, `Figure`, `MoleculeViewer`, `CvTimeline`, `SkillMatrix`, `NewsList`, `Toc`, `Callout`, `CopyButton`, `ThemeToggle`, `SearchButton`.

### Dark mode and motion

- Default follows `prefers-color-scheme`; the toggle stores the choice in `localStorage`. An inline script in `<head>` sets `data-theme` before paint, so there is no flash.
- Motion is limited to 150 to 200 ms fades and lifts. All of it switches off under `prefers-reduced-motion: reduce`. No parallax, no autoplay.

### Scientific typography rules (enforced, not optional)

1. Species names in italics: full binomial at first mention on a page (*Escherichia coli*), abbreviated after (*E. coli*).
2. Gene names in italics (*blaNDM-5*, *blaOXA-181*, *MAPK3* as a gene); protein names in roman (MAPK3 as a protein).
3. A remark plugin reads `src/data/italic-terms.yaml` and italicises listed terms automatically in Markdown and MDX, skipping code and URLs. Seed list: *Escherichia coli*, *E. coli*, *Providencia stuartii*, *P. stuartii*, *Providencia rettgeri*, *P. rettgeri*, *Abroma augusta*, *Klebsiella pneumoniae*, *blaNDM-5*, *blaOXA-181*.
4. Units with a space (37 °C, 10 mg/mL); real symbols (µ, °, ×, superscript exponents).
5. **No em dashes anywhere in site copy.** Use commas, colons, or a new sentence. A lint step fails the build if the em dash character appears in `src/content` or `src/data`.

## 9. Advanced features

The site does its clever work at build time, so visitors get plain HTML; only three features ship any JavaScript, and each loads only when needed.

| Feature | What it does | How | Phase | Client JS |
| --- | --- | --- | --- | --- |
| DOI enrichment | Fills author lists, journal details, abstract and open-access link from a DOI alone | Build script calls Crossref and OpenAlex | 1 | None |
| Citation metrics | Shows citation counts with an "as of" date | OpenAlex, refreshed weekly by a scheduled workflow | 1 | None |
| Citation export | APA, Vancouver and BibTeX per paper, plus `/publications.bib` | `citation-js` runs at build; strings are embedded | 1 | Copy button only |
| Social cards | A 1200 × 630 image per page for LinkedIn and X previews | `satori` + `@resvg/resvg-js` at build | 1 | None |
| Italic scientific terms | Auto-italicises species and genes | Custom remark plugin (section 8) | 1 | None |
| Last-updated dates | Real dates from Git history | `git log` at build, checkout with full history | 1 | None |
| CV as code | `/cv.pdf` compiled from LaTeX in CI | LaTeX GitHub Action | 2 | None |
| Site search | Searches projects, papers and notes | Pagefind, indexed after build | 2 | Loads on search open |
| RSS | Feed for news and notes | `@astrojs/rss` | 2 | None |
| 3D molecule viewer | Rotate a docked ligand in its protein pocket | 3Dmol.js, `client:visible` | 3 | Only on pages that use it |
| Math and code in notes | Equations and highlighted code | `remark-math`, `rehype-katex`, Astro's built-in Shiki | 3 | None |
| Analytics | Visit counts, no cookies, no banner needed | Cloudflare Web Analytics or GoatCounter | 2 | One small deferred script |

### DOI enrichment contract (`scripts/enrich-publications.ts`)

1. Runs before `astro build`. Reads `src/data/publications.yaml`.
2. For each DOI, calls Crossref `https://api.crossref.org/works/{doi}` with a `User-Agent` that includes a contact email (Crossref's polite pool).
3. Calls OpenAlex `https://api.openalex.org/works/doi:{doi}` for `cited_by_count`, open-access status and the OA URL.
4. OpenAlex now requires a free API key for production use; single-record lookups by DOI are free with no volume cap ([CASRAI summary of the OpenAlex announcement](https://casrai.org/news/openalex-api-keys-mandatory-usage-based-pricing-2026)). Farhan creates the key; it is stored as the GitHub Actions secret `OPENALEX_API_KEY`, never in code.
5. Writes `src/data/generated/publications.enriched.json`, committed to the repository as a cache.
6. **Never breaks the build.** On any network error, missing key or 4xx/5xx response, it keeps the last cached record and logs a warning. Manual YAML fields always override fetched ones.
7. Paces requests at one per second and retries twice with backoff.

### Weekly metrics refresh

A scheduled workflow runs every Monday at 03:00 UTC, re-runs enrichment, and commits the JSON only if numbers changed; that commit triggers a normal deploy. Pages show "Citations: N (OpenAlex, as of DATE)."

### 3D molecule viewer (`MoleculeViewer.astro`)

- Props: `structure` (path to a PDB or SDF in `public/structures/`), `ligand` (residue name to highlight), `caption`, `alt` (required), `fallback` (PNG path).
- Renders the fallback image and a text description first. 3Dmol.js loads only when the viewer scrolls into view.
- Buttons, all keyboard-operable: Rotate on or off, Reset view, Cartoon, Surface, Sticks.
- Use only for published work. First use: the published butyrylcholinesterase screening project, with a structure file Farhan supplies.

### CV as code

- Phase 2: commit the international academic CV's `.tex` source to `cv/`; CI compiles it with a LaTeX GitHub Action and copies the PDF to `public/cv.pdf`. Times New Roman family, matching Farhan's academic documents.
- Phase 3: a script renders `cv.yaml` and the publications collection into the LaTeX template, so the CV and the site share one source of truth.
- Only the international academic CV goes in this public repository. The Bangladesh-format CV with personal details is never committed (section 11).

## 10. SEO and scholarly discoverability

Each publication page follows Google Scholar's own inclusion rules: one paper per URL, Highwire Press meta tags, and the full abstract visible without any click ([Google Scholar inclusion guidelines](http://scholar.google.com/intl/en/scholar/inclusion.html)).

### Google Scholar requirements, built into `/publications/[slug]/`

| Rule from Google Scholar | How the site meets it |
| --- | --- |
| Each paper needs its own URL | One detail page per publication |
| `citation_title`, at least one `citation_author`, and `citation_publication_date` are required | Rendered in `<head>` from enriched data; one `citation_author` tag per author, no affiliations |
| Date format like "2010/5/12", or year alone | Format `YYYY/M/D` from Crossref's published date |
| Journal papers also need journal title, volume, issue, first page | `citation_journal_title`, `citation_volume`, `citation_issue`, `citation_firstpage` (the article number, e.g. 17134) |
| `citation_pdf_url` must be absolute and in the same subdirectory as the HTML abstract | If a PDF is hosted, it lives at `/publications/[slug]/paper.pdf` |
| Full abstract visible with no sign-in, click or scroll | Abstract sits directly under the title; never collapsed |
| Articles reachable in at most ten simple HTML links from home | `/publications/` lists every paper with plain `<a>` links; filters are progressive enhancement |
| `robots.txt` must not block articles | `robots.txt` allows all and points to the sitemap |
| PDFs under 5 MB with searchable text | Enforced by a CI size check |

Hosting a PDF copy is optional and only allowed when the licence permits; *Scientific Reports* articles are open access, but Farhan confirms the licence on the article page first. Scholar notes that updates to already-indexed papers can take 6 to 9 months, so get the tags right at launch.

### Structured data (JSON-LD)

| Page | Schema.org type | Key fields |
| --- | --- | --- |
| Home | `Person` | `name`, `jobTitle`, `affiliation` (University of Rajshahi), `alumniOf`, `knowsAbout`, `image`, `url`, `sameAs` (ORCID, Scholar, LinkedIn, GitHub) |
| Publication detail | `ScholarlyArticle` | `headline`, `author[]`, `datePublished`, `isPartOf` (journal and volume), `identifier` (DOI as `PropertyValue`), `sameAs` (doi.org URL), `license` |
| Project detail | `CreativeWork` | `name`, `about`, `creator`, `dateCreated`, `keywords` |
| Every page | `BreadcrumbList` | Path from home |

Validate every type with Google's Rich Results Test and the Schema.org validator as part of Phase 4.

### Page metadata

- Title template: `Page title · Farhan Ishrak Rafi`; home page uses `Farhan Ishrak Rafi · Biochemist and computational biologist`.
- Meta description: 120 to 155 characters, written per page, never auto-truncated body text.
- Canonical URL on every page from the single `site` value in `astro.config.mjs`.
- Open Graph and Twitter `summary_large_image` tags using the generated social card.
- `@astrojs/sitemap` builds the sitemap and excludes drafts and `/404.html`.

### Identity across the scholarly web (Farhan does these once)

1. Create an **ORCID iD**; add the website URL to the ORCID record and the ORCID link to the site.
2. Create a **Google Scholar profile** under the exact name "Farhan Ishrak Rafi"; claim the *Scientific Reports* paper; add the website URL.
3. Verify the site in **Google Search Console** with the HTML meta-tag method; submit the sitemap. Import the property into Bing Webmaster Tools.
4. Add the website to LinkedIn's contact info and Featured section, and to the email signature.
5. Use the same name spelling everywhere so author disambiguation works.

## 11. Accessibility, performance and privacy

The repository is public and its Git history is permanent, so the privacy list below is a hard rule, not a preference.

### Accessibility (WCAG 2.2 AA)

- Landmarks on every page: `header`, `nav`, `main`, `footer`; exactly one `h1`; headings never skip a level.
- Skip link first in the tab order; visible focus ring (2 px `--primary` outline, 2 px offset) that is never hidden by the sticky header.
- Interactive targets at least 24 × 24 CSS px; 44 × 44 px for main buttons and the mobile menu.
- `CiteDialog` uses native `<dialog>`: focus moves in on open, Escape closes, focus returns to the trigger.
- Every image needs `alt`; the schema enforces it. Decorative images use `alt=""`.
- `lang="en"` on `<html>`; any Bengali phrase wrapped in `lang="bn"`.
- Link text describes the destination; external links get a visually hidden "(opens external site)" note.
- The 3D viewer always has a text description and a static image alternative.
- CI runs axe-core through Playwright on every page and fails on any violation. Before launch Farhan does one keyboard-only pass and one TalkBack pass on Android.

### Performance budgets (enforced by Lighthouse CI)

| Budget | Limit |
| --- | --- |
| Home page total weight | Under 500 KB |
| JavaScript per page (gzipped) | Under 50 KB; zero on pages without islands |
| Hero photo | Under 60 KB, AVIF with WebP fallback, explicit width and height |
| Fonts | Three families, Latin subset, under 150 KB total |
| Largest Contentful Paint | Under 2.0 s, simulated 4G |
| Cumulative Layout Shift | Under 0.05 |
| Interaction to Next Paint | Under 200 ms |

Test also with 3G throttling, since many visitors from Bangladesh browse on mobile data. Images below the fold load lazily; only the hero image and one font weight are preloaded.

### Never published, in any file or commit

| Never publish | Why | Where it goes instead |
| --- | --- | --- |
| Date of birth, parents' names, religion, marital status, blood group, NID | Identity theft and discrimination risk; irrelevant to academic hiring | Bangladesh-format CV kept on his computer only |
| Phone number and permanent home address | Spam and safety | Shared directly with employers on request |
| Referees' emails and phone numbers | Their data, not his | "References available on request" |
| Unpublished results, figures, compound names | Protects co-authors and journal novelty | Released when the paper is out |
| Clinical or patient metadata from the wound isolate | Patient confidentiality | Never; genome data goes to NCBI or ENA with an accession |
| Freelance client confidential details or project codenames | NDAs | Only what is already public on LinkedIn |
| API keys and tokens | Account abuse | GitHub Actions secrets |

Safeguards Claude Code must add:

1. A `gitleaks` secret scan in CI and as a pre-commit hook.
2. `.gitignore` entries for `cv/private/`, `*.local.*` and `.env*`.
3. A CI check that fails if a phone number pattern or the words "Date of Birth", "Blood Group", "Marital Status" or "Religion" appear in `src/` or `cv/`.

If something private is ever committed, deleting the file is not enough: rewrite history and rotate any exposed key.

### Analytics and privacy note

Use cookieless analytics only (Cloudflare Web Analytics or GoatCounter), so no consent banner is needed. A two-sentence privacy note in the footer states what is counted and that no cookies are set.

## 12. Repository structure and CI/CD

Three workflows run the site: `deploy.yml` publishes on every push, `quality.yml` blocks bad changes, and `metrics.yml` refreshes citations weekly.

### File tree

```text
farhanishrakrafi.github.io/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          # build + deploy to GitHub Pages
│   │   ├── quality.yml         # links, a11y, Lighthouse, secrets, privacy, em dash
│   │   └── metrics.yml         # weekly OpenAlex refresh
│   └── dependabot.yml          # monthly dependency updates
├── cv/
│   ├── cv.tex                  # international academic CV (public)
│   └── private/                # gitignored; Bangladesh CV never committed
├── public/
│   ├── favicon.svg
│   └── structures/             # PDB and SDF files for MoleculeViewer
├── scripts/
│   ├── enrich-publications.ts  # Crossref + OpenAlex, cached, never fails the build
│   ├── check-privacy.ts        # blocks personal-data patterns
│   └── check-emdash.ts         # blocks the em dash character in content
├── src/
│   ├── assets/                 # photo, project covers
│   ├── components/             # list in section 8
│   ├── config/site.ts          # site URL, nav, feature flags
│   ├── content/
│   │   ├── projects/*.mdx
│   │   ├── news/*.md
│   │   └── notes/*.mdx
│   ├── content.config.ts       # Zod schemas from section 6
│   ├── data/
│   │   ├── profile.yaml
│   │   ├── cv.yaml
│   │   ├── publications.yaml
│   │   ├── italic-terms.yaml
│   │   └── generated/publications.enriched.json
│   ├── layouts/                # BaseLayout, ProseLayout
│   ├── lib/                    # citations, seo, jsonld, git-dates
│   ├── pages/                  # routes from section 4, plus rss.xml.ts, publications.bib.ts, og/
│   ├── plugins/remark-italic-terms.ts
│   └── styles/global.css
├── tests/                      # Playwright smoke + axe accessibility tests
├── astro.config.mjs
├── lighthouserc.json
├── package.json + lockfile     # the lockfile must be committed
├── CLAUDE.md
├── SPEC.md                     # this document, exported as Markdown
├── LICENSE                     # MIT, code
└── CONTENT-LICENSE             # CC BY 4.0, text and images
```

### `deploy.yml` (from Astro's official guide, verified on the as-of date)

Astro's guide for GitHub Pages uses `actions/checkout@v6`, `withastro/action@v6` and `actions/deploy-pages@v5`, with Node 24 as the default ([Astro: Deploy to GitHub Pages](https://docs.astro.build/zh-tw/guides/deploy/github/)). Because the repository is named `farhanishrakrafi.github.io`, `site` is `https://farhanishrakrafi.github.io` and no `base` is set.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0            # full history for "last updated" dates
      # Phase 2: compile cv/cv.tex with a LaTeX action, copy the PDF to public/cv.pdf
      - uses: withastro/action@v6
        env:
          OPENALEX_API_KEY: ${{ secrets.OPENALEX_API_KEY }}
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

The `build` script in `package.json` runs enrichment, then `astro build`, then `pagefind --site dist`. In repository Settings, Pages source must be set to **GitHub Actions**. Before coding, Claude Code re-checks the official guide for newer action versions.

### `quality.yml` (on every pull request and push)

1. Install and build.
2. `gitleaks` secret scan.
3. `scripts/check-privacy.ts` and `scripts/check-emdash.ts`.
4. Link check on the built site with `lychee` (external links allowed to time out without failing).
5. Playwright smoke tests plus axe-core on every route; any violation fails.
6. Lighthouse CI with the budgets from section 11.
7. PDF size check: every file in `public/` ending `.pdf` under 5 MB.

### `metrics.yml` (weekly)

- Trigger: `schedule: cron '0 3 * * 1'` plus `workflow_dispatch`. Permissions: `contents: write`, `actions: write`.
- Steps: checkout, install, run `enrich-publications.ts`, commit `publications.enriched.json` only if it changed.
- Then run `gh workflow run deploy.yml`. Pushes made with the default `GITHUB_TOKEN` do not start other workflows, but a `workflow_dispatch` does, so this explicit call is required.
- GitHub may pause scheduled workflows in a quiet public repository; if citations stop updating, re-enable the workflow in the Actions tab.

## 13. Build plan for Claude Code

Claude Code builds in four phases; each phase ends with a deploy and must meet its acceptance criteria before the next one starts.

### Phase 0: Farhan's setup (manual, about one hour)

- [ ] Create the GitHub account `farhanishrakrafi` and a **public** repository named `farhanishrakrafi.github.io`
- [ ] Install Git, Node.js (the version Astro's guide currently defaults to, 24 at the time of writing) and Claude Code
- [ ] Create a free OpenAlex API key and add it as the repository secret `OPENALEX_API_KEY`
- [ ] Create ORCID and Google Scholar profiles (section 10)
- [ ] Export this document as Markdown, save it as `SPEC.md` in the repository root, and add `CLAUDE.md` from below
- [ ] Put the headshot at `src/assets/photo.jpg`
- [ ] In repository Settings, Pages, set Source to **GitHub Actions**

### Phases and acceptance criteria

1. **Phase 1: Foundation and launch.** Scaffold the latest stable Astro with strict TypeScript and Tailwind; design tokens; layouts; content config and schemas; seed data from section 7; Home, Research, Project detail, Publications, Publication detail, CV (HTML), Contact, 404; enrichment script with cache; citation export; meta tags, Open Graph, sitemap, robots, JSON-LD, Highwire tags; italic-terms plugin; privacy and em dash checks; `deploy.yml`.
   - Accept when: the site is live at `https://farhanishrakrafi.github.io`; Lighthouse 95+ in all four categories on Home, Research and one publication page; zero axe violations; drafts absent from the build and sitemap; the build passes with the OpenAlex key removed.
2. **Phase 2: Quality, search and CV.** `quality.yml` and `metrics.yml`; Pagefind search; News and RSS; social card generation; CV PDF compiled in CI; cookieless analytics; dark-mode polish.
   - Accept when: all CI checks green on a pull request; search finds the thesis project by typing "NDM"; `/cv.pdf` is produced by CI, not committed by hand; LinkedIn's Post Inspector shows the social card.
3. **Phase 3: Advanced showcase.** `MoleculeViewer` on the published butyrylcholinesterase project; Notes with KaTeX; `cv.yaml` to LaTeX generator.
   - Accept when: the viewer works by keyboard, shows its fallback without JavaScript, and loads no script until scrolled into view; JavaScript budgets from section 11 still hold.
4. **Phase 4: Discoverability and audit.** Search Console verification and sitemap submission; Rich Results and Schema.org validation; final keyboard and screen-reader pass; README with the maintenance playbook.
   - Accept when: Search Console shows the sitemap as processed with no errors; every JSON-LD type validates; README explains section 14 in plain steps.

### `CLAUDE.md` (paste into the repository root)

```markdown
# CLAUDE.md: rules for building farhanishrakrafi.github.io

Read SPEC.md fully before writing code. It is the source of truth. If something in SPEC.md looks wrong or conflicts, stop and ask; do not improvise.

## Commands
- npm run dev       local server
- npm run build     enrichment + astro build + pagefind
- npm run check     astro check and type check
- npm run test      Playwright smoke + axe accessibility
- npm run lint      privacy check + em dash check

## Hard rules
1. Never invent facts. Publications, dates, affiliations, metrics, co-authors and results come only from files in src/data and src/content. Missing data means an empty field, not a guess.
2. Never publish personal data listed in SPEC.md section 11. Never commit secrets; use GitHub Actions secrets.
3. Projects with visibility "draft" must not appear in any built page, the sitemap, the search index or RSS.
4. Findings render only when resultsPublic is true.
5. No em dash character anywhere in site copy. Use commas, colons or a new sentence.
6. Species and gene names in italics (SPEC.md section 8).
7. Zero client JavaScript by default. Only CiteDialog, search, theme toggle, research filters and MoleculeViewer may ship JS, each lazily.
8. Every image has alt text. Every page passes axe with zero violations.
9. Only free services. Do not add anything that needs a paid plan or a card.
10. Do not create the is-a.dev pull request; Farhan files it himself.

## Working style
- Before pinning any action or package version, check its official docs for the current major version.
- Work one phase at a time. Small commits, one feature each. Run build, check, lint and test before every commit.
- After each phase, report which acceptance criteria pass, with evidence (Lighthouse scores, axe output, URLs).
- Copy is plain and specific: no hype words, short sentences.
```

### Kickoff prompt for Claude Code

```text
Read SPEC.md and CLAUDE.md in full. Then plan Phase 1 only: list the tasks in order,
map each one to a Phase 1 acceptance criterion, and name any data you need from me.
Wait for my OK before writing code. After I approve, build Phase 1, deploy it, and
report each acceptance criterion as pass or fail with evidence.
```

Run one phase per Claude Code session, starting the next phase with the same prompt and its phase number.

## 14. Maintenance playbook and open questions

After launch, every routine update is a one-file edit that deploys itself within three minutes of the commit; no code is touched.

### Routine updates

| Task | Edit this | Time |
| --- | --- | --- |
| Add a publication | New entry in `src/data/publications.yaml` with DOI, role, `selected`; enrichment fills the rest | 3 min |
| Make a draft project public | Set `visibility: public`; add `resultsPublic: true` once the paper is out | 1 min |
| Post news | New file `src/content/news/YYYY-MM-DD-short-title.md` | 2 min |
| Update the CV | `src/data/cv.yaml` (and `cv/cv.tex` until Phase 3 automates it) | 5 min |
| Change the availability banner | `availability` in `src/data/profile.yaml`; empty string hides it | 1 min |
| Add an organism or gene to auto-italics | `src/data/italic-terms.yaml` | 1 min |
| Replace the photo | `src/assets/photo.jpg`, same file name | 1 min |

No computer nearby? Open the repository on GitHub, press the `.` key to open the web editor, edit the file, and commit. The deploy runs automatically.

### Regular checks

- **Monthly:** merge Dependabot pull requests whose CI is green.
- **Quarterly:** read the link-check report and Search Console coverage; fix any broken link or excluded page.
- **Yearly:** refresh the photo, the research statement and the journal-quartile badge year.

### Open questions only Farhan can answer

- [ ] Is the GitHub username `farhanishrakrafi` available, or which variant will he use?
- [ ] Should scientific AI evaluation work appear on the site, given PhD supervisors and pharma recruiters as the main readers?
- [ ] Host a PDF copy of the *Scientific Reports* paper, or link only to the publisher?
- [ ] Which structure file and docked pose should the 3D viewer show, and does the corresponding author agree?
- [ ] Keep `farhanishrakrafi@yahoo.com` as the public address, or create a dedicated professional one?
- [ ] Add an `is-a.dev` vanity subdomain later, or stay on `github.io`?
- [ ] Is a Bengali-language version wanted in a later phase?

### Sources (opened on the as-of date)

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), GitHub Docs
- [Google Scholar inclusion guidelines for webmasters](http://scholar.google.com/intl/en/scholar/inclusion.html), Google Scholar
- [Deploy your Astro site to GitHub Pages](https://docs.astro.build/zh-tw/guides/deploy/github/), Astro Docs
- [OpenAlex API keys now mandatory, tiered pricing](https://casrai.org/news/openalex-api-keys-mandatory-usage-based-pricing-2026), CASRAI, 29 July 2026
