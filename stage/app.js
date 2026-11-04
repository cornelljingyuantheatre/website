const scene = document.querySelector('.scene');
const stage = document.querySelector('.stage');
const journey = document.querySelector('.journey');
const homeContent = document.querySelector('.home-content');
const showsContent = document.querySelector('.shows-content');
// The light pictures live in a full-viewport layer; the composition stays a scaled 1512x982 stage.
const spotlight = document.querySelector('.light');
const showsBeam = document.querySelector('.shows-beam');
const illumination = document.querySelector('#illumination');
const rimLightField = document.querySelector('#rim-light-field');
const rimLettering = document.querySelector('.rim-lettering');
const textDepthField = document.querySelector('#text-depth-field');
const outerEdge = document.querySelector('#outer-edge');
const outerColorField = document.querySelector('#outer-color-field');
const outerFadeField = document.querySelector('#outer-fade-field');
const lowerColorField = document.querySelector('#lower-color-field');
const lowerFadeField = document.querySelector('#lower-fade-field');
// Judge red reveal against the working light body, not the faintest halo.
// Keep the actual widened shadow/light masks at their original size.
const centralRedTriggerScale = .55;
const photoLight = document.querySelector('.photo-light');
const photoStack = document.querySelector('.photo-stack');
const sideCopy = document.querySelector('.side-copy');
const centralLettering = document.querySelector('.text-field');
const centralTextBounds = [...document.querySelectorAll('.glyph-field rect')].map(rect => ({
  x:Number(rect.getAttribute('x')), y:Number(rect.getAttribute('y')),
  width:Number(rect.getAttribute('width')), height:Number(rect.getAttribute('height')),
}));
const origin = { x: 755.5, y: 493.5 };
const light = { ...origin };
const target = { ...origin };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
// The lettering is fixed. Only its light-field color mask changes per frame.
let scale = 1;
let stageX = 0, stageY = 0; // stage origin in scene pixels
let frame = 0;
let lastTime = 0;
let entering = !reducedMotion.matches;
let entranceStart = null;
let redReveal = 0;
let redRevealGoal = 0;
let redRevealFrom = 0;
let redRevealStart = null;
let centralHasLight = true;
let aperture = entering ? .16 : 1;
let focusBlur = entering ? 18 : 0;
let brightness = entering ? 0 : 1;
let entranceDuration = 0;
let entrancePlan = null;
let scrollTarget=0, scrollProgress=0, scrollSource=null;
// Figma 149:205: light centre, body radius 752.034 (home 244.5) and rotation.
const showsTarget={x:1299.48,y:490.82,size:752.034/244.5,rotation:-29.96};
const showFloats=[...document.querySelectorAll('.show-float')];
// Scroll progress over which page-1 content fades out (light and timeline excluded).
const homeFadeRange=[.03,.45];
// Page-2 float-up: start, per-group delay and duration (scroll progress), rise in px.
const floatStart=.45, floatStagger=.06, floatSpan=.3, floatRise=56;
// The story sequence restarts from its first block whenever page 2 is reached.
let storiesPlaying=false;
let homeShown=true;
const smootherstep = t => t*t*t*(t*(t*6-15)+10);

