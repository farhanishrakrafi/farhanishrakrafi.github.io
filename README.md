# Farhan Ishrak Rafi: academic website

A static, zero-cost academic profile built with [Astro](https://astro.build) and hosted on GitHub Pages.
All content lives in plain YAML and Markdown files; every push to `main` rebuilds and redeploys the site in about three minutes.

- **Live address (once Pages is switched on):** `https://farhanishraq184-max.github.io/Website/`
- **Specification:** [SPEC.md](SPEC.md). **Rules for AI assistants:** [CLAUDE.md](CLAUDE.md).

---

## Going live: step by step

You need only a web browser for steps 1 to 4.

### 1. Choose the address

| Option | Address | What to do |
| --- | --- | --- |
| A. Keep the repository name `Website` | `https://farhanishraq184-max.github.io/Website/` | Nothing. This works as is. |
| B. Root address (recommended) | `https://farhanishraq184-max.github.io/` | Repository **Settings > General > Repository name**: rename to `farhanishraq184-max.github.io`. Then in `src/config/site.ts` set `defaultBase = ''` and update `repository`. |
| C. The spec's address | `https://farhanishrakrafi.github.io/` | Needs a GitHub account named `farhanishrakrafi`, with this code in a repository called `farhanishrakrafi.github.io`. |

The deploy workflow reads the real address from GitHub Pages on every build, so the live site is always correct whichever option you pick.
The `site.ts` values only matter for builds on your own computer.

### 2. Put the code on `main`

The site deploys from the `main` branch. If the code is on another branch, either merge its pull request into `main`,
or, if `main` does not exist yet, rename the branch: **Settings > General > Default branch**, click the pencil icon, and rename it to `main`.

### 3. Switch on GitHub Pages

**Settings > Pages > Build and deployment > Source: GitHub Actions.**

### 4. Run the first deploy

**Actions > Deploy to GitHub Pages > Run workflow** (or push any commit to `main`).
When the run is green, the address appears in the run summary and under **Settings > Pages**.

### 5. Recommended, all free

1. **Photo.** Save a square headshot as `src/assets/photo.jpg`. Until then the site shows your initials.
2. **OpenAlex key** (citation counts). Create a free key at [openalex.org](https://openalex.org), then
   **Settings > Secrets and variables > Actions > New repository secret**, name `OPENALEX_API_KEY`.
   Without it the site still builds; citation counts just stay hidden.
   Then run **Actions > Refresh citation metrics > Run workflow** once.
3. **ORCID and Google Scholar.** Create both (use the exact name "Farhan Ishrak Rafi"), claim the *Scientific Reports* paper,
   and paste the profile URLs into `links` in `src/data/profile.yaml`. Empty links stay hidden.
4. **Google Search Console.** Add the site as a URL-prefix property, choose the **HTML tag** method,
   copy the `content="..."` code into `VERIFICATION.google` in `src/config/site.ts`, commit, wait for the deploy, then click Verify.
   Submit `sitemap-index.xml` under **Sitemaps**. Import the property into Bing Webmaster Tools.
5. **Analytics (optional, cookieless).** Sign up at [goatcounter.com](https://www.goatcounter.com), then put your code in
   `ANALYTICS.goatcounterCode` in `src/config/site.ts`. The footer privacy note updates itself.
6. **LinkedIn.** Add the website to your contact info, Featured section and email signature.

### 6. Confirm before you share the link

Search the repository for `CONFIRM` to find every item below.

- [ ] How your name appears in the *Scientific Reports* author list (`nameVariants` in `profile.yaml`).
- [ ] Journal quartile badge: add `quartile` with its source and year in `publications.yaml`, or leave it out.
- [ ] B.Sc. completion year (`end` in `cv.yaml`) and dates for the scientific AI evaluation work.
- [ ] Wording of the research statement (`src/data/research-statement.md`).
- [ ] Your contribution, dates and methods on the two public projects (`src/content/projects/`).
- [ ] Co-authors are happy for the thesis title to be public.
- [ ] Which draft projects may go public, and with what wording.
- [ ] Professional experience shows only what is already public on LinkedIn.
- [ ] The two draft notes in `src/content/notes/` (they stay hidden until `draft: false`).

---

## Updating the site

Every routine update is a one-file edit. Commit it on GitHub (press `.` in the repository to open the web editor) and the site redeploys itself.

| Task | Edit this | Time |
| --- | --- | --- |
| Add a publication | New entry in `src/data/publications.yaml` with its DOI, `role` and `selected`. The build fetches authors, date, abstract and citations. | 3 min |
| Make a draft project public | `visibility: public` in its file in `src/content/projects/`; add `resultsPublic: true` once the paper is out | 1 min |
| Post news | New file `src/content/news/YYYY-MM-DD-short-title.md` (copy an existing one) | 2 min |
| Update the CV | `src/data/cv.yaml`. The PDF at `/cv.pdf` is rebuilt from it automatically. | 5 min |
| Change the availability banner | `availability` in `src/data/profile.yaml`; `''` hides it | 1 min |
| Add an organism or gene to auto-italics | `src/data/italic-terms.yaml` | 1 min |
| Replace the photo | `src/assets/photo.jpg`, same file name | 1 min |
| Publish a note | Set `draft: false` in its file in `src/content/notes/` | 1 min |
| Show a 3D docking pose | Put the PDB or SDF file in `public/structures/`, then add `<MoleculeViewer structure="file.pdb" ligand="LIG" alt="..." caption="..." />` to a published project | 10 min |

Writing rules (the build enforces the first two):

- No em dashes. Use a comma, colon or new sentence.
- Never add date of birth, phone numbers, home address, ID numbers, referee contacts, unpublished results or patient data. The repository is public and its history is permanent.
- Species and gene names listed in `italic-terms.yaml` are italicised automatically; write the full binomial first on a page, then the abbreviation.

### Regular checks

- **Monthly:** merge Dependabot pull requests whose checks are green.
- **Quarterly:** read the link-check report in the latest **Quality** run, and Search Console's page coverage.
- **Yearly:** refresh the photo, the research statement and the quartile badge year.
- If citation counts stop updating, GitHub may have paused the weekly workflow: re-enable it under **Actions > Refresh citation metrics**.

---

## Working on your computer

Needs [Node.js](https://nodejs.org) 22.12 or newer (24 recommended) and Git.

```bash
npm install          # also installs the pre-commit check
npm run dev          # local preview at http://localhost:4321/Website/ (drafts are visible here only)
npm run build        # fetch publication data, build the site and the search index into dist/
npm run check        # type check
npm run lint         # privacy, em dash and PDF size checks
npm test             # Playwright smoke tests and axe accessibility tests (run npm run build first)
npm run cv:pdf       # build public/cv.pdf locally (needs LaTeX; CI does this for you)
```

For the pre-commit secret scan, install [gitleaks](https://github.com/gitleaks/gitleaks#installing); CI runs it on every push either way.

## How it works

| Piece | Where |
| --- | --- |
| Site settings, navigation, analytics and verification codes | `src/config/site.ts` |
| Profile, CV, publications, themes, italic terms | `src/data/*.yaml` |
| Projects, news, notes | `src/content/` (schemas in `src/content.config.ts`) |
| Pages | `src/pages/` |
| Components and layouts | `src/components/`, `src/layouts/` |
| DOI enrichment (Crossref, OpenAlex), cached in `src/data/generated/` | `scripts/enrich-publications.ts` |
| CV LaTeX generator | `scripts/build-cv-tex.ts` writes `cv/cv.tex` |
| Privacy, em dash and PDF size checks | `scripts/check-*.ts` |
| Deploy, quality gate, weekly citation refresh | `.github/workflows/` |

Build-time features: DOI enrichment, citation export (APA, Vancouver, BibTeX and `/publications.bib`), social cards (`/og/*.png`),
Google Scholar meta tags, JSON-LD, sitemap, RSS, Pagefind search and the CV PDF.
The only browser JavaScript is the theme toggle, research filters, cite dialog, copy buttons, the email button, search and the 3D viewer, each a few kilobytes except 3Dmol.js, which loads only when a viewer scrolls into view.

## Licence

Code: [MIT](LICENSE). Text and images: [CC BY 4.0](CONTENT-LICENSE).
