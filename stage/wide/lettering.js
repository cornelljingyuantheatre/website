// Cache the glyphs and soft shadows. The SVG remains visible while they load
// and still draws the all-red wordmark.
(() => {
  if (stageTestMode === 'touch') return;
  const density = 2;
  const shadowPadding = 44;
  const shadowSoftness = 1;
  const tile = { x: 413, y: 105, width: 708, height: 708 };
  const center = 344.5;

  function surface(width, height, scale = density) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    return { canvas, ctx };
  }

  function stops(id) {
    return [...document.querySelectorAll(`#${id} stop`)].map(stop => {
      const text = stop.getAttribute('offset');
      const offset = Number.parseFloat(text) / (text.endsWith('%') ? 100 : 1);
      return { offset, color: stop.getAttribute('stop-color'), alpha: Number(stop.getAttribute('stop-opacity') ?? 1) };
    });
  }

  function fillGradient(ctx, gradient, values, rgb) {
    for (const { offset, color, alpha } of values) {
      gradient.addColorStop(offset, rgb ? `rgba(${rgb},${alpha})` : color);
    }
    ctx.fillStyle = gradient;
  }

  function field(radius, ramp, rgb, maskRamp) {
    const { canvas, ctx } = surface(radius * 2, radius * 2, 1);
    const colorRadius = Number(document.querySelector(`#${ramp}`).getAttribute('r'));
    fillGradient(ctx, ctx.createRadialGradient(radius, radius, 0, radius, radius, colorRadius), stops(ramp), rgb);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (maskRamp) {
      ctx.globalCompositeOperation = 'destination-in';
      fillGradient(ctx, ctx.createRadialGradient(radius, radius, 0, radius, radius, radius), stops(maskRamp), '255,255,255');
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { canvas, radius };
  }

  function shadowField() {
    const radius = 460;
    const upper = field(radius, 'outer-color-field', '255,255,255');
    const lower = field(radius, 'lower-color-field', '255,255,255');
    const clip = (source, id) => {
      const { canvas, ctx } = surface(radius * 2, radius * 2, 1);
      const weight = document.querySelector(`#${id}`);
      const y1 = Number(weight.getAttribute('y1')) - center + radius;
      const y2 = Number(weight.getAttribute('y2')) - center + radius;
      ctx.drawImage(source.canvas, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      fillGradient(ctx, ctx.createLinearGradient(0, y1, 0, y2), stops(id), '255,255,255');
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return canvas;
    };
    const { canvas, ctx } = surface(radius * 2, radius * 2, 1);
    ctx.drawImage(clip(upper, 'upper-field-weight'), 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(clip(lower, 'lower-field-weight'), 0, 0);
    return { canvas, radius };
  }

  function init() {
    const output = surface(tile.width, tile.height);
    const buffer = surface(tile.width, tile.height);
    const mask = surface(tile.width, tile.height);
    const rim = field(383, 'rim-reveal-ramp', '255,43,0');
    const ink = field(270, 'lettering-ink', null, 'lettering-reveal-ramp');
    const litArea = shadowField();
    const words = wordShadows.map(word => {
      const source = document.querySelector(`#word-${word.el.dataset.word}`);
      const text = source.textContent;
      const x = Number(source.getAttribute('x'));
      const y = Number(source.getAttribute('y'));
      const font = `${source.getAttribute('font-size')}px AaRuiYaTi`;
      mask.ctx.font = font;
      mask.ctx.fillText(text, x - tile.x, y - tile.y);
      const box = mask.ctx.measureText(text);
      const left = Math.floor(x - box.actualBoundingBoxLeft) - shadowPadding;
      const top = Math.floor(y - box.actualBoundingBoxAscent) - shadowPadding;
      const width = Math.ceil(x + box.actualBoundingBoxRight) - left + shadowPadding;
      const height = Math.ceil(y + box.actualBoundingBoxDescent) - top + shadowPadding;
      const shadowColor = word.el.querySelector('use').style.fill;
      const variants = new Map();
      function blurred(sigma) {
        const step = Math.round((sigma + shadowSoftness) * 2) / 2;
        if (!variants.has(step)) {
          const { canvas, ctx } = surface(width, height);
          // Bake just the shadow into the sprite; the source glyph is off-canvas.
          // Canvas shadow blur works without CanvasRenderingContext2D.filter.
          const sourceShift = width + shadowPadding;
          ctx.font = font;
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = 2 * step * density;
          ctx.shadowOffsetX = sourceShift * density;
          ctx.fillText(text, x - left - sourceShift, y - top);
          variants.set(step, canvas);
        }
        return variants.get(step);
      }
      return { ...word, left, top, width, spriteHeight: height, blurred };
    });

    function reset(ctx) {
      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, tile.width, tile.height);
      ctx.translate(-tile.x, -tile.y);
    }

    function place(ctx, picture, point, scale) {
      const r = picture.radius * scale;
      ctx.drawImage(picture.canvas, point.x - r, point.y - r, r * 2, r * 2);
    }

    function copyBuffer(alpha) {
      const ctx = output.ctx;
      ctx.globalAlpha = alpha;
      ctx.drawImage(buffer.canvas, tile.x, tile.y, tile.width, tile.height);
    }

    function paintGlyphs(picture, point, scale, alpha) {
      reset(buffer.ctx);
      place(buffer.ctx, picture, point, scale);
      buffer.ctx.globalCompositeOperation = 'destination-in';
      buffer.ctx.drawImage(mask.canvas, tile.x, tile.y, tile.width, tile.height);
      copyBuffer(alpha);
    }

    function paintShadows(point, sizeLocal, beamBlur, e, inState1) {
      const ctx = buffer.ctx;
      reset(ctx);
      const dx = lerp(SHADOW1.dx, SHADOW2.dx, e);
      const dy = lerp(SHADOW1.dy, SHADOW2.dy, e);
      const stretch = lerp(SHADOW1.s, SHADOW2.s, e);
      const blur = lerp(SHADOW1.blur, SHADOW2.blur, e);
      ctx.save();
      ctx.translate(TITLE_ORIGIN.x + dx, TITLE_ORIGIN.y + dy);
      ctx.scale(stretch, stretch);
      ctx.translate(-TITLE_ORIGIN.x, -TITLE_ORIGIN.y);
      const restLoc = inState1 ? origin : {
        x: TITLE_ORIGIN.x + (STATE2.x - TITLE2.x) / TITLE2.s,
        y: TITLE_ORIGIN.y + (STATE2.y - TITLE2.y) / TITLE2.s,
      };
      const rest = inState1 ? origin : lerpPose(origin, restLoc, e);
      const live = phase === 'state2' ? rest : point;
      for (const word of words) {
        const p = projection(word.cx, word.cy, word.height, live);
        const q = projection(word.cx, word.cy, word.height, rest);
        const ox = clamp((p.x - q.x) * .5, -130, 130);
        const oy = clamp((p.y - q.y) * .5, -130, 130);
        const amount = Math.max(0, p.stretch - q.stretch);
        const skew = amount * p.c * p.s;
        const sigma = blur * FIGMA_BLUR_TO_SIGMA * (1 + .5 * clamp(Math.hypot(ox, oy) / 70, 0, 1) + beamBlur * .02);
        ctx.save();
        ctx.translate(ox + word.cx, oy + word.cy);
        ctx.transform(1 + amount * p.c * p.c, skew, skew, 1 + amount * p.s * p.s, 0, 0);
        ctx.translate(-word.cx, -word.cy);
        ctx.drawImage(word.blurred(sigma), word.left, word.top, word.width, word.spriteHeight);
        ctx.restore();
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'destination-in';
      place(ctx, litArea, point, sizeLocal * (1 + beamBlur * .75 / 460));
      copyBuffer(.5 * brightness);
    }

    const canvas = output.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'cached-lettering';
    Object.assign(canvas.style, {
      position: 'absolute', left: '0', top: '0', pointerEvents: 'none',
      width: `${tile.width}px`, height: `${tile.height}px`, transformOrigin: '0 0',
    });
    const svg = document.querySelector('.title-field');
    svg.before(canvas);
    for (const selector of ['.shadow-layer', '.rim-lettering', '.lit-lettering']) {
      svg.querySelector(selector).style.display = 'none';
    }
    window.stageLettering = {
      hide() { canvas.hidden = true; },
      draw({ T, frameDistance, titleDistance, Lloc, sizeLocal, beamBlur, e, inState1 }) {
        canvas.hidden = false;
        canvas.style.transform = `translate(${T.x}px,${T.y + frameDistance - titleDistance}px) scale(${T.s}) translate(${tile.x - TITLE_ORIGIN.x}px,${tile.y - TITLE_ORIGIN.y}px)`;
        reset(output.ctx);
        if (brightness <= 0) return;
        const scale = sizeLocal * K;
        paintShadows(Lloc, scale, beamBlur, e, inState1);
        paintGlyphs(rim, Lloc, scale, RIM_OPACITY * (1 - redReveal) * brightness);
        paintGlyphs(ink, Lloc, scale, brightness);
      },
    };
    document.documentElement.dataset.letteringRenderer = 'cached';
    wake();
  }

  document.fonts.load('184px AaRuiYaTi', '境缘ChineseAtCornell')
    .then(fonts => {
      if (!fonts.length) throw new Error('The wordmark font could not be loaded.');
      init();
    })
    .catch(error => {
      document.documentElement.dataset.letteringRenderer = 'svg';
      console.error(error);
    });
})();
