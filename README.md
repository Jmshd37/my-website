# Jamshidbek Nurmukhammadov — Portfolio

A responsive personal portfolio and printable CV. Plain HTML, CSS and JavaScript, with no framework, dependencies or third-party requests.

## Edit without touching the design

1. Open **editor.html** on your hosted site or through a local server.
2. Expand a section and edit the fields. Add/remove experiences, projects and skills using the controls.
3. In **Sections**, move sections up/down or turn **Enabled** off to hide them. IDs must stay one of: about, experience, education, projects, recommendations, skills, contact. Do not duplicate IDs.
4. Choose **Update preview**.
5. Download **both content.json and index.html**. Replace both files in this repository in one commit. If changing the site address under SEO, also download **robots.txt** and **sitemap.xml**.
6. Publish through your existing deployment process.

The editor runs only in your browser. It does not write to GitHub or save automatically. Anyone can open it, but they cannot change your website without repository access. Download your files before leaving the tab. The preview can differ in width from the published site; test both desktop and mobile after changing long text.

The public-facing site remains readable if JavaScript is disabled. Interactive controls appear only when their scripts run.

## Edit as a developer

Node.js 20 or later is required only for building/testing, not hosting. No install step is needed.

~~~sh
node build.mjs
node --test
~~~

Edit **content.json**, then run the build and commit the JSON and generated **index.html**, **robots.txt** and **sitemap.xml**. Biography, contact details, experience, case studies, transcript, recommendations, skills and translations live in this one file. Never hand-edit the generated page: the build preserves the existing moon logo through `profile.logo`.

- **profile.resumeUrl**: no CV PDF is currently supplied. Upload `assets/Jamshidbek-Nurmukhammadov-CV.pdf`, then set this field to that path. A dedicated Download CV link appears; Print / Save CV remains in the footer. An empty value does not create a broken download or an invented CV.
- **projects[].url**: optional public case-study or project link. Empty values produce no dead links.
- **projects[].category**: creates project filters automatically. The label All is reserved.
- **projects[].featured**: gives the project a dark featured treatment.
- **projects[].priority**: `flagship` adds a restrained accent; `supporting` keeps the regular treatment. Array order controls the rail: ERP, capacity monitoring, MAGMASTORE, RISE, Odoo, Cisco, mathematics.
- **sections**: controls display order, labels and visibility. Hidden sections are also removed from navigation.
- Text is escaped automatically. Use plain text, not HTML.
- External links must start with https:// or http://; relative asset paths are also supported.

The build rejects missing fields, duplicate section IDs and unsafe links before writing the output. Existing career facts were retained; no fabricated project results or metrics were added.

## Preview locally

