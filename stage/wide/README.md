# Widescreen homepage stage

Opened by the homepage at ≥800px (`hero.js`). Narrow screens keep `stage/index.html` unchanged.

The lettering is live AaRuiYaTi text with per-glyph shadows and masks. The light is Figma's own render, moved as a texture (see below).

## Sources

| Part | Figma | Implementation |
|---|---|---|
| State 1 | `154:238` | Light group `154:239`. Title is live text at the Figma positions. Shadow copy `191:109`: +23px, 50%, blur 12. |
| State 2 | `191:34` | Light `191:35` (2418px). Title `191:72` ×1.5437. Shadows `191:92` (blur 20). Intro `192:160` in Noto Serif SC 600. |
| Red wordmark | `195:341` | Sharp live text in `#e62f0c` (境/缘) and `#b02408` (English). |
| Curtain | `206:50` / `206:68` (frame-2 copy of Stage overlay `201:47`) | Native overlay export, with black converted to alpha. The aperture interior is exactly transparent. The photo is masked by `206:66`. |
| The Other Shore | `192:168` | Live masks `196:371` / `196:397` with image fills on the Figma 5s A–B–A loop. Pool "Texture" glass becomes an SVG displacement in Figma's layer order. Date and buttons are presentation-only, as in the current stage. |

State-1 behaviour comes from `stage/app.js` at `25c8682`. The following are unchanged:
- the entrance path, rates and landing;
- the entrance cues (brightness, aperture, focus);
- `beamAt(y)`;
- the clear/soft lower-half blend;
- the illumination, outer and rim fields;
- `centralRedTriggerScale` (0.55), the 3px tolerance and the reversible 280ms fade.

The fields are scaled by 307.5/244.5 for the larger new light.

## Light

- The light is the native Figma export of `154:239` at 2×.
  - It carries the same clear/soft lower-half defocus blend as the current stage.
  - During the grow it cross-fades into the `191:35` export. Figma clips that export to the 1512-wide frame, so beyond the frame edges the state-1 texture fills in. The two use complementary masks.
  - Re-exporting `191:35` without the frame clip would remove that fill-in on very wide screens.
- A CSS-only light (a gradient circle with 10 blur bands) was prototyped first and compared side by side. It was dropped because it drifted further from Figma (2.73 vs 0.72 mean error /255 in state 1) and redraws 11 large blurred layers each frame during the grow. It remains in commit `b62631d`.

## Sequence

1. One downward gesture (wheel, swipe, ArrowDown/PageDown/Space) grows state 1 into state 2 over 1.5s (smootherstep). The light and title share the same driver.
   - The rest of that gesture, including trackpad inertia, is absorbed.
2. In state 2 the pointer is ignored.
   - Native scrolling moves the content 1:1, and the light rises at 0.6× (parallax).
   - The light dims 88% between 1100 and 1750 design px.
   - The photo fades in between 1450 and 1800.
   - The Other Shore follows at 2830.
3. Scrolling back to the top and making one upward gesture reverses the sequence to state 1.
4. Past the end, scrolling hands off to the homepage sections below.

## Wider viewports

- The parked state-2 light grows beyond 2418px just enough to keep every viewport corner inside 93% of its radius.
- The Other Shore's city photograph scales to cover the viewport width.

Regenerate `index.html` after changing glyph or field definitions:

```
python3 tools/build-wide-stage.py
```
