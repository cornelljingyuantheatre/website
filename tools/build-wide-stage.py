#!/usr/bin/env python3
"""Generate stage/wide/index.html (widescreen redesign prototype).

Lettering masks reuse the gradient fields of stage/index.html at commit 25c8682
(illumination, outer falloff, upper/lower weights, rim reveal) so the beam's reveal,
rim and red-state behaviour match the existing implementation. Geometry comes from
Figma frames 154:238 (state 1), 191:34 (state 2), 195:341 (red) and 192:168 (对岸).
Run from the repository root:  python3 tools/build-wide-stage.py
"""
import re, subprocess

src = subprocess.run(['git', 'show', '25c8682:stage/index.html'], capture_output=True, text=True, check=True).stdout

def grab(tag_id, tag):
    m = re.search(r'<%s id="%s".*?</%s>' % (tag, tag_id, tag), src, re.S)
    assert m, tag_id
    return m.group(0)

fields = ''.join(grab(i, 'radialGradient') for i in ['rim-reveal-ramp', 'outer-color-field', 'outer-fade-field', 'lower-color-field', 'lower-fade-field'])
fields += ''.join(grab(i, 'linearGradient') for i in ['upper-field-weight', 'lower-field-weight'])
soft_large = grab('title-soft-large', 'filter')
soft_small = grab('title-soft-small', 'filter')
intro_ink = grab('intro-ink', 'filter')

# Glyph slots (local = state-1 coordinates) from the existing stage, plus Figma colours.
#        key       text      x    baseline  size    slot(x,y,w,h)                                      ink (154:238)            shadow fill (191:109)       red (195:341)
W = [
    ('jing',    '境',      613, 450.016, 184,    (616.223633, 288.911987, 164.304688, 193.375977), 'rgb(62,20,14)',        'rgba(62,20,14,.8)',  '#e62f0c', 'large'),
    ('chinese', 'Chinese', 796, 355.2051, 30.525, (793.526367, 327.373352, 114.767578, 32.939209),  'rgba(92,31,23,.6)',    'rgba(92,31,23,.6)',  '#b02408', 'small'),
    ('drama',   'Drama',   816, 391.2051, 30.525, (814.411133, 363.587036, 97.939453, 32.572937),   'rgba(92,31,23,.6)',    'rgba(92,31,23,.6)',  '#b02408', 'small'),
    ('society', 'Society', 810, 427.2051, 30.525, (807.526367, 399.403931, 104.647461, 38.586365),  'rgba(92,31,23,.6)',    'rgba(92,31,23,.6)',  '#b02408', 'small'),
    ('at',      'At',      622, 522.2051, 30.525, (618.305664, 494.587036, 35.650391, 32.664551),   'rgba(64,16,10,.6)',    'rgba(64,16,10,.6)',  '#b02408', 'small'),
    ('cornell', 'Cornell', 622, 558.2051, 30.525, (619.526367, 530.373413, 103.360352, 32.939209),  'rgba(64,16,10,.6)',    'rgba(64,16,10,.6)',  '#b02408', 'small'),
    ('yuan',    '缘',      729, 620.016, 184,    (737.192383, 459.463989, 157.496094, 191.536011), 'rgb(51,14,9)',         'rgba(51,14,9,.75)',  '#e62f0c', 'large'),
]

def pad(slot, p):
    x, y, w, h = slot
    return x - p, y - p, w + 2 * p, h + 2 * p

defs = [soft_large, soft_small, intro_ink, fields]
# Text sources (real AaRuiYaTi text) and per-glyph alpha masks.
for k, t, x, y, s, slot, *_ in W:
    defs.append(f'<text id="word-{k}" class="title-word" x="{x}" y="{y}" font-size="{s}">{t}</text>')