Serve this directory with any static server (required for the editor's modules and JSON). For example, if Python is installed:

~~~sh
python -m http.server 8000
~~~

Open http://localhost:8000 for the portfolio and http://localhost:8000/editor.html for editing. Opening index.html directly also works for the public portfolio.

## What visitors can do

- Browse experience, education, skills and selected work.
- Combine project category filters and keyword search; clear filters after an empty result.
- Print or save the complete CV as PDF. All projects print, even if filtered out on screen.
- Copy the email address, or use email, phone and GitHub links.
- Navigate with a keyboard; mobile navigation closes on Escape, outside click or selection.

## Files

- **content.json** — editable personal content and section configuration.
- **render.mjs** — shared, escaped HTML renderer and validation.
- **projects.mjs** — reusable project cards, case studies, schema validation and semantic language catalog.
- **transcript.mjs** — transcript tables and validation; grades stay in content.json.
- **html.mjs** — HTML escaping and URL safety shared by all renderers.
- **seo.mjs** — canonical, social metadata, Person schema and discovery files.
- **i18n.js** — language selection, persistence and semantic catalog application.
- **theme.js** — System / Light / Dark preferences, synchronized across page and dialogs.
- **build.mjs** — generates the committed page and discovery files.
- **index.html** — ready-to-host output; avoid hand-editing because builds overwrite it.
- **styles.css** — shared visual tokens, responsive layouts and print stylesheet.
- **script.js** — progressive interaction enhancements.
- **editor.html**, **editor.js** — optional browser editor with import/export and preview.
- **render.test.mjs** — content rendering and validation checks.
- **favicon.svg** — browser icon.

## Hosting

Upload these files to your existing static host, or use GitHub Pages if supported by your repository visibility and account plan. Deploy the repository root. No runtime server or environment variables are needed.

Keep all accompanying modules, styles, scripts and assets when deploying. No install step, framework or third-party runtime request is introduced.

## Adding a case study

Each project needs a stable lowercase `id`, `title`, `category`, `meta`, `description`, `tags` array and `featured` boolean. `url`, `linkLabel`, `cover`, `priority` and `details` are optional. Titles may change without breaking dialogs; IDs must be unique.

`details` contains `title`, `lead`, optional `label`, `subtitle`, `question`, `flow`, `sections`, `gallery`, `certificate`, `cover`, `facts` and `reflection`. A section has a `title` and ordered `blocks`:

- `paragraph`: `parts` containing plain `text`, optional `strong` or safe `url`, or `{ "break": true }`; optional `note` marks qualifications.
- `list` and `tags`: an `items` array of plain strings.
- `metrics`: an `items` array of `{ "value": "…", "label": "…" }` objects. State assumptions in an adjacent note.

`reflection` has a title and blocks. The optional `gallery` layout retains the RISE visit presentation; each gallery item includes an image, category, title, description and optional link. Images supply `src`, `alt`, `width`, `height`, and optional `small` with its actual `smallWidth`. This supports future projects through data without new project-specific renderer or event-handler branches.

## Languages

English is the default and comes directly from the content fields. `locales.uz` and `locales.ru` use semantic paths such as `profile.role`, `projects.erp.details.lead` and `skills.core.title`. `ui` contains shared interface phrases; it is not a second copy of the case-study content. Collection IDs keep project and skill keys stable when reordered. Numeric paths in transcript and experience must be updated when those arrays are reordered.

Update the matching translations when changing English text. Proper names, brands, acronyms, grades and numeric data remain unchanged. A compact JSON catalog is embedded safely in the generated HTML, so language switching also works in editor exports without fetching content.json. The remaining text-node adapter supports legacy static labels; primary profile fields carry explicit `data-i18n` keys. Query language takes precedence over saved preference; selections persist locally and work inside every detail window.

## SEO and assets

`seo.canonicalUrl` is `https://jmshd37.github.io/my-website/`. Language query parameters are presentation preferences on that one canonical page; there are no misleading hreflang alternatives. Open Graph and Twitter metadata use the existing JN image. The title, description, favicon and Person schema remain, with alumni and language information added.

The build writes sitemap.xml with the canonical URL. On GitHub Pages project hosting, a robots.txt in `/my-website/` is not the origin-root robots policy; the generated robots.txt can also be placed in the `Jmshd37.github.io` root repository if root-level crawler control is needed. The sitemap can be submitted by its own URL.

Original RISE JPEGs remain untouched. Five web-ready WebP images total about 412 KB versus 7.83 MB for the originals (about 95% smaller); 640-pixel-bound variants are available for smaller displays. Rendered images use accurate dimensions, responsive sources, lazy loading and asynchronous decoding. Full-resolution photographs and PDFs are not loaded merely to render the page.

## Verification

`node --test` runs 17 dependency-free checks covering source-driven projects, schema failures, escaping, URL safety, local asset casing, translations, canonical/structured data, optional content, transcript tables, navigation/dialog IDs, external-link attributes, the original logo and CV behavior. Build output is regenerated after changes.

Browser verification for this revision used Chromium-based Edge at 320, 360, 390, 430, 768, 1024 and 1440 pixels, all three languages, and both light/dark appearances (42 combinations). All eight dialogs were opened and closed in each combination with focus restoration and overflow checks. System theme changes and saved preferences, language selection inside dialogs, mobile menu, project/skills rails, project filtering without hiding recommendations, print visibility, editor preview and downloads were checked. No page errors, failed local asset requests, duplicate IDs or broken fragment anchors were found. Solid-surface text contrast was checked in both themes; this is a practical accessibility review rather than a formal WCAG certification.

External URLs keep their verified-safe protocols and original destinations. Live checks succeeded for MAGMASTORE, RAY, the recommender, Cisco, HKUST, XPeng, DJI and Pony.ai. The checking service could not retrieve NGD, Odoo, GitHub and Telegram; those destinations remain unchanged rather than being treated as proven broken.

