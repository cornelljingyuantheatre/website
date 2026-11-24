const frame = document.querySelector('#stage');
const statusLine = document.querySelector('#status');
const buttons = [...document.querySelectorAll('[data-mode]')];
const stageURL = new URL('../stage/wide/index.html', location.href);
const names = {
  live: '现版。下滑进入第二屏。',
  desktop: '电脑版字标试验。移动鼠标看扫光，用滚轮进入和退出第二屏。',
  touch: '触屏试验。请试第一次滑动、继续滚动和滑回。',
  letters: '字标试验。请比较入场、扩光和笔画高光。',
};
let active = null;
let sequence = 0;

async function read(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function replaceRequired(source, needle, replacement) {
  if (!needle.test(source)) throw new Error('The stage source has changed.');
  return source.replace(needle, () => replacement);
}

const touchHandlers = `let swipe = null;
scene.addEventListener('touchstart', event => {
  if (event.touches.length !== 1 || event.target.closest('button,a')) return;
  const point = event.touches[0];
  swipe = { x: point.clientX, y: point.clientY, phase, atTop: scrollY <= 0 };
}, { passive: true });
scene.addEventListener('touchmove', event => {
  if (!swipe || event.touches.length !== 1) { swipe = null; return; }
  const point = event.touches[0];
  const dy = swipe.y - point.clientY;
  if (Math.abs(dy) <= 12 || Math.abs(dy) <= Math.abs(swipe.x - point.clientX)) return;
  const start = swipe;
  swipe = null;
  if (phase === 'state1' && start.phase === phase && dy > 0) startGrow();
  if (phase === 'state2' && start.phase === phase && start.atTop && scrollY <= 0 && dy < 0) startShrink();
}, { passive: true });
for (const event of ['touchend','touchcancel']) {
  scene.addEventListener(event, () => { swipe = null; }, { passive: true });
}
`;

async function openMode(mode) {
  if (!Object.hasOwn(names, mode)) mode = 'letters';
  active = mode;
  const request = ++sequence;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  history.replaceState(null, '', `?mode=${mode}`);
  statusLine.textContent = '正在载入舞台…';
  try {
    const html = await read(stageURL);
    const scriptTag = /<script src="([^"]*wide\.js[^"]*)"><\/script>/;
    const originalScript = html.match(scriptTag)?.[1];
    if (!originalScript) throw new Error('Stage script unavailable.');
    let preview = html.replace('<head>', `<head><base href="${stageURL}">`);
    if (mode !== 'live') {
      let script = await read(new URL(originalScript, stageURL));
      if (mode === 'touch' || mode === 'letters') {
        script = replaceRequired(script, /let touchY = null;[\s\S]*?(?=addEventListener\('keydown')/, touchHandlers);
        script = replaceRequired(script, /function render\(time\) \{/, `function render(time) {
          const nativeVertical = String(phase === 'state2');
          if (scene.dataset.nativeVertical !== nativeVertical) scene.dataset.nativeVertical = nativeVertical;`);
        preview = preview.replace('</head>', `<style>
          html,body { overscroll-behavior-y: none; }
          .scene { touch-action: pan-x pinch-zoom; }
          .scene[data-native-vertical="true"] { touch-action: pan-y pinch-zoom; }
        </style></head>`);
      }
      let lettering = '';
      if (mode === 'desktop' || mode === 'letters') {
        script = replaceRequired(script, /if \(phase === 'state2' && u >= titleExit\) return;/, `if (phase === 'state2' && u >= titleExit) {
          window.previewLettering?.hide();
          return;
        }`);
        script = replaceRequired(script, /  illumination\.setAttribute\('transform', field\);/, `
        if (window.previewLettering) {
          if (redReveal > 0) {
            illumination.setAttribute('transform', field);
            illumination.setAttribute('opacity', brightness);
            const radius = 460 + beamBlur * .75;
            outerColorField.setAttribute('r', radius);
            lowerColorField.setAttribute('r', radius);
          }
          window.previewLettering.draw({ T, frameDistance, titleDistance, Lloc, sizeLocal, beamBlur, e, inState1 });
          return;
        }
        illumination.setAttribute('transform', field);`);
        lettering = `<script src="${new URL('lettering.js?v=soft-shadow-2', location.href)}"><\/script>`;
      }
      preview = preview.replace(scriptTag, () => `<script>${script.replaceAll('</script', '<\\/script')}<\/script>${lettering}`);
    }
    if (request !== sequence) return;
    frame.srcdoc = preview;
    statusLine.textContent = names[mode];
  } catch (error) {
    if (request !== sequence) return;
    statusLine.textContent = '测试页未能载入。可以点重播再试。';
    console.error(error);
  }
}

buttons.forEach(button => button.addEventListener('click', () => openMode(button.dataset.mode)));
document.querySelector('#replay').addEventListener('click', () => openMode(active));
openMode(new URLSearchParams(location.search).get('mode') || 'letters');