// Virtual moving-head fixture: pan/tilt angles project a ray onto the page.
// Time is planned in angular space, with zero endpoint velocity/acceleration.
// ROBE Robin 600 reference: 450deg/2.1s fast, 450deg/3.4s theatre.
// Use the theatre angular-rate range; acceleration is a chosen smooth cue profile.
const fixtureLimits = { panRate: 2.31, tiltRate: 2.09, panAccel: 14, tiltAccel: 12 };
function aimAt(point, fixture) {
  const dx=point.x-fixture.x, dy=point.y-fixture.y;
  return { pan: Math.atan2(dx,dy), tilt: Math.atan2(Math.hypot(dx,dy),fixture.height) };
}
function projectAim(aim, fixture) {
  const reach=fixture.height*Math.tan(aim.tilt);
  return { x: fixture.x+reach*Math.sin(aim.pan), y: fixture.y+reach*Math.cos(aim.pan) };
}
function blendAim(a,b,t) { return { pan:a.pan+(b.pan-a.pan)*t, tilt:a.tilt+(b.tilt-a.tilt)*t }; }
function boundedDuration(sample, minimum) {
  // Derivatives with respect to normalized time; scaling duration bounds both
  // angular speed and angular acceleration independently of screen resolution.
  const count=1000, h=1/count;
  let previous=sample(0), velocity=null, duration=minimum;
  for(let i=1;i<=count;i++) {
    const current=sample(i/count);
    const v={pan:(current.pan-previous.pan)/h,tilt:(current.tilt-previous.tilt)/h};
    duration=Math.max(duration,Math.abs(v.pan)/fixtureLimits.panRate,Math.abs(v.tilt)/fixtureLimits.tiltRate);
    if(velocity) duration=Math.max(duration,
      Math.sqrt(Math.abs(v.pan-velocity.pan)/h/fixtureLimits.panAccel),
      Math.sqrt(Math.abs(v.tilt-velocity.tilt)/h/fixtureLimits.tiltAccel));
    previous=current; velocity=v;
  }
  return duration*1.03;
}
function sweepProgress(u) {
  // Startup-test rhythm: a visible progressive acceleration, a brisk scan,
  // then short braking before the home movement. Both ramps have zero jerk
  // at their joins; the normalized integral keeps one exact clockwise lap.
  const acceleration=.30, braking=.14;
  const distance=1-(acceleration+braking)/2;
  const integral=t=>2.5*t**4-3*t**5+t**6;
  if(u<acceleration)return acceleration*integral(u/acceleration)/distance;
  if(u>1-braking)return 1-braking*integral((1-u)/braking)/distance;
  return (u-acceleration/2)/distance;
}
function createEntrancePlan() {
  const fixture={x:origin.x,y:-640,height:900};
  const rx=Math.min(535,Math.max(230,scene.clientWidth/(2*scale)-80)), ry=350;
  const pointAt=angle=>({x:origin.x+rx*Math.sin(angle),y:origin.y-ry*Math.cos(angle)});
  const topAim=aimAt(pointAt(0),fixture), endAim=aimAt(origin,fixture);
  const landingAt=u=>blendAim(topAim,endAim,smootherstep(u));
  // Arc length in fixture-angle space avoids the artificial speed changes of
  // an ellipse driven by a constant angle. Sweep directly from the top,
  // without a preliminary descent or extra stops over side content.
  const count=1536, table=[{angle:0,cost:0}];
  let last=topAim, total=0;
  for(let i=1;i<=count;i++) {
    const angle=i/count*Math.PI*2, aim=aimAt(pointAt(angle),fixture);
    total+=Math.hypot(aim.pan-last.pan,aim.tilt-last.tilt);
    table.push({angle,cost:total}); last=aim;
  }
  // Monotone cubic inverse arc length keeps angular velocity continuous
  // between lookup samples instead of introducing tiny linear-lookup kinks.
  for(let i=0;i<=count;i++) {
    const left=i? (table[i].angle-table[i-1].angle)/(table[i].cost-table[i-1].cost):null;
    const right=i<count? (table[i+1].angle-table[i].angle)/(table[i+1].cost-table[i].cost):null;
    table[i].slope=left===null?right:right===null?left:2*left*right/(left+right);
  }
  const orbitAt=u=>{
    const cost=sweepProgress(u)*total;
    let low=0,high=count;
    while(high-low>1){const mid=(low+high)>>1;if(table[mid].cost<cost)low=mid;else high=mid;}
    const a=table[low],b=table[high],f=clamp((cost-a.cost)/(b.cost-a.cost),0,1);
    const f2=f*f,f3=f2*f,span=b.cost-a.cost;
    const angle=(2*f3-3*f2+1)*a.angle+(-2*f3+3*f2)*b.angle
      +(f3-2*f2+f)*span*a.slope+(f3-f2)*span*b.slope;
    return aimAt(pointAt(angle),fixture);
  };
  const approach=0, orbit=boundedDuration(orbitAt,2.6), landing=boundedDuration(landingAt,.65);
  const duration=orbit+landing;
  return {fixture,rx,ry,approach,orbit,landing,duration,sample(seconds){
    const t=clamp(seconds,0,duration);
    const aim=t<orbit?orbitAt(t/orbit):landingAt((t-orbit)/landing);
    return projectAim(aim,fixture);
  }};
}