for k, t, x, y, s, slot, ink, sh, red, kind in W:
    bx, by, bw, bh = pad(slot, 14 if kind == 'large' else 6)
    defs.append(f'<mask id="sharp-{k}" maskUnits="userSpaceOnUse" x="{bx:.3f}" y="{by:.3f}" width="{bw:.3f}" height="{bh:.3f}" style="mask-type:alpha"><use href="#word-{k}"/></mask>')
    defs.append(f'<mask id="soft-{k}" maskUnits="userSpaceOnUse" x="{bx:.3f}" y="{by:.3f}" width="{bw:.3f}" height="{bh:.3f}" style="mask-type:alpha"><use href="#word-{k}" filter="url(#title-soft-{kind})"/></mask>')
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
<mask id="rim-light-visibility" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:alpha"><use href="#rim-light-field"/></mask>''')
# Core field: 1 in the beam core, 0 beyond its feathered edge (smootherstep), in the same
# 689-unit light frame as the other fields. Sharp strokes use it; soft strokes its complement.
r0, r1, R = 185.0, 265.0, 265.0
stops = []
for i in range(41):
    rr = R * i / 40
    t = min(1, max(0, (rr - r0) / (r1 - r0)))
    a = 1 - t * t * t * (t * (t * 6 - 15) + 10)
    stops.append(f'<stop offset="{i/40:.4f}" stop-color="white" stop-opacity="{a:.5f}"/>')
defs.append(f'<radialGradient id="core-ramp" gradientUnits="userSpaceOnUse" cx="344.5" cy="344.5" r="{R}">{"".join(stops)}</radialGradient>')
defs.append('<g id="core-field"><rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#core-ramp)"/></g>')
defs.append('<mask id="core-sharp" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:alpha"><use href="#core-field"/></mask>')
defs.append('<mask id="core-soft" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000" style="mask-type:luminance"><rect x="-3000" y="-3000" width="8000" height="8000" fill="white"/><use href="#core-field" filter="url(#coverage-black)"/></mask>')

body = []
# 1. Per-word shadows (Figma Group 56 / 55), lit only by the beam.
body.append('<g class="shadow-layer" mask="url(#light-inside)"><g class="shadow-group" opacity=".5">')
for k, t, x, y, s, slot, ink, sh, red, kind in W:
    body.append(f'<g class="word-shadow" data-word="{k}" filter="url(#shadow-blur-{k})"><use href="#word-{k}" style="fill:{sh}"/></g>')
body.append('</g></g>')
# 2. Peripheral rim copy (existing behaviour: faint strokes ahead of the main beam).
body.append('<g class="rim-lettering" mask="url(#rim-light-visibility)">')
for k, t, x, y, s, slot, *_ in W:
    sx, sy, sw, sh_ = slot
    body.append(f'<g mask="url(#soft-{k})"><rect x="{sx}" y="{sy}" width="{sw}" height="{sh_}" fill="#ff2b00"/></g>')
body.append('</g>')
# 3. Lit lettering: sharp in the beam core, softened across the feathered edge.
body.append('<g class="lit-lettering" mask="url(#light-inside)">')
for k, t, x, y, s, slot, ink, sh, red, kind in W:
    bx, by, bw, bh = pad(slot, 14 if kind == 'large' else 6)
    body.append(f'<g class="glyph-field" data-word="{k}"><rect class="glyph-slot" x="{slot[0]}" y="{slot[1]}" width="{slot[2]}" height="{slot[3]}" fill="none"/>'
                f'<g mask="url(#core-sharp)"><g mask="url(#sharp-{k})"><rect x="{bx:.3f}" y="{by:.3f}" width="{bw:.3f}" height="{bh:.3f}" fill="{ink}"/></g></g>'
                f'<g mask="url(#core-soft)"><g mask="url(#soft-{k})"><rect x="{bx:.3f}" y="{by:.3f}" width="{bw:.3f}" height="{bh:.3f}" fill="{ink}"/></g></g></g>')
body.append('</g>')
# 4. Whole-wordmark sharp red state (frame 195:341), outside the light only.
body.append('<g class="red-wordmark" opacity="0" mask="url(#light-outside)">')
for k, t, x, y, s, slot, ink, sh, red, kind in W:
    body.append(f'<use href="#word-{k}" style="fill:{red}"/>')
body.append('</g>')

title_svg = ('<svg class="title-field" viewBox="0 0 1512 982" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>'
             + ''.join(defs) + '</defs><g id="title-group">' + ''.join(body) + '</g></svg>')

