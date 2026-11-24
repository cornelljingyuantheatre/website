#!/usr/bin/env python3
"""Generate stage/wide/index.html (widescreen redesign prototype).

Lettering masks reuse the gradient fields of stage/index.html at commit 25c8682
(illumination, upper/lower weights, rim reveal) so the beam's reveal,
rim and red-state behaviour match the existing implementation. Geometry comes from
Figma frames 154:238 (state 1), 191:34 (state 2), 195:341 (red) and 192:168 (对岸).
Run from the repository root:  python3 tools/build-wide-stage.py
"""
import re, subprocess
from hashlib import sha256
from pathlib import Path

src = subprocess.run(['git', 'show', '25c8682:stage/index.html'], capture_output=True, text=True, check=True).stdout

def grab(tag_id, tag):
    m = re.search(r'<%s id="%s".*?</%s>' % (tag, tag_id, tag), src, re.S)
    assert m, tag_id
    return m.group(0)

def tighten_rim(gradient):
    # Preserve the rim strength and slide the falloff closer to the beam.
    original_radius = 460
    tail_start = 280
    tail_scale = .65
    inward_shift = 14
    radius = tail_start + (original_radius - tail_start) * tail_scale - inward_shift

    def scale_offset(match):
        distance = float(match[1]) * original_radius
        if distance > tail_start:
            distance = tail_start + (distance - tail_start) * tail_scale
        distance -= inward_shift * min(1, distance / 200)
        return f'offset="{distance / radius:.9f}"'

    gradient = gradient.replace(f'r="{original_radius}"', f'r="{radius:g}"', 1)
    return re.sub(r'offset="([0-9.]+)"', scale_offset, gradient)


fields = tighten_rim(grab('rim-reveal-ramp', 'radialGradient'))
fields += ''.join(grab(i, 'radialGradient') for i in ['outer-color-field', 'outer-fade-field', 'lower-color-field', 'lower-fade-field'])
fields += ''.join(grab(i, 'linearGradient') for i in ['upper-field-weight', 'lower-field-weight'])

# Glyph slots (local = state-1 coordinates) from the existing stage, plus Figma colours.
#        key       text      x    baseline  size    slot(x,y,w,h)    shadow fill (191:109)       red (195:341)
W = [
    ('jing',    '境',      613, 450.016, 184,    (616.223633, 288.911987, 164.304688, 193.375977), 'rgba(62,20,14,.8)',  '#e62f0c'),
    ('chinese', 'Chinese', 796, 355.2051, 30.525, (793.526367, 327.373352, 114.767578, 32.939209),  'rgba(92,31,23,.6)',  '#b02408'),
    ('drama',   'Drama',   816, 391.2051, 30.525, (814.411133, 363.587036, 97.939453, 32.572937),   'rgba(92,31,23,.6)',  '#b02408'),
    ('society', 'Society', 810, 427.2051, 30.525, (807.526367, 399.403931, 104.647461, 38.586365),  'rgba(92,31,23,.6)',  '#b02408'),
    ('at',      'At',      622, 522.2051, 30.525, (618.305664, 494.587036, 35.650391, 32.664551),   'rgba(64,16,10,.6)',  '#b02408'),
    ('cornell', 'Cornell', 622, 558.2051, 30.525, (619.526367, 530.373413, 103.360352, 32.939209),  'rgba(64,16,10,.6)',  '#b02408'),
    ('yuan',    '缘',      729, 620.016, 184,    (737.192383, 459.463989, 157.496094, 191.536011), 'rgba(51,14,9,.75)',  '#e62f0c'),
]


defs = [fields]
# Shared live AaRuiYaTi glyphs for the two reveals and their shadows.
for k, t, x, y, s, slot, *_ in W:
    defs.append(f'<text id="word-{k}" class="title-word" x="{x}" y="{y}" font-size="{s}">{t}</text>')
for k, *_ in W:
    # Shadow blur: own filter per glyph so its radius can follow the light.
    defs.append(f'<filter id="shadow-blur-{k}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB"><feGaussianBlur class="shadow-sd" stdDeviation="5"/></filter>')

