# Jamshidbek Nurmukhammadov — Portfolio

A responsive personal portfolio and printable CV. Plain HTML, CSS and JavaScript, with no framework, dependencies or third-party requests.

## Edit without touching the design

1. Open **editor.html** on your hosted site or through a local server.
2. Expand a section and edit the fields. Add/remove experiences, projects and skills using the controls.
3. In **Sections**, move sections up/down or turn **Enabled** off to hide them. IDs must stay one of: about, experience, education, projects, skills, contact. Do not duplicate IDs.
4. Choose **Update preview**.
5. Download **both content.json and index.html**. Replace both files in this repository in one commit.
6. Publish through your existing deployment process.

The editor runs only in your browser. It does not write to GitHub or save automatically. Anyone can open it, but they cannot change your website without repository access. Download your files before leaving the tab. The preview can differ in width from the published site; test both desktop and mobile after changing long text.

The public-facing site remains readable if JavaScript is disabled. Interactive controls appear only when their scripts run.

## Edit as a developer

Node.js 20 or later is required only for building/testing, not hosting. No install step is needed.

~~~sh
node build.mjs
node --test
~~~

Edit **content.json**, then run the build and commit both the JSON and regenerated **index.html**. All biography, contact details, experience, projects, education, courses and skills live in this one file.

- **profile.resumeUrl**: leave empty for the browser Print / Save CV action, or point to an uploaded PDF such as assets/cv.pdf.
- **projects[].url**: optional public case-study or project link. Empty values produce no dead links.
- **projects[].category**: creates project filters automatically. The label All is reserved.
- **projects[].featured**: gives the project a dark featured treatment.
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
- **build.mjs** — generates the committed static index.html.
- **index.html** — ready-to-host output; avoid hand-editing because builds overwrite it.
- **styles.css** — shared visual tokens, responsive layouts and print stylesheet.
- **script.js** — progressive interaction enhancements.
- **editor.html**, **editor.js** — optional browser editor with import/export and preview.
- **render.test.mjs** — content rendering and validation checks.
- **favicon.svg** — browser icon.

## Hosting

Upload these files to your existing static host, or use GitHub Pages if supported by your repository visibility and account plan. Deploy the repository root. No runtime server or environment variables are needed.

Editor exports only the page and content; keep the accompanying stylesheet, script, renderer and favicon in place. Upload a CV PDF yourself before setting its path. This change does not merge or deploy automatically.