// Use the signed light-to-object vector directly. A torso anchor models the
// visible silhouette, rather than the bottom-heavy image bounding box.
const shadows = [
  { el: document.querySelector('.person-shadow'), x: 690, y: 706, height: 150, opacity: .3, blur: 10 },
];
function projection(shadow, source) {
  const dx = shadow.x - source.x;
  const dy = shadow.y - source.y;
  const distance = Math.hypot(dx, dy);
  const elevation = 420;
  const factor = shadow.height / (elevation - shadow.height);
  const angle = Math.atan2(dy, dx);
  const stretch = Math.min(.85, distance / 650) * factor * 2.1;
  const c = Math.cos(angle), s = Math.sin(angle);
  // Rank-one stretch along the light-to-letter axis, with no rotation jump
  // when the light crosses the character's center.
  return {
    x: dx * factor, y: dy * factor,
    a: 1 + stretch*c*c, b: stretch*c*s, d: 1 + stretch*s*s,
    intensity: 1 / (1 + (distance / 430) ** 2),
    blur: 4.743 + distance * .00759,
  };
}
function beamAt(y) {
  // A cone projected from above: a longer throw creates a larger footprint.
  // Use stage coordinates so the same behavior holds at every viewport size.
  const throwRatio = (500 + clamp(y, 0, 982)) / (500 + origin.y);
  const belowFocus = clamp((y-origin.y)/(982-origin.y), 0, 1);
  return {
    size: throwRatio ** 1.1,
    // Preserve the original focus at the resting point. Defocus increases
    // smoothly below it, while the smaller upper footprint tightens its edge.
    blur: 22 * belowFocus ** 1.6,
    intensity: Math.min(1, throwRatio ** -.28),
  };
}
function updateCentralRedState(time) {
  const beam=beamAt(light.y);
  const radius=(344.5+(focusBlur+beam.blur)*.75)*aperture*beam.size*centralRedTriggerScale;
  // Check each actual glyph slot, not the empty rectangle around the whole
  // title. Ignore the faint outer tail; a small tolerance prevents flicker.
  const reach=radius+(centralHasLight?3:0);
  centralHasLight=centralTextBounds.some(box=>{
    const dx=light.x-clamp(light.x,box.x,box.x+box.width);
    const dy=light.y-clamp(light.y,box.y,box.y+box.height);
    return dx*dx+dy*dy<=reach*reach;
  });
  if(entering) {
    redReveal=redRevealGoal=redRevealFrom=0;redRevealStart=null;
    return;
  }
  const goal=centralHasLight?0:1;
  if(goal!==redRevealGoal) {
    redRevealFrom=redReveal;redRevealGoal=goal;redRevealStart=time;
  }
  if(reducedMotion.matches) { redReveal=goal;return; }
  if(redReveal!==goal) {
    redRevealStart ??= time;
    const amount=smootherstep(clamp((time-redRevealStart)/280,0,1));
    redReveal=redRevealFrom+(goal-redRevealFrom)*amount;
  }
}

