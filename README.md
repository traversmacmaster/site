# Travers MacMaster — Audio & Visual Instruments

Static, GitHub Pages-compatible site for Travers MacMaster's art, sound, experiments, and original tools.

The approved visual system uses warm ivory, black ink, fine rules, Cinzel headings, Source Sans 3 body/UI text, and IBM Plex Mono technical labels. Fonts and their open-source licenses are served locally from `assets/fonts/`. The harmonic SVG is an original mathematical plot; the social preview is generated artwork.

The complete machine catalog lives in `data/products.js`. The homepage, searchable Machines collection, Audio, Lab, and machine details read this catalog. `catalog.js` shares card rendering; `site.js` handles the accessible search dialog and mobile navigation. All eight machines have detail pages. AuViMosh and ReelVault retain their existing live application links. Embedded app source and interfaces are unchanged.

`data/content.js` retains the previous editorial model for future artwork and social links; it is not currently rendered. Do not expose its unfinished placeholder content. Legacy commerce fields remain in the product catalog but are not displayed.

Navigation labels map to existing URLs: Work `/work/`, Machines `/tools/`, Vault `/apps/reelvault/`, Lab `/experiments/`, Audio `/sound/`, and About `/about/`. Existing bookmarks still work.

## Adding screenshots and machines

1. Put screenshots into `assets/products/<slug>/`. Set `image` for cards and `heroImage` for the detail page. Preserve the complete interface in screenshots; cards use `object-fit: contain`.
2. Add a record to `data/products.js`, following the existing fields. Set `appUrl` only for a working application; omit unknown purchase or download links. Set `homePreview: true` to include it on the homepage.
3. Copy a `products/<slug>/index.html` shell and update its `data-product` attribute, static title, description, and social metadata to match the new record. The shared renderer supplies its content automatically.
4. Set `disciplines` to `audio`, `visual`, or `archive` (multiple supported). Audio and catalog filters use these explicit classifications. Lab shows BETA, COMING SOON, and IN DEVELOPMENT records. The homepage studio updates are selected in `app.js` without invented dates.

Serve the directory with any static server. No build step is required. This remains the existing GitHub Pages site for traversmacmaster.com; no hosting migration has been performed.

## Restoring commerce later

The dormant `pricingType`, `publicPrice`, `membershipAvailability`, `purchaseUrl`, and support-link fields remain in the catalog. A future presentation can consume those fields in a dedicated availability component without changing the gallery or tool-exhibit architecture. No pricing model has been selected or exposed by the current renderer.

TunnelField uses the supplied original interface capture, three full-resolution artwork PNGs, and WebM recording. Its `examples` and `video` catalog fields feed the shared detail/Work gallery. Video has native controls and loops after manual play; preload is disabled to avoid downloading the 36 MB recording before use. No TunnelField application link is advertised yet.

MoiréField uses the original full product screenshot and a VP9 WebM conversion of the supplied 1920×1080 / 30 FPS MP4. Its video poster is extracted from the recording. Work now discovers all catalog records with video or artwork examples automatically. Original source media remains unchanged.
