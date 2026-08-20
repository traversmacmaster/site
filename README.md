# Travers MacMaster — Art / Sound / Experiment

Static, GitHub Pages-compatible site for Travers MacMaster's art, sound, experiments, and original tools.

Replaceable homepage content lives in `data/content.js`. The complete tool catalog lives in `data/products.js`; legacy commerce and availability fields remain there for possible future use but are not rendered publicly. TimeField and AuViMosh use the shared tool-detail renderer in `product-page.js`.

Routes: `/`, `/work/`, `/sound/`, `/tools/`, `/experiments/`, `/about/`, `/products/timefield/`, and `/products/avm/`.

## Restoring commerce later

The dormant `pricingType`, `publicPrice`, `membershipAvailability`, `purchaseUrl`, and support-link fields remain in the catalog. A future presentation can consume those fields in a dedicated availability component without changing the gallery or tool-exhibit architecture. No pricing model has been selected or exposed by the current renderer.
