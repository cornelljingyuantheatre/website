# Jingyuan website

Buildless HTML/CSS/JavaScript website for the Chinese Drama Society at Cornell.

## Run locally

Serve the dist directory using VS Code Live Server / Go Live or any static HTTP server. No dependencies or build step are required.

## Structure

- dist/index.html, dist/style.css, dist/app.js: existing navigation, homepage sections, Shows archive, Eboard roster and footer.
- dist/hero.js and dist/hero.css: mount the integrated stage into the homepage.
- dist/stage/: complete shared desktop/mobile stage, including original local fonts and artwork. The stage is a same-origin iframe so its fullscreen animation, SVG IDs, CSS and hash navigation cannot interfere with the host site's Shows/Eboard routing. Leaving Home unloads the stage and stops its animations.
- dist/stage/assets/fonts/FONTS.md: bundled-font source information.

## Integrated stage

Based on the current Jingyuan Site source (version 35), with the requested mobile correction: the spotlight always remains circular and grows from small to large while descending. The narrow entrance retains the angle-projected vertical path, gradual focus and braking, and the original resting composition. The four mobile views switch using dots, swipe, wheel or arrow keys. Wide-screen stage content and animations remain intact.

The existing Shows page, full Eboard roster, member photographs, header/footer and homepage sections are retained. Buy Ticket / Explore inside the stage remain presentation-only as requested. Existing host-site ticket controls are unchanged.

## Validation

JavaScript syntax and local asset references checked. Browser checks cover the embedded narrow stage and circular entrance, desktop stage, and host navigation Home → Shows → Eboard → Home.