# Light-driven fields (transforms are set every frame in title-local coordinates).
defs.append('''<g id="illumination" opacity="0" style="isolation:isolate"><g mask="url(#upper-field-mask)" style="mix-blend-mode:plus-lighter"><rect x="-100" y="-100" width="889" height="889" fill="url(#outer-color-field)"/></g><g mask="url(#lower-field-mask)" style="mix-blend-mode:plus-lighter"><rect x="-100" y="-100" width="889" height="889" fill="url(#lower-color-field)"/></g></g>
<mask id="upper-field-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="889" height="889" style="mask-type:alpha"><rect x="-100" y="-100" width="889" height="889" fill="url(#upper-field-weight)"/></mask>
<mask id="lower-field-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="889" height="889" style="mask-type:alpha"><rect x="-100" y="-100" width="889" height="889" fill="url(#lower-field-weight)"/></mask>
<filter id="coverage-black" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
<mask id="light-inside" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:alpha"><use href="#illumination"/></mask>
<mask id="light-outside" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:luminance"><rect x="-3000" y="-3000" width="8000" height="8000" fill="white"/><use href="#illumination" filter="url(#coverage-black)"/></mask>
<g id="rim-light-field"><rect x="-200" y="-200" width="1089" height="1089" fill="url(#rim-reveal-ramp)"/></g>
<mask id="rim-light-visibility" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:alpha"><use href="#rim-light-field"/></mask>
<!-- The beam radius is 244.5 in field coordinates. Feather only outside it. -->
<radialGradient id="lettering-reveal-ramp" gradientUnits="userSpaceOnUse" cx="344.5" cy="344.5" r="270">
<stop offset="0" stop-color="white"/><stop offset="90.555556%" stop-color="white"/><stop offset="93%" stop-color="white" stop-opacity=".88"/><stop offset="95.3%" stop-color="white" stop-opacity=".5"/><stop offset="97.7%" stop-color="white" stop-opacity=".12"/><stop offset="100%" stop-color="white" stop-opacity="0"/>
</radialGradient>
<radialGradient id="lettering-ink" gradientUnits="userSpaceOnUse" cx="344.5" cy="344.5" r="244.5">
<!-- Blend toward the spotlight's red at its inside edge using solid ink colors. -->
<stop offset="0" stop-color="#330e09"/>
<stop offset="47%" stop-color="#3e140e"/>
<stop offset="61%" stop-color="#4a180f"/>
<stop offset="73%" stop-color="#5e1d13"/>
<stop offset="85%" stop-color="#762317"/>
<stop offset="95%" stop-color="#8d2a19"/>
<stop offset="100%" stop-color="#932c1a"/>
</radialGradient>
<g id="lettering-light-field" opacity="0"><rect x="74.5" y="74.5" width="540" height="540" fill="url(#lettering-reveal-ramp)"/></g>
<mask id="lettering-light-visibility" maskUnits="userSpaceOnUse" x="590" y="270" width="350" height="400" style="mask-type:alpha"><use href="#lettering-light-field"/></mask>''')

body = []
# 1. Per-word shadows (Figma Group 56 / 55), lit only by the beam.
body.append('<g class="shadow-layer" mask="url(#light-inside)"><g class="shadow-group" opacity=".5">')
for k, t, x, y, s, slot, sh, red in W:
    body.append(f'<g class="word-shadow" data-word="{k}" filter="url(#shadow-blur-{k})"><use href="#word-{k}" style="fill:{sh}"/></g>')
body.append('</g></g>')
# 2. Peripheral rim copy (existing behaviour: faint strokes ahead of the main beam).
body.append('<g class="rim-lettering" mask="url(#rim-light-visibility)">')
for k, *_ in W:
    body.append(f'<use href="#word-{k}" fill="#ff2b00"/>')
body.append('</g>')
# 3. Sharp lettering shaded with opaque ink colors inside the beam.
body.append('<g class="lit-lettering" fill="url(#lettering-ink)" mask="url(#lettering-light-visibility)">')
for k, t, x, y, s, slot, sh, red in W:
    bx, by, bw, bh = slot
    body.append(f'<g class="glyph-field" data-word="{k}"><rect class="glyph-slot" x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="none"/>'
                f'<use href="#word-{k}"/></g>')
body.append('</g>')
# 4. Whole-wordmark sharp red state (frame 195:341), outside the light only.
body.append('<g class="red-wordmark" opacity="0" mask="url(#light-outside)">')
for k, t, x, y, s, slot, sh, red in W:
    body.append(f'<use href="#word-{k}" style="fill:{red}"/>')
body.append('</g>')

title_svg = ('<svg class="title-field" viewBox="0 0 1512 982" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>'
             + ''.join(defs) + '</defs><g id="title-group">' + ''.join(body) + '</g></svg>')