// One reversible scroll coordinate drives the content and the shared light.
function readScroll() {
  if (innerWidth < 800) return;
  scrollTarget=clamp((window.scrollY-journey.offsetTop)/Math.max(1,journey.offsetHeight-scene.clientHeight),0,1);
  if(scrollTarget>0 && !scrollSource) {
    scrollSource={x:light.x,y:light.y,size:aperture*beamAt(light.y).size};
    finishEntrance(); Object.assign(target,light);
  }
  if(scrollTarget>.999) scrollTarget=1;
  wake();
}
function scrollPose() {
  if(!scrollSource || scrollProgress===0) return {x:light.x,y:light.y,size:aperture*beamAt(light.y).size,rotation:0};
  const t=smootherstep(scrollProgress), a=scrollSource;
  return {x:a.x+(showsTarget.x-a.x)*t,
    y:a.y+(showsTarget.y-a.y)*t-90*Math.sin(Math.PI*t),
    size:Math.exp(Math.log(a.size)+(Math.log(showsTarget.size)-Math.log(a.size))*t),rotation:showsTarget.rotation*t};
}

function render() {
  centralLettering.style.setProperty('--unlit-reveal', redReveal);
  const pose=scrollPose(), lift=982*scrollProgress;
  const source={x:pose.x,y:pose.y+lift};
  const blend=smootherstep(clamp((scrollProgress-.12)/.65,0,1));
  homeContent.style.transform=`translateY(${-lift}px)`;
  // Page-1 content fades out over the first part of the scroll while the light
  // travels on into page 2. Once invisible it is hidden outright, so its masks,
  // filters and shadow stop being updated and repainted.
  const homeFade=1-smootherstep(clamp((scrollProgress-homeFadeRange[0])/(homeFadeRange[1]-homeFadeRange[0]),0,1));
  const homeVisible=homeFade>.001;
  homeContent.style.opacity=homeFade;
  if(homeVisible!==homeShown) { homeContent.style.visibility=homeVisible?'':'hidden'; homeShown=homeVisible; }
  showsContent.style.transform=`translateY(${982-lift}px)`;
  showsContent.inert=scrollProgress<.98;
  if(scrollProgress>=.9 && !storiesPlaying) { storiesPlaying=true; showsContent.classList.add('stories-playing'); }
  else if(scrollProgress<.5 && storiesPlaying) { storiesPlaying=false; showsContent.classList.remove('stories-playing'); }
  // Page-2 groups float up in sequence (date, title, credits, buttons) as they arrive.
  showFloats.forEach((el,i)=>{
    const t=smootherstep(clamp((scrollProgress-(floatStart+i*floatStagger))/floatSpan,0,1));
    el.style.opacity=t;
    el.style.transform=reducedMotion.matches?'none':`translateY(${(1-t)*floatRise}px)`;
  });
  const beam = beamAt(light.y);
  const beamBlur = focusBlur + beam.blur;
  const beamIntensity = brightness * beam.intensity;
  // Design coordinates are unclamped, so the same pose can sit over the black
  // side margins; convert it to viewport pixels for the full-background layer.
  spotlight.style.transform = `translate(${stageX+pose.x*scale-344.5}px, ${stageY+pose.y*scale-344.5}px) scale(${pose.size*scale}) rotate(${pose.rotation}deg)`;
  // Keep the upper beam focused and blend continuously into the defocused
  // lower beam. Never apply a whole-light filter or modify the title glyphs.
  spotlight.style.setProperty('--beam-blur', `${beamBlur}px`);
  // The home picture crossfades into the Shows light picture during the scroll.
  showsBeam.style.transform = `translate(${stageX+pose.x*scale-1442.93}px, ${stageY+pose.y*scale-1586.98}px) scale(${scale*pose.size/showsTarget.size}) rotate(${pose.rotation}deg)`;
  showsBeam.style.opacity = blend;
  spotlight.style.opacity = beamIntensity*(1-blend);
  if(!homeVisible) return;
  // A geometric outer contour cannot re-trigger on bright/dark patches inside
  // the artwork. Broad smootherstep weights retain continuous readable strokes.
  const fieldTransform = `translate(${source.x} ${source.y}) scale(${pose.size}) translate(-344.5 -344.5)`;
  textDepthField.setAttribute('transform', fieldTransform);
  rimLightField.setAttribute('transform', fieldTransform);
  rimLettering.style.opacity=.38*(1-redReveal)*brightness;
  for (const field of [illumination, outerEdge]) {
    field.setAttribute('transform', fieldTransform);
    field.setAttribute('opacity', brightness);
  }
  // Letter visibility has its own continuous distance fade. Its wider radial
  // falloff reveals more strokes in every direction without changing the rendered light footprint.
  const outerRadius = 344.5+beamBlur*.75;
  outerColorField.setAttribute('r', 460+beamBlur*.75);
  outerFadeField.setAttribute('r', outerRadius);
  lowerColorField.setAttribute('r', 460+beamBlur*.75);
  lowerFadeField.setAttribute('r', outerRadius);
  // Photo coordinates are local to its original Figma crop window. Let the
  // light enter or leave freely on every side; do not clamp to the photo.
  photoLight.style.setProperty('--reveal-x', `${source.x-975.9285}px`);
  photoLight.style.setProperty('--reveal-y', `${source.y-302.4285}px`);
  photoLight.style.setProperty('--reveal-radius', `${Math.max(.01,outerRadius*pose.size)}px`);
  photoLight.style.opacity = beamIntensity;
  sideCopy.style.setProperty('--reveal-x', `${source.x-152}px`);
  sideCopy.style.setProperty('--reveal-y', `${source.y-309.5}px`);
  sideCopy.style.setProperty('--reveal-radius', `${Math.max(.01,outerRadius*pose.size)}px`);
  sideCopy.style.opacity = beamIntensity;
  for (const shadow of shadows) {
    const p = projection(shadow, source);
    const x = clamp(p.x * .5, -130, 130);
    const y = clamp(p.y * .5, -130, 130);
    shadow.el.style.transform = `translate(${x}px, ${y}px) matrix(${p.a}, ${p.b}, ${p.b}, ${p.d}, 0, 0)`;
    shadow.el.style.opacity = clamp(shadow.opacity * p.intensity, .055, shadow.opacity) * beamIntensity;
    shadow.el.style.filter = `blur(${clamp(shadow.blur + Math.hypot(shadow.x-source.x, shadow.y-source.y)*.005 + beamBlur*.08, shadow.blur, 22)}px)`;
  }
}
function tick(time) {
  if (entering) {
    entranceStart ??= time;
    const elapsed=Math.max(0,(time-entranceStart)/1000);
    const progress=clamp(elapsed/entrancePlan.duration,0,1);
    Object.assign(light,entrancePlan.sample(elapsed));
    const opening=smootherstep(clamp(elapsed/.2,0,1));
    aperture=.7+.3*opening;
    focusBlur=6*(1-opening);
    brightness=smootherstep(clamp(elapsed/.12,0,1));
    if(progress===1 || reducedMotion.matches) {
      entering=false;
      lastTime=time;
      Object.assign(light,origin);Object.assign(target,origin);
      aperture=brightness=1;focusBlur=0;
    }
    updateCentralRedState(time);
    render();
    frame = entering || redReveal!==redRevealGoal ? requestAnimationFrame(tick) : 0;
    return;
  }
  const dt = Math.min((time-lastTime) || 16.7, 50);
  lastTime = time;
  const scrollEase=reducedMotion.matches?1:1-Math.exp(-dt/85);
  scrollProgress+=(scrollTarget-scrollProgress)*scrollEase;
  const scrollSettled=Math.abs(scrollTarget-scrollProgress)<.00001;
  if(scrollSettled) scrollProgress=scrollTarget;
  if(scrollProgress===0 && scrollTarget===0 && scrollSource) {
    Object.assign(light,{x:scrollSource.x,y:scrollSource.y}); Object.assign(target,light);scrollSource=null;
  }
  const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-dt/65);
  light.x += (target.x-light.x)*ease;
  light.y += (target.y-light.y)*ease;
  const settled = Math.hypot(target.x-light.x, target.y-light.y) < .05;
  if (settled) Object.assign(light, target);
  updateCentralRedState(time);
  render();
  frame = settled && scrollSettled && redReveal===redRevealGoal ? 0 : requestAnimationFrame(tick);
}
function wake() { if (!frame) { lastTime = 0; frame = requestAnimationFrame(tick); } }
function reset() { if (entering || scrollTarget>0 || scrollProgress>0) return; Object.assign(target, origin); wake(); }
function finishEntrance() {
  entering = false;
  aperture = brightness = 1;
  focusBlur = 0;
}
// The light may travel over the whole visible scene, including the margins
// outside the 1512x982 artboard. Bounds are expressed in design coordinates.
function viewBounds() {
  return { x0:-stageX/scale, x1:(scene.clientWidth-stageX)/scale, y0:-stageY/scale, y1:(scene.clientHeight-stageY)/scale };
}
function aimPointer(event) {
  const bounds = stage.getBoundingClientRect(), view = viewBounds();
  target.x = clamp((event.clientX-bounds.left)/scale, view.x0, view.x1);
  target.y = clamp((event.clientY-bounds.top)/scale, view.y0, view.y1);
}
function resize() {
  if (innerWidth < 800) return;
  // Small screens crop only the distant black margins, keeping the composition legible.
  const designWidth = innerWidth < 700 ? 940 : 1512;
  scale = Math.min(scene.clientWidth/designWidth, scene.clientHeight/982);
  stage.style.setProperty('--scale', scale);
  stageX = (scene.clientWidth-1512*scale)/2;
  stageY = (scene.clientHeight-982*scale)/2;
  reset();
}
scene.addEventListener('pointermove', event => {
  if (entering || scrollTarget>0 || scrollProgress>0) return;
  aimPointer(event);
  wake();
});
scene.addEventListener('pointerdown', event => {
  if(scrollTarget>0 || scrollProgress>0 || event.target.closest('button')) return;
  finishEntrance();
  if (event.pointerType !== 'mouse') scene.setPointerCapture(event.pointerId);
  aimPointer(event);
  wake();
});
scene.addEventListener('pointerleave', reset);
scene.addEventListener('pointercancel', reset);
scene.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') reset(); });
scene.addEventListener('keydown', event => {
  if(scrollTarget>0 || scrollProgress>0 || event.target.closest('button')) return;
  const delta = { ArrowLeft: [-35,0], ArrowRight: [35,0], ArrowUp: [0,-35], ArrowDown: [0,35] }[event.key];
  if (event.key === 'Escape' || event.key === 'Home') { event.preventDefault(); finishEntrance(); reset(); }
  if (!delta) return;
  finishEntrance();
  event.preventDefault();
  const view = viewBounds();
  target.x = clamp(target.x+delta[0], view.x0, view.x1);
  target.y = clamp(target.y+delta[1], view.y0, view.y1);
  wake();
});
window.addEventListener('scroll',readScroll,{passive:true});
window.addEventListener('resize',()=>{resize();readScroll();});
window.addEventListener('blur', reset);
resize();
if (entering) {
  entrancePlan=createEntrancePlan();
  entranceDuration=entrancePlan.duration*1000;
  Object.assign(light,entrancePlan.sample(0));
}
render();
// Lettering is real text in AaRuiYaTi / Alibaba PuHuiTi. Hold the (still dark)
// entrance until both faces and the images are ready, with a short fallback.
const fontsReady = document.fonts ? Promise.all([
  document.fonts.load('184px AaRuiYaTi', '境缘'), document.fonts.load('700 24px "Alibaba PuHuiTi"', '台'),
]).catch(() => {}) : Promise.resolve();
Promise.race([
  Promise.all([fontsReady, ...[...document.images].map(img => img.decode().catch(() => {}))]),
  new Promise(done => setTimeout(done, 2500)),
]).then(() => { entranceStart = null; readScroll(); wake(); });

// Start only after both photos decode; a slow second image cannot create a blank fade.
Promise.all([...photoStack.querySelectorAll('img')].map(img => img.decode()))
  .then(() => photoStack.classList.add('is-ready')).catch(() => {});
