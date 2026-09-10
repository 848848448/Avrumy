# Panorama Skylight — website

**"The right view."** Custom skylight company website. Static site, no build step —
just open `index.html` in a browser or host the folder on any static host
(GitHub Pages, Netlify, Vercel, etc.).

## Files
- `index.html` — the public website
- `admin.html` — content editor (edit text, photos & captions in your browser)
- `content.js` — all default text and image references (single source of truth)
- `site.js` — renders the page and applies saved edits
- `admin.js` — the editor logic
- `styles.css` — styling for the site and the editor
- `assets/gallery/` — real installation photos

## Editing the site (no coding)
1. Open **admin.html** in your browser.
2. Enter the passcode (default: `panorama` — change it in the *Settings* section).
3. Edit any text, upload/replace photos, add or remove gallery images and reviews.
4. Click **Save** — changes show on the site immediately *in your browser*.
5. To publish for **all** visitors, click **Export** to download
   `content-overrides.json`, then commit that file to the site (or send it to
   your developer). `site.js` will load it for everyone.

> Note: "Save" stores edits only in your own browser (localStorage). Publishing
> for the whole world happens when the exported file is committed to the repo.
> A live editor that saves for everyone without exporting would need a small
> hosting service (e.g. a headless CMS) — easy to add later.

## Brand
- Colors: blue `#2b5a9f`, gold `#f4c02f`
- Phone: (845) 600‑4042 · Email: sales@panoramaskylight.com

## Still nice to add
- The exact logo image (the header currently uses a matching SVG mark).
- More installation photos.
- Connecting the quote form to email/CRM (currently front-end only).
