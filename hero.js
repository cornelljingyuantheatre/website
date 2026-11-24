// Shared desktop/mobile stage. Its own document isolates SVG IDs, font rules,
// viewport animation and inner navigation from Shows/Eboard in the host shell.
// Widescreen (≥800px) loads the redesigned stage in stage/wide/; the narrow layout
// keeps the existing stage/index.html unchanged.
const jingyuanWideQuery = matchMedia('(min-width: 800px)');
function jingyuanStageSrc() {
  return jingyuanWideQuery.matches ? 'stage/wide/index.html?v=cached-lettering-1' : 'stage/index.html';
}
const jingyuanHeroMarkup = `<section class="jingyuan-hero" aria-label="Jingyuan stage"><iframe class="jingyuan-stage-frame" src="${jingyuanStageSrc()}" title="境缘剧社 · 舞台与对岸演出" loading="eager"></iframe></section>`;
function initJingyuanHero(root) {
  const frame = root?.querySelector('iframe');
  const swap = () => { if (frame) frame.src = jingyuanStageSrc(); };
  jingyuanWideQuery.addEventListener('change', swap);
  return () => { jingyuanWideQuery.removeEventListener('change', swap); if (frame) frame.src = 'about:blank'; };
}
