# Photographs

The four supplied JPEGs have replaced the temporary photo illustrations in both Norwegian and English pages. Official logos from `main` are in `public/images/brand/`. The favicon derives from the emblem. Font Awesome replaces temporary social and CTA icons.

| Supplied file | Website name | Placement |
| --- | --- | --- |
| Fuglebaby.jpg | baby-bird | First hero, default social image |
| Untitled.jpg | pigeon-closeup | Support hero |
| 20 1.jpg | volunteer-pigeon | Volunteer hero, recruitment page and draft profile cards |
| _13A6804 1.jpg | flying-pigeon | News and sample content |

The repeated volunteer image follows the mockup; draft profiles remain drafts and are not verified portraits of each named volunteer.

## Delivery

`Photo.astro` chooses AVIF with responsive WebP fallback at 480, 960 and 1600 pixels. Stable `.webp` paths remain compatible with content frontmatter, admin previews and social metadata. Unknown or newly uploaded image paths fall back to ordinary images; the PHP upload flow is unchanged and does not automatically create variants.

Images were auto-oriented, resized without enlargement, and encoded with Sharp: AVIF quality 50 / effort 5; WebP quality 78 / effort 5. EXIF metadata is removed. Original JPEGs are retained in the supplied archive, not duplicated in this repository. The committed variants need no runtime image service. Astro copies `public/` unchanged rather than recompressing them.

To replace a photo, export the same three widths and formats with these names, plus a copy of the 1600px WebP at the stable unnumbered path. Update the aspect ratio in `Photo.astro` if the original proportions change.

The four largest AVIF variants total 273 KiB versus 16.7 MiB for the original JPEGs (98.4% smaller). Browsers download only the selected format and size, not every variant.

Validation: Astro check (zero diagnostics), preview build, 11 existing content/language/site tests and all rendered image/srcset paths pass. Browser screenshot verification could not run because the available Chromium binary crashed at startup.
