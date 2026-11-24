const frame = document.querySelector('#stage');
const statusLine = document.querySelector('#status');
const buttons = [...document.querySelectorAll('[data-mode]')];
const names = {
  live: '正式版。自动按设备使用鼠标或触屏操作。',
  desktop: '电脑版字标试验。移动鼠标看扫光，用滚轮进入和退出第二屏。',
  touch: '触屏试验。请试第一次滑动、继续滚动和滑回。',
  letters: '触屏＋字标试验。请比较入场、扩光和笔画高光。',
};
let active;

function openMode(mode) {
  if (!Object.hasOwn(names, mode)) mode = 'letters';
  active = mode;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  history.replaceState(null, '', '?mode=' + mode);
  const url = new URL('../stage/wide/index.html', location.href);
  url.searchParams.set('v', 'cached-lettering-1');
  if (mode !== 'live') url.searchParams.set('stage-test', mode);
  frame.src = url.href;
  statusLine.textContent = names[mode];
}

buttons.forEach(button => button.addEventListener('click', () => openMode(button.dataset.mode)));
document.querySelector('#replay').addEventListener('click', () => openMode(active));
openMode(new URLSearchParams(location.search).get('mode'));
