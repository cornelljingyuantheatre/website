// Shared desktop/mobile stage. Its own document isolates SVG IDs, font rules,
// viewport animation and inner navigation from Shows/Eboard in the host shell.
const jingyuanHeroMarkup = '<section class="jingyuan-hero" aria-label="Jingyuan stage"><iframe class="jingyuan-stage-frame" src="stage/index.html" title="境缘剧社 · 舞台与对岸演出" loading="eager"></iframe></section>';
function initJingyuanHero(root) {
  return () => { const frame=root?.querySelector('iframe'); if(frame)frame.src='about:blank'; };
}
