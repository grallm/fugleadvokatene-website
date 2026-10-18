# Figma assets and visual acceptance

Access to file `4pXeiKn0Bv2GhlnWJiP1nV` was confirmed. Desktop homepage `312:462`, mobile homepage `469:1179`, support hero `312:20` and volunteer hero `312:241` were read with design context/screenshots.

The provided asset URLs returned an HTML "Site Unavailable" response in this environment, not an image. A direct asset export was also attempted. Figma then returned: **"You've reached the Figma MCP tool call limit on the Starter plan."** No incorrect HTML files are retained as images. The user subsequently requested fake images. The preview now uses temporary SVG illustrations and text branding from `public/images/demo/`; these are not Figma exports or real volunteer photographs.

## Photo update

The four user-supplied original photos have now replaced the photo illustrations in both languages. See `IMAGES.md` for mappings and compression. The original logo and icon exports are still outstanding; the historic download failure below does not apply to the supplied photos.

## What is missing

The authoritative checklist is `scripts/assets.json`: 11 source layer IDs and intended slots; the four photo entries now point to optimized variants. Export those assets to `public/images/figma/`, using the listed filenames. Prefer fresh `get_design_context` asset exports so intrinsic image crops and SVG dimensions match the prototype. Keep SVG root width/height and aspect ratios. Review rights and consent for the volunteer images before production publication.

You can supply a local JSON map of filename to fresh Figma asset URL and run:

```sh
node scripts/download-assets.mjs /absolute/path/to/fresh-assets.json
node scripts/check-assets.mjs
```

Do not commit temporary authenticated URLs. The manifest contains only stable node IDs, filenames and descriptions.

## Comparison still required

At 1728px desktop and 393px mobile, compare the homepage against the referenced frames. Check logo intrinsic dimensions, hero crop, text wrapping, CTA icons, volunteer images, carousel controls and footer. Check intermediate widths and keyboard access too.

Exact visual verification still requires the remaining logo and icon assets. The source uses the Figma palette and typography but is **not claimed pixel-perfect**. Production differences to review: verified contact/org details replace placeholders; unconnected social feed shows a link fallback; unapproved profiles are drafts; missing LinkedIn destination is omitted; mockup-only arrows and fake engagement numbers are not presented as live data.

## Replacing the demo images

Export the original assets using the manifest above, then replace `/images/demo/` references under `src/` with `/images/figma/` and restore original `.png` filenames from `scripts/assets.json` (including the image names in `Hero.astro`). The production asset check continues to require the originals.
