# Responsive homepage stage

The homepage loads this stage at every width. The former narrow route redirects here.

The lettering uses cached AaRuiYaTi glyphs and soft shadow sprites with moving illumination. The SVG remains the fallback and draws the red wordmark. Both light poses use Claude's prototype A CSS renderer.

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
- the entrance timing, brightness and aperture;
- `beamAt(y)`;
- the illumination, outer and rim fields;
- `centralRedTriggerScale` (0.55), the 3px tolerance and the reversible 280ms fade.

The fields are scaled by 307.5/244.5 for the larger new light.

## Light

- Claude's CSS prototype from `b62631d` uses a red gradient circle, ten complementary blur bands and an amber ellipse.
- Each pose reuses a lossless WebP render of the CSS light. The expanded light selects the closer blur profile for its radius. The original CSS stays as the fallback, and the transition crossfades the two lights at the same position and scale.

## Sequence

Touch-capable devices keep the opening light centered. Vertical swipes open state 2 from the top, then native vertical scrolling takes over. On mouse-only devices the light can follow the pointer in state 1.

1. One downward gesture (wheel, swipe, ArrowDown/PageDown/Space) grows state 1 into state 2 over 1.5s (smootherstep). The light and title share the same driver.
   - A short, same-direction wheel tail is absorbed. An intentional opposite wheel input can reverse the current transition.
2. In state 2 the pointer is ignored.
   - The wordmark and its shadows accelerate upward first. The wider light follows on a later curve.
   - The red and amber parts rise together, keeping the original light mix as the introduction passes.
   - The curtain and photo enter together immediately after the introduction, following the rising light's lower edge. The Other Shore follows the curtain.
3. Scrolling back to the top and making one upward gesture reverses the sequence to state 1.
4. Past the end, scrolling hands off to the homepage sections below.

## Wider viewports

- The parked state-2 light grows beyond 2418px just enough to keep every viewport corner inside 93% of its radius.
- The Other Shore's city photograph scales to cover the viewport width.

## Narrow viewports

- The title fits its measured glyph bounds. In portrait, Page 1 uses up to 56% of the viewport width and 48% of its height. Page 2 uses up to 75% of the width and 58% of the height. The smaller bound wins to preserve proportions.
- The portrait spotlight comes down vertically. The introduction uses a viewport-relative 15–23 CSS pixel font size with 1.5 line spacing.
- The photograph aperture occupies 70% of the viewport width in portrait. The curtain overlay and aperture mask scale together. The poster uses up to 68% of the width or 81% of the height, and the scroll endpoint centers the poster composition.
- The original desktop positions blend into the portrait positions between viewport aspect ratios 1.22 and 0.82.

Regenerate `index.html` after changing glyph or field definitions:

```
python3 tools/build-wide-stage.py
```
