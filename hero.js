// One responsive stage, isolated from Shows and Eboard in the host shell.
const jingyuanHeroMarkup = `<section class="jingyuan-hero" aria-label="Jingyuan stage"><iframe class="jingyuan-stage-frame" src="stage/wide/index.html?v=opening-larger-circle-1" title="境缘剧社 · 舞台与对岸演出" loading="eager"></iframe></section>`;
function initJingyuanHero(root) {
  const frame = root?.querySelector('iframe');
  return () => { if (frame) frame.src = 'about:blank'; };
}