# Light renderers. A: CSS gradient + 10 progressive blur bands + amber light.
# Fitted against the native export (light-154-239@2x): band blur 0 -> 60.5px (pow 1.0625)
# from 3.21% to 67.26% of the circle height (Figma progressive radius 100), amber 106.25px
# (Figma 251.5) at 93.75% opacity. Mean error 4.2/255.
N, SMAX, POW = 10, 60.5, 1.0625
top = 142.8; y0 = top + 0.0321 * 615; y1 = top + 0.6726 * 615
ys = [y0 + (y1 - y0) * i / (N - 1) for i in range(N)]
bands = []
for i, yy in enumerate(ys):
    s = SMAX * (i / (N - 1)) ** POW
    prev = ys[i - 1] if i else -400.0
    nxt = ys[i + 1] if i < N - 1 else 2000.0
    cls = 'band first' if i == 0 else 'band last' if i == N - 1 else 'band'
    bands.append(f'<div class="{cls}" style="--y:{yy:.2f};--prev:{prev:.2f};--next:{nxt:.2f};--s:{s:.3f}"><div class="circle"></div></div>')

light_art = ''.join(bands) + '<div class="amber"></div>'
light_css = (f'<div class="light light-css light1-css" data-node-id="154:239">{light_art}</div>'
             f'<div class="light light-css light2-css" data-node-id="191:35">{light_art}</div>')

intro_lines = ['台上之境，', '台下之缘。', '', '康奈尔境缘剧社', '是以康奈尔大学为平台的', '中文话剧社。', '', '我们希望通过话剧表演，', '为话剧爱好者提供沟通交流的机会，', '传播中文语言魅力，', '丰富校园多元文化。']
intro = '<p class="intro" data-node-id="192:160">' + ''.join(f'<span>{l or "&#8203;"}</span>' for l in intro_lines) + '</p>'

curtain = ('<div class="curtain" data-node-id="206:50">'
           '<div class="curtain-photo" data-node-id="206:63"><img src="assets/curtain-photo.webp" alt="境缘剧社演出剧照" draggable="false"></div>'
           '<img class="curtain-overlay" src="assets/curtain-overlay-206-50@2x.webp" alt="" draggable="false"></div>')

shore = '''<section class="shore" data-node-id="192:168" aria-label="对岸 The Other Shore · Dec. 5 2026">
<div class="shore-city" data-node-id="196:366"></div>
<div class="shore-title" aria-hidden="true">
   <div class="shore-mask dui" data-node-id="196:370">
    <img class="fill dui-base" loading="lazy" decoding="async" src="assets/shore-dui-fill.webp" alt="">
    <img class="fill dui-mirror" loading="lazy" decoding="async" src="assets/shore-dui-mirror-fill.webp" alt="">
   </div>
  <div class="shore-pool pool-a" data-node-id="196:395"></div>
  <div class="shore-mask an" data-node-id="196:396">
   <img class="fill an-base" loading="lazy" decoding="async" src="assets/shore-an-fill.webp" alt="">
   <img class="fill an-move" loading="lazy" decoding="async" src="assets/shore-an-fill.webp" alt="">
  </div>
 <img class="shore-english" loading="lazy" decoding="async" data-node-id="196:404" src="assets/shore-english-group51.svg" alt="">
 <div class="shore-pool pool-b" data-node-id="196:420"></div>
</div>
<h2 class="accessible">对岸 The Other Shore</h2>
<p class="shore-date" data-node-id="196:424">Dec. 5 2026 Sat</p>
<button class="shore-button tickets" type="button" data-node-id="196:421">Tickets</button>
<button class="shore-button explore" type="button" data-node-id="196:422">Explore</button>
</section>'''

stage = Path('stage/wide')
asset_source = ''.join((stage / name).read_text(encoding='utf8') for name in ('wide.css', 'wide.js'))
asset_version = sha256(asset_source.encode('utf8')).hexdigest()[:12]

html = f'''<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000">
<title>境缘 · Chinese Drama Society at Cornell </title>
<link rel="preload" href="../assets/fonts/aaruiyati-title.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/noto-serif-sc-600-intro.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="wide.css?v={asset_version}">
</head>
<body>
<main class="journey"><div class="scene" tabindex="0" aria-label="境缘 · Chinese Drama Society at Cornell. Move the pointer to guide the spotlight; scroll to open the stage.">
<h1 class="accessible">境缘 — Chinese Drama Society At Cornell</h1>
<p class="accessible">台上之境，台下之缘。康奈尔境缘剧社是以康奈尔大学为平台的中文话剧社。我们希望通过话剧表演，为话剧爱好者提供沟通交流的机会，传播中文语言魅力，丰富校园多元文化。</p>
<div class="light-layer" aria-hidden="true">{light_css}<div class="reading-light"></div></div>
<div class="stage"><div class="content">
{title_svg}
{intro}
{curtain}
{shore}
</div></div>
</div></main>
<script src="wide.js?v={asset_version}"></script>
</body></html>
'''
open('stage/wide/index.html', 'w', encoding='utf8').write(html)
print('wrote stage/wide/index.html', len(html))