# Light: native Figma PNG export of group 154:239 as a movable texture (state 1) with the existing clear/soft lower-half blend,
# plus the native state-2 export (frame-clipped) blended in during the grow.
light_png = ('<div class="light light-png" data-node-id="154:239">'
             '<div class="tex-surface tex-clear"><img src="assets/light-154-239@2x.webp" alt="" draggable="false"></div>'
             '<div class="tex-surface tex-soft"><img src="assets/light-154-239@2x.webp" alt="" draggable="false"></div></div>'
             '<div class="light2-png" data-node-id="191:35"><img src="assets/light-191-35@0.5x.webp" alt="" draggable="false"></div>')

intro_lines = ['台上之境，', '台下之缘。', '', '康奈尔境缘剧社', '是以康奈尔大学为平台的', '中文话剧社。', '', '我们希望通过话剧表演，', '为话剧爱好者提供沟通交流的机会，', '传播中文语言魅力，', '丰富校园多元文化。']
intro = '<p class="intro" data-node-id="192:160">' + ''.join(f'<span>{l or "&#8203;"}</span>' for l in intro_lines) + '</p>'

curtain = ('<div class="curtain" data-node-id="206:50">'
           '<div class="curtain-photo" data-node-id="206:63"><img src="assets/curtain-photo.webp" alt="境缘剧社演出剧照" draggable="false"></div>'
           '<img class="curtain-overlay" src="assets/curtain-overlay-206-50@2x.webp" alt="" draggable="false"></div>')

