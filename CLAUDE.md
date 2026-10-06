# CLAUDE.md: rules for building this site

Read SPEC.md fully before writing code. It is the source of truth. If something in SPEC.md looks wrong or conflicts, stop and ask; do not improvise.

## Commands
- npm run dev       local server (drafts visible)
- npm run build     enrichment + astro build + pagefind
- npm run check     astro check and type check
- npm run test      Playwright smoke + axe accessibility (after a build)
- npm run lint      privacy check + em dash check + PDF size check
- npm run cv:tex    regenerate cv/cv.tex from the YAML data

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
11. Every internal link goes through `url()` from src/lib/paths.ts, so the site works under a sub-path.

## Working style
- Before pinning any action or package version, check its official docs for the current major version.
- Small commits, one feature each. Run build, check, lint and test before every commit.
- Report which acceptance criteria pass, with evidence (Lighthouse scores, axe output, URLs).
- Copy is plain and specific: no hype words, short sentences.
- Items marked CONFIRM in data files wait for Farhan; never fill them in.
