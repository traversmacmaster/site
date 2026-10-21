# Travers MacMaster — Audio & Visual Instruments

Static, GitHub Pages-compatible site for Travers MacMaster's art, sound, experiments, and original tools.

The approved visual system uses warm ivory, black ink, fine rules, Cinzel headings, Source Sans 3 body/UI text, and IBM Plex Mono technical labels. Fonts and their open-source licenses are served locally from `assets/fonts/`. The harmonic SVG is an original mathematical plot; the social preview is generated artwork.

The complete machine catalog lives in `data/products.js`. The homepage, searchable Machines collection, Audio, Lab, and machine details read this catalog. `catalog.js` shares card rendering; `site.js` handles the accessible search dialog and mobile navigation. All fourteen catalog machines have static, crawlable detail pages. Browser builds, including SpiroField and MoshPaint, are staged beneath `apps/`; app source remains owned by each machine project.

`data/content.js` retains the previous editorial model for future artwork and social links; it is not currently rendered. Do not expose its unfinished placeholder content. Legacy commerce fields remain in the product catalog but are not displayed.

Navigation labels map to existing URLs: Work `/work/`, Machines `/tools/`, Vault `/apps/reelvault/`, Lab `/experiments/`, Audio `/sound/`, and About `/about/`. Existing bookmarks still work.

## Adding screenshots and machines

1. Put screenshots into `assets/products/<slug>/`. Set `image` for cards and `heroImage` for the detail page. Preserve the complete interface in screenshots; cards use `object-fit: contain`.
2. Add a record to `data/products.js`, following the existing fields. Set `appUrl` only for a working application; omit unknown purchase or download links. Set `homePreview: true` to include it on the homepage.
3. Copy a `products/<slug>/index.html` shell and update its `data-product` attribute, static title, description, and social metadata to match the new record. The launch generator supplies the essential content as initial HTML; product pages do not require JavaScript.
4. Set `disciplines` to `audio`, `visual`, or `archive` (multiple supported). Audio and catalog filters use these explicit classifications. Lab shows BETA, COMING SOON, and IN DEVELOPMENT records. The homepage studio updates are selected in `app.js` without invented dates.

Serve the directory with any static server. No build step is required. This remains the existing GitHub Pages site for traversmacmaster.com; no hosting migration has been performed.

## Restoring commerce later

The dormant `pricingType`, `publicPrice`, `membershipAvailability`, `purchaseUrl`, and support-link fields remain in the catalog. A future presentation can consume those fields in a dedicated availability component without changing the gallery or tool-exhibit architecture. No pricing model has been selected or exposed by the current renderer.

TunnelField uses the supplied original interface capture, three full-resolution artwork PNGs, and WebM recording. Its `examples` and `video` catalog fields feed the shared detail/Work gallery. Video has native controls and loops after manual play; preload is disabled to avoid downloading the 36 MB recording before use. The TunnelField page now links to its staged browser application.

MoiréField uses the original full product screenshot and a VP9 WebM conversion of the supplied 1920×1080 / 30 FPS MP4. Its video poster is extracted from the recording. Work now discovers all catalog records with video or artwork examples automatically. Original source media remains unchanged.


## Web launch / SEO preparation

The nine launch machines have descriptive search intents and short usage instructions maintained in ../launch-content.json. Run node ../build-launch.mjs to regenerate static product pages, main-page metadata, crawlable catalog cards, sitemap.xml, robots.txt and the review report. Run node ../build-web.mjs to rebuild the eight available browser apps first. App shells and historical backups use noindex,follow; canonical editorial/product pages are indexable. Existing production hosting is unchanged. No pricing, reviews or licensing has been invented in structured data.

The shared Free export badge uses locally bundled IBM Plex Mono Medium. Export source changes are separate from previously packaged Windows EXEs. See ../WEB-LAUNCH-REVIEW.md for exact keyword/metadata choices, tested behavior and remaining release steps.

## Redesign direction

Use the supplied current product screenshots for the redesign. The main layout places audio instruments on the left and visual instruments on the right. On narrow screens, stack audio before visual.


Machine listing examples are maintained in data/products.js: examples for images, videos/video for clips, and audioExamples for audio ({src,label,type}). Screenshot galleries use screenshots and are separate from example artwork. The homepage uses machine-listings.js; native details controls rotate > downward when open.