shore = '''<section class="shore" data-node-id="192:168" aria-label="对岸 The Other Shore · Dec. 5 2026">
<div class="shore-city" data-node-id="196:366"></div>
<svg class="shore-fx" width="0" height="0" aria-hidden="true"><defs><filter id="ripple-a" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="560" y="300" width="400" height="560" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.0333" numOctaves="2" seed="11" result="noise"><animate attributeName="baseFrequency" values="0.01 0.0333;0.01096 0.0361;0.01 0.0333" keyTimes="0;.5;1" calcMode="spline" keySplines=".5 0 .5 1;.42 0 .58 1" dur="5s" repeatCount="indefinite"/></feTurbulence><feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 0 0 0 .5  0 0 0 0 0  0 0 0 0 1" result="nx"/><feDisplacementMap in="SourceGraphic" in2="nx" scale="40" xChannelSelector="R" yChannelSelector="G" result="disp"><animate attributeName="scale" values="40;21.5;40" keyTimes="0;.5;1" calcMode="spline" keySplines=".5 0 .5 1;.42 0 .58 1" dur="5s" repeatCount="indefinite"/></feDisplacementMap><feGaussianBlur in="disp" stdDeviation=".9" result="glass"/><feImage href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%221512%22%20height%3D%22982%22%20viewBox%3D%220%200%201512%20982%22%3E%3Cfilter%20id%3D%22b%22%20x%3D%22-50%25%22%20y%3D%22-50%25%22%20width%3D%22200%25%22%20height%3D%22200%25%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2214%22/%3E%3C/filter%3E%3Cg%20filter%3D%22url%28%23b%29%22%3E%3Crect%20x%3D%22631.512%22%20y%3D%22436.09%22%20width%3D%22153.584%22%20height%3D%22155.147%22%20rx%3D%2276.792%22%20transform%3D%22rotate%28.93%20631.512%20436.09%29%22%20fill%3D%22%23fff%22/%3E%3C/g%3E%3C/svg%3E" x="0" y="0" width="1512" height="982" preserveAspectRatio="none" result="weight"/><feComposite in="glass" in2="weight" operator="in" result="inside"/><feComposite in="SourceGraphic" in2="weight" operator="out" result="outside"/><feMerge><feMergeNode in="outside"/><feMergeNode in="inside"/></feMerge></filter><filter id="ripple-b" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="560" y="300" width="400" height="560" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.0333" numOctaves="2" seed="11" result="noise"><animate attributeName="baseFrequency" values="0.01 0.0333;0.01096 0.0361;0.01 0.0333" keyTimes="0;.5;1" calcMode="spline" keySplines=".5 0 .5 1;.42 0 .58 1" dur="5s" repeatCount="indefinite"/></feTurbulence><feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 0 0 0 .5  0 0 0 0 0  0 0 0 0 1" result="nx"/><feDisplacementMap in="SourceGraphic" in2="nx" scale="40" xChannelSelector="R" yChannelSelector="G" result="disp"><animate attributeName="scale" values="40;21.5;40" keyTimes="0;.5;1" calcMode="spline" keySplines=".5 0 .5 1;.42 0 .58 1" dur="5s" repeatCount="indefinite"/></feDisplacementMap><feGaussianBlur in="disp" stdDeviation=".9" result="glass"/><feImage href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%221512%22%20height%3D%22982%22%20viewBox%3D%220%200%201512%20982%22%3E%3Cfilter%20id%3D%22b%22%20x%3D%22-50%25%22%20y%3D%22-50%25%22%20width%3D%22200%25%22%20height%3D%22200%25%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2214%22/%3E%3C/filter%3E%3Cg%20filter%3D%22url%28%23b%29%22%3E%3Crect%20x%3D%22695.575%22%20y%3D%22569.278%22%20width%3D%22187.45%22%20height%3D%2295.492%22%20rx%3D%2247.746%22%20transform%3D%22rotate%28.93%20695.575%20569.278%29%22%20fill%3D%22%23fff%22/%3E%3C/g%3E%3C/svg%3E" x="0" y="0" width="1512" height="982" preserveAspectRatio="none" result="weight"/><feComposite in="glass" in2="weight" operator="in" result="inside"/><feComposite in="SourceGraphic" in2="weight" operator="out" result="outside"/><feMerge><feMergeNode in="outside"/><feMergeNode in="inside"/></feMerge></filter></defs></svg>
<div class="shore-title" aria-hidden="true">
 <div class="ripple ripple-b"><!-- pool B (196:420) distorts everything below it: 对, pool A, 岸 -->
  <div class="ripple ripple-a"><!-- pool A (196:395) distorts 对 only -->
   <div class="shore-mask dui" data-node-id="196:370">
    <img class="fill dui-base" src="assets/shore-dui-fill.webp" alt="">
    <img class="fill dui-move" src="assets/shore-dui-fill.webp" alt="">
    <img class="fill dui-mirror" src="assets/shore-dui-mirror-fill.webp" alt="">
   </div>
  </div>
  <div class="shore-pool pool-a" data-node-id="196:395"></div>
  <div class="shore-mask an" data-node-id="196:396">
   <img class="fill an-base" src="assets/shore-an-fill.webp" alt="">
   <img class="fill an-move" src="assets/shore-an-fill.webp" alt="">
  </div>
 </div>
 <img class="shore-english" data-node-id="196:404" src="assets/shore-english-group51.svg" alt="">
 <div class="shore-pool pool-b" data-node-id="196:420"></div>
</div>
<h2 class="accessible">对岸 The Other Shore</h2>
<p class="shore-date" data-node-id="196:424">Dec. 5 2026 Sat</p>
<button class="shore-button tickets" type="button" data-node-id="196:421">Tickets</button>
<button class="shore-button explore" type="button" data-node-id="196:422">Explore</button>
</section>'''

html = f'''<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000">
<title>境缘 · Chinese Drama Society at Cornell </title>
<link rel="preload" href="../assets/fonts/aaruiyati-title.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/noto-serif-sc-600-intro.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="wide.css">
</head>
<body>
<main class="journey"><div class="scene" tabindex="0" aria-label="境缘 · Chinese Drama Society at Cornell. Move the pointer to guide the spotlight; scroll to open the stage.">
<h1 class="accessible">境缘 — Chinese Drama Society At Cornell</h1>
<p class="accessible">台上之境，台下之缘。康奈尔境缘剧社是以康奈尔大学为平台的中文话剧社。我们希望通过话剧表演，为话剧爱好者提供沟通交流的机会，传播中文语言魅力，丰富校园多元文化。</p>
<div class="light-layer" aria-hidden="true">{light_png}</div>
<div class="stage"><div class="content">
{title_svg}
{intro}
{curtain}
{shore}
</div></div>
</div></main>
<script src="wide.js"></script>
</body></html>
'''
open('stage/wide/index.html', 'w', encoding='utf8').write(html)
print('wrote stage/wide/index.html', len(html))
