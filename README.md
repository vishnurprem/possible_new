# The Possible — Option B

the expressive direction: full-height hero, generative brand visual, audit fixes

Static site. No build step, no dependencies — open `index.html` or serve the
folder.

## Pages

- `index.html` — home
- `perspective.html`
- `proof.html`
- `how-we-partner.html`
- `about.html`

## Deploying

Vercel picks this up as a static site with no configuration:

    npx vercel deploy --prod

`vercel.json` sets `cleanUrls` (so `/about` works as well as `/about.html`)
and long-lived caching for `assets/`.

## Brand constraints

Colours, typefaces and copy are locked and must not be changed without sign-off:

| Token | Value |
|---|---|
| navy | `#121C2B` |
| cream | `#F7F2EA` |
| sand | `#EFE2D6` |
| coral | `#F0523D` |
| teal | `#18BEB7` |
| lime | `#CCFF33` |
| gray | `#6A7079` |

Typefaces: **Instrument Sans** (embedded as woff2, no external request) and
**Georgia**. `Inter` and `Brush Script MT` appear only inside CSS
recreations of client logos and are not brand faces.

## Provenance

Generated from the live source by the scripts in `../../build/` of the working
directory. To regenerate:

    python build.py && python build_single.py && python sync_repos.py