The Artwork subheader link opens the personal showcase modal. Edit data/artwork.js to add, remove, title or reorder video/image works. The modal supports video/webm and video/mp4, pauses clips on close, and uses the shared site.js and stylesheet.


Site copy should be plain and descriptive. Avoid slogans, catchphrases, manifesto language and promotional metaphors. Describe what each tool does.

## Software classifications

Audio plugins: Grain Alchemy, BOTTOMFEEDER, HEXIT, DrawTable, TimeField and STRETCH are VSTs. Some have standalone counterparts; do not infer standalone availability for every plugin. DEADBEAT and WAVE HORROR are also VSTs with working standalones; the supplied T-SYNC pack contains their standalones. T-SYNC connects those standalone applications.

StreamArch and DCLASS are separate web applications with distinct purposes (film archive browsing and document research). MoshPaint and AuViMosh are visual media tools. The remaining visual machines are generative mathematical visual systems. 3FIELD hosts selected 2D systems in 3D. The permanent product name is TimeField.

Visual listing order: MoshPaint, AuViMosh, MoiréField, 3FIELD, then the remaining visual tools. 3FIELD hosts KaleidoField, MoiréField, SpiroField and Suminagashi. Suminagashi has no separate 2D product listing yet.


## MoshPaint browser alpha

The current browser application is staged at `apps/moshpaint/`, with its public entry point linked from `products/moshpaint/` and its Web availability in `data/products.js`. It includes living video painting, camera clip pigment, integrated Moirefield fills/source wells, Color Solidify controls for dry and living masks, depth/form tools, responsive tool drawers, timestamped WebM export in supported browsers, and five modular processing engines. The Live Brush Engine processes source samples before they reach image/video brush strokes and can process moving frames inside Living Brush marks. Captured source-brush samples replay with the gesture; processed Living Brush frames stay animated during playback and video export. Color Territories provides shared masks for routing effects through selected color regions. Save projects as `.moshpaint` downloads; browser recovery is local to that browser/origin. Camera access requires permission and HTTPS or localhost.

From this directory, run `node scripts/sync-moshpaint.mjs` to refresh the app from the adjacent `MoshPaint-2.0` project. A different project root can be supplied as the first argument. The sync stages browser runtime files and their shared processing packages, rewrites package imports for the nested app route, adds app noindex/product canonical metadata, and writes version/file hashes to `apps/moshpaint/build-info.json`. It does not build Windows installers or publish the site. Update the product copy/catalog when adding user-facing features.

The October 2026 stage was checked under the nested `/apps/moshpaint/` route: product launch link and structured data, mask controls, video playback, project downloads, phone viewport sizing, and a 15-frame / 60-FPS / 0.25-second WebM export. All staged file hashes matched, and the check found no missing resources or JavaScript page errors.


## AuViMosh browser build

The latest AuViMosh web source is staged at `apps/auvimosh/`. Run `node scripts/sync-auvimosh.mjs` from this directory to stage the FFmpeg browser core, compile TypeScript, build the Pages edition, and copy it into the site. An optional first argument selects a different `datamosh-instrument` project root. The script preserves app noindex/product canonical metadata and the font license, and records current runtime file hashes in `apps/auvimosh/build-info.json`. Old hashed bundles remain available for visitors with a cached app shell; the current shell references the latest build.

The current staged AuViMosh build was checked under `/apps/auvimosh/`: both source slots loaded video, the local FFmpeg worker generated a preview, and MP4 export preserved audio at 160 × 120 / 24 FPS. Runtime hashes matched the build manifest, with no missing resources or JavaScript page errors.

Recursive is the current name of the Windows instrument previously called Recursive Symbol Machine. The existing `/products/recursive-symbol-machine/` URL and catalog slug remain in use. Its catalog, static listings, and product page include procedural masks, looping video fills, and 3D depth layers. Current interface and artwork captures are in `assets/products/recursive-symbol-machine/2026-10-17/`. App source remains in the adjacent `RecursiveSymbolMachine` project; the renamed portable build is `dist/Recursive 1.0.0.exe` there. These local site edits do not publish a deployment.

MoshPaint also includes **Place view on canvas**: a transparent still snapshot of the current 3D object, placed above the flat canvas for dragging/resizing with Select. Existing artwork and moving pigment remain underneath. Placements are included in saved projects and exports.
