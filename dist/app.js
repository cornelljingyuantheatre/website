const main=document.querySelector('main');const seasons=['Fall 2026','Spring 2026','Fall 2025','Spring 2025','Fall 2024','Spring 2024','Fall 2023','Spring 2023','Fall 2022'];let season='Fall 2026';let department='Publicity';
function home(){main.innerHTML=`<section class="hero" tabindex="0" aria-label="Interactive theatre spotlight. Move your pointer or use arrow keys to guide the light."><span class="eyebrow">境缘 · JINGYUAN</span><h1><span>Chinese</span><span>Drama Society</span><span>At Cornell</span></h1><div class="hero-bottom"><span>A SPACE FOR STORIES. A STAGE FOR CONNECTION.</span><a href="#shows">EXPLORE OUR SHOWS ↓</a></div></section><section class="home-show home-section" id="this-year"><div class="section-heading"><div><span class="eyebrow">THIS YEAR · 本年度演出</span><h2>A new story takes the stage.</h2></div><span class="season-tag">FALL 2026</span></div><div class="featured-show"><div class="poster featured-poster" aria-label="This year's show poster placeholder"><span>JINGYUAN THEATRE<br>境缘剧社</span><span>FALL 2026<br>POSTER COMING SOON</span></div><div class="show-copy"><span class="eyebrow">OUR CURRENT PRODUCTION</span><h3>Show title coming soon<br><span lang="zh">剧目待公布</span></h3><p>This year's story starts here. The full show description and bilingual introduction will be added once the production details are confirmed.</p><dl><div><dt>Producer · 制作人</dt><dd>To be announced</dd></div><div><dt>Director · 导演</dt><dd>To be announced</dd></div></dl><div class="show-actions"><a class="pill" href="#shows">Explore the show ↗</a><button class="ticket" data-ticket>Ticket information ↗</button></div></div></div><div class="production-notes"><article><span class="eyebrow">FROM THE PRODUCER · 制作人寄语</span><h3>Bringing the story together.</h3><p>The producer’s note will appear here: an introduction to this year’s production, the collaboration behind it, and the journey to opening night.</p><span class="note-signoff">Producer’s note coming soon</span></article><article><span class="eyebrow">FROM THE DIRECTOR · 导演寄语</span><h3>A vision for the stage.</h3><p>The director’s note will appear here: the ideas behind the play, its themes, and the creative choices that shape the performance.</p><span class="note-signoff">Director’s note coming soon</span></article></div></section><section class="home-about home-section" id="about"><div><span class="eyebrow">ABOUT THE CLUB · 关于境缘</span><h2>戏里戏外<br>Across the curtain.</h2></div><div class="about-copy"><p class="large-copy">We are 境缘, the Chinese Drama Society at Cornell.</p><p>A space for stories and the people who bring them to life. Explore our work on stage, discover the collaboration behind each production, and meet our community.</p><p lang="zh">以戏剧相遇，在舞台内外连接彼此。</p><a class="pill" href="mailto:cornelljingyuantheatre@gmail.com">Get in touch ↗</a></div></section><section class="home-eboard home-section"><div class="section-heading"><div><span class="eyebrow">THE PEOPLE · 我们</span><h2>Meet our eboard.</h2></div><a class="pill" href="#eboard">Meet everyone ↗</a></div><div class="eboard-teaser"><div class="board-mark" aria-hidden="true">境缘</div><div><h3>Behind every curtain call,<br>there’s a team.</h3><p>Meet our executive board and the publicity, photography, finance, social, and external teams who help bring 境缘 together.</p><a class="text-link" href="#eboard">Explore the people behind the stage ↗</a></div></div></section><section class="home-past home-section"><div class="section-heading"><div><span class="eyebrow">PAST SHOWS · 往期演出</span><h2>From our stage.</h2></div><a class="pill" href="#shows">View the archive ↗</a></div><div class="past-grid">${['Spring 2026','Fall 2025','Spring 2025'].map((s,i)=>`<a class="past-show" href="#shows" data-past-season="${s}"><div class="archive-art archive-art-${i}" aria-label="${s} poster placeholder"><span>境缘</span><small>POSTER COMING SOON</small></div><div class="past-caption"><div><span class="eyebrow">${s.toUpperCase()}</span><h3>Production details coming soon</h3></div><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>`;main.querySelectorAll('[data-past-season]').forEach(a=>a.addEventListener('click',()=>{season=a.dataset.pastSeason}));let hero=main.querySelector('.hero'),x=50,y=46;function move(){hero.style.setProperty('--x',x+'%');hero.style.setProperty('--y',y+'%')}hero.addEventListener('pointermove',e=>{let r=hero.getBoundingClientRect();x=(e.clientX-r.left)/r.width*100;y=(e.clientY-r.top)/r.height*100;move()});hero.addEventListener('pointerleave',()=>{x=50;y=46;move()});hero.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape'){x=50;y=46}else{x=Math.max(0,Math.min(100,x+(e.key==='ArrowRight'?5:e.key==='ArrowLeft'?-5:0)));y=Math.max(0,Math.min(100,y+(e.key==='ArrowDown'?5:e.key==='ArrowUp'?-5:0)))}move()}})}
function productionMarkup(){return `<article class="production" tabindex="0" aria-label="Show details, scroll to read more"><div class="production-intro"><div class="poster" aria-label="Poster placeholder"><span>JINGYUAN THEATRE<br>境缘剧社</span><span>${season.toUpperCase()}<br>POSTER COMING SOON</span></div><div><span class="eyebrow">${season.toUpperCase()} · PRODUCTION</span><h2>To be announced<br><span lang="zh">剧目待公布</span></h2><p>Production title, producers, and bilingual show introduction will appear here once confirmed.</p><p>演出介绍即将公布。</p><button class="pill" data-ticket>Ticket information ↗</button></div></div><div class="gallery">${[1,2,3].map(n=>`<div class="photo-placeholder">Production photo ${n}</div>`).join('')}</div><div class="credits"><section><h3>Cast <span lang="zh">演员</span></h3><p>Cast names and character credits coming soon.</p></section><section><h3>Crew <span lang="zh">舞美</span></h3><p>Production, lighting, sound, and creative credits coming soon.</p></section></div><div class="video-placeholder"><span class="play">▷</span><span>Performance video coming soon</span></div></article>`}
function shows(){main.innerHTML=`<section class="page-top shows-page-top"><div><span class="eyebrow">ON STAGE · 舞台</span><h1>Our shows.</h1></div><p>Stories, season after season.</p></section><div class="show-layout"><aside class="seasons" aria-label="Show seasons"><button class="today" data-today>Today</button><div class="season-wheel" aria-label="Season picker">${seasons.map(s=>`<button class="${s===season?'active':''}" aria-pressed="${s===season}" data-season="${s}">${s.toUpperCase()}</button>`).join('')}</div></aside>${productionMarkup()}</div>`;const wheel=main.querySelector('.season-wheel');const items=[...wheel.querySelectorAll('[data-season]')];let settleTimer;function selectSeason(value){season=value;items.forEach(button=>{button.classList.toggle('active',button.dataset.season===season);button.setAttribute('aria-pressed',String(button.dataset.season===season))});main.querySelector('.production').outerHTML=productionMarkup();bindTickets()}
function centerItem(button,smooth=true){wheel.scrollTo({top:button.offsetTop-(wheel.clientHeight-button.offsetHeight)/2,behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'})}
items.forEach(button=>button.onclick=()=>{selectSeason(button.dataset.season);centerItem(button)});
main.querySelector('[data-today]').onclick=()=>{selectSeason('Fall 2026');centerItem(items[0])};
wheel.addEventListener('scroll',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(()=>{if(!wheel.isConnected)return;const middle=wheel.getBoundingClientRect().top+wheel.clientHeight/2;const closest=items.reduce((best,item)=>Math.abs(item.getBoundingClientRect().top+item.offsetHeight/2-middle)<Math.abs(best.getBoundingClientRect().top+best.offsetHeight/2-middle)?item:best);if(closest.dataset.season!==season)selectSeason(closest.dataset.season)},120)},{passive:true});
wheel.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();let index=items.findIndex(b=>b.dataset.season===season);index=e.key==='Home'?0:e.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,index+(e.key==='ArrowDown'?1:-1)));selectSeason(items[index].dataset.season);items[index].focus({preventScroll:true});centerItem(items[index])});
requestAnimationFrame(()=>{if(wheel.isConnected)centerItem(items.find(b=>b.dataset.season===season),false)});bindTickets()}
const boardPeople={
  "Hedy": {
    "name": "Hedy",
    "chineseName": "宋一瑾",
    "photo": "images/eboard/hedy.jpg"
  },
  "Mary": {
    "name": "Mary",
    "chineseName": "杨舒婷",
    "photo": "images/eboard/mary.jpg"
  },
  "Bill": {
    "name": "Bill",
    "chineseName": "许比尔",
    "photo": "images/eboard/bill.jpg"
  },
  "Wenjia": {
    "name": "Wenjia",
    "chineseName": "孙文嘉",
    "photo": "images/eboard/wenjia.jpg"
  },
  "Emily": {
    "name": "Emily",
    "chineseName": "马君竹",
    "photo": "images/eboard/emily.jpg"
  },
  "Hemchee": {
    "name": "Hemchee",
    "chineseName": "钟晗齐",
    "photo": "images/eboard/hemchee.jpg"
  },
  "Susan": {
    "name": "Susan",
    "chineseName": "徐梓欣",
    "photo": "images/eboard/susan.jpg"
  },
  "Mike": {
    "name": "Mike",
    "chineseName": "张皓清",
    "photo": "images/eboard/mike.jpg"
  },
  "Rose": {
    "name": "Rose",
    "chineseName": "余文琼",
    "photo": null
  },
  "Yanni": {
    "name": "Yanni",
    "chineseName": "仲彦霓",
    "photo": "images/eboard/yanni.jpg"
  },
  "Sophie": {
    "name": "Sophie",
    "chineseName": "曾子芩",
    "photo": "images/eboard/sophie.jpg"
  },
  "Kitty": {
    "name": "Kitty",
    "chineseName": "章安涛",
    "photo": "images/eboard/kitty.jpg"
  },
  "Darcie": {
    "name": "Darcie",
    "chineseName": "夏雨琦",
    "photo": "images/eboard/darcie.jpg"
  },
  "Anny": {
    "name": "Anny",
    "chineseName": "王晨怿",
    "photo": "images/eboard/anny.jpg"
  },
  "Karrie": {
    "name": "Karrie",
    "chineseName": "符嘉蔚",
    "photo": "images/eboard/karrie.jpg"
  },
  "Ricky": {
    "name": "Ricky",
    "chineseName": "单炜宁",
    "photo": "images/eboard/ricky.jpg"
  },
  "Jack": {
    "name": "Jack",
    "chineseName": "管昕",
    "photo": "images/eboard/jack.jpg"
  },
  "Cynthia": {
    "name": "Cynthia",
    "chineseName": "白宇馨",
    "photo": "images/eboard/cynthia.jpg"
  },
  "Luna": {
    "name": "Luna",
    "chineseName": "刘明萱",
    "photo": "images/eboard/luna.jpg"
  },
  "Celine": {
    "name": "Celine",
    "chineseName": "宋语涵",
    "photo": "images/eboard/celine.jpg"
  },
  "Zemo": {
    "name": "Zemo",
    "chineseName": "李子慕",
    "photo": "images/eboard/zemo.jpg"
  },
  "Stephanie": {
    "name": "Stephanie",
    "chineseName": "秦睿含",
    "photo": "images/eboard/stephanie.jpg"
  },
  "Rosita": {
    "name": "Rosita",
    "chineseName": "季曾逸",
    "photo": "images/eboard/rosita.jpg"
  },
  "Lillian": {
    "name": "Lillian",
    "chineseName": "陈莉莲",
    "photo": "images/eboard/lillian.jpg"
  },
  "Ye": {
    "name": "Ye",
    "chineseName": "林烨",
    "photo": "images/eboard/ye.jpg"
  },
  "Carnegie": {
    "name": "Carnegie",
    "chineseName": "冯启翔",
    "photo": "images/eboard/carnegie.jpg"
  },
  "Leo": {
    "name": "Leo",
    "chineseName": "李昱泽",
    "photo": "images/eboard/leo.jpg"
  },
  "Cliff": {
    "name": "Cliff",
    "chineseName": "张均霆",
    "photo": "images/eboard/cliff.jpg"
  },
  "Yan": {
    "name": "Yan",
    "chineseName": "吴彦",
    "photo": "images/eboard/yan.jpg"
  },
  "Bowen": {
    "name": "Bowen",
    "chineseName": "余博文",
    "photo": "images/eboard/bowen.jpg"
  },
  "Wei": {
    "name": "Wei",
    "chineseName": "任晨微",
    "photo": "images/eboard/wei.jpg"
  },
  "Steven": {
    "name": "Steven",
    "chineseName": "杨粟元",
    "photo": "images/eboard/steven.jpg"
  },
  "Jay": {
    "name": "Jay",
    "chineseName": "倪国杰",
    "photo": "images/eboard/jay.jpg"
  },
  "David": {
    "name": "David",
    "chineseName": "刘煦之",
    "photo": "images/eboard/david.jpg"
  },
  "Songhan": {
    "name": "Songhan",
    "chineseName": "张宋涵",
    "photo": "images/eboard/songhan.jpg"
  },
  "Ted": {
    "name": "Ted",
    "chineseName": "夏陆尚上",
    "photo": "images/eboard/ted.jpg"
  }
};
const executiveBoard=[
 {id:'Hedy',role:'Co-President 主席'},
 {id:'Mary',role:'Co-President 主席'},
 {id:'Bill',role:'Vice President 副主席'},
 {id:'Wenjia',role:'Secretary 秘书'},
 {id:'Emily',role:'Technical Director 技术总监'},
 {id:'Hemchee',role:'Artistic Director 艺术总监'}
];
// Department boundaries and ordering follow the merged cells in the supplied roster.
const boardGroups=[
 {id:'Publicity',label:'Publicity 宣传部',members:['Susan','Mike','Rose','Yanni','Sophie','Kitty','Darcie','Anny','Karrie']},
 {id:'Photography',label:'Photography 摄影部',members:['Ricky','Jack','Cynthia','Luna','Celine','Zemo','Stephanie','Rosita']},
 {id:'Finance',label:'Finance 财务部',members:['Bill','Lillian','Ye']},
 {id:'External',label:'External 外联部',members:['Carnegie','Leo','Cliff']},
 {id:'Social',label:'Social 内联部',members:['Yan','Bowen','Wei','Steven','Jay','David','Songhan','Ted']}
];
function member(id,role=''){
 const person=boardPeople[id];
 const portrait=person.photo
  ? `<div class="portrait"><img src="${person.photo}" alt="${person.name} ${person.chineseName}" loading="lazy" decoding="async"></div>`
  : `<div class="portrait portrait-pending"><span lang="zh">照片待补</span></div>`;
 return `<article class="member" data-member="${id}">${portrait}<h3>${person.name} <span lang="zh">${person.chineseName}</span></h3>${role?`<p>${role}</p>`:''}</article>`;
}
function departmentRows(group){
 const rows=[];
 for(let i=0;i<group.members.length;i+=4){
  rows.push(`<div class="department-row">${group.members.slice(i,i+4).map(id=>member(id)).join('')}</div>`);
 }
 return rows.join('');
}
function eboard(){
 const group=boardGroups.find(g=>g.id===department)||boardGroups[0];
 main.innerHTML=`<section class="page-top shows-page-top eboard-page-top"><div><h1>Eboard <span lang="zh">境缘团队</span></h1></div></section><section class="board"><h2>Our executive board · 主席团</h2><div class="members">${executiveBoard.map(({id,role})=>member(id,role)).join('')}</div><div class="departments" aria-label="Departments">${boardGroups.map(g=>`<button data-dept="${g.id}" class="${g.id===group.id?'active':''}" aria-pressed="${g.id===group.id}">${g.label}</button>`).join('')}</div><section class="department-members" aria-label="${group.label}"><h2 class="department-title">${group.label}</h2>${departmentRows(group)}</section></section>`;
 main.querySelectorAll('[data-dept]').forEach(b=>b.onclick=()=>{department=b.dataset.dept;eboard();main.querySelector(`[data-dept="${department}"]`).focus({preventScroll:true})});
}
const dialog=document.querySelector('dialog');function bindTickets(){document.querySelectorAll('[data-ticket]').forEach(b=>b.onclick=()=>dialog.showModal())}document.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){let r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});function render(){let page=location.hash.slice(1)||'home';document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.hash==='#'+page);if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});({home,shows,eboard}[page]||home)();bindTickets();window.scrollTo(0,0)}window.addEventListener('hashchange',render);render();
