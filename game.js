const N = 10;

const board = document.getElementById("board");
const statusEl = document.getElementById("status");

let obstacles = new Set();
let history = [];
let gameOver = false;

let cat = { q: 0, r: 0 };
let cells = new Map();

/* 🐱 猫 */
const catEl = document.createElement("div");
catEl.id = "cat";
catEl.innerHTML = `
<svg viewBox="0 0 64 64" width="100%" height="100%">
  <polygon points="12,20 22,2 30,22" fill="#f1c40f"/>
  <polygon points="52,20 42,2 34,22" fill="#f1c40f"/>
  <circle cx="32" cy="34" r="20" fill="#f1c40f"/>
  <circle cx="24" cy="32" r="3" fill="#111"/>
  <circle cx="40" cy="32" r="3" fill="#111"/>
  <path d="M26 42 Q32 46 38 42" stroke="#111" stroke-width="2" fill="none"/>
</svg>
`;
board.appendChild(catEl);

const dirs = [
  [1,0], [1,-1], [0,-1],
  [-1,0], [-1,1], [0,1]
];

function key(q,r){ return `${q},${r}`; }

function dist(a,b){
  return (Math.abs(a.q - b.q)
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2;
}

function inBoard(q,r){
  return dist({q,r},{q:0,r:0}) <= N;
}

function isEdge(q,r){
  return dist({q,r},{q:0,r:0}) === N;
}

const spacing = 26;

function toPixel(q,r){
  return {
    x: (q + r/2) * spacing,
    y: r * spacing * 0.9
  };
}

function updateCat(){
  const p = toPixel(cat.q, cat.r);
  catEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

/* =========================
   BFS（不变）
========================= */
function bfsNext(start){
  let queue = [start];
  let distMap = new Map();
  let parent = new Map();

  distMap.set(key(start.q,start.r), 0);

  let best = Infinity;
  let targets = [];

  while(queue.length){
    let cur = queue.shift();
    let d = distMap.get(key(cur.q,cur.r));

    if(d > best) continue;

    if(isEdge(cur.q,cur.r)){
      best = d;
      targets.push(cur);
      continue;
    }

    for(let [dq,dr] of dirs){
      let nq = cur.q + dq;
      let nr = cur.r + dr;
      let k = key(nq,nr);

      if(!inBoard(nq,nr)) continue;
      if(obstacles.has(k)) continue;
      if(distMap.has(k)) continue;

      distMap.set(k, d + 1);
      parent.set(k, cur);

      queue.push({q:nq,r:nr});
    }
  }

  if(targets.length === 0) return null;

  let target = targets[Math.floor(Math.random()*targets.length)];

  let cur = target;
  let step = null;

  while(true){
    let p = parent.get(key(cur.q,cur.r));
    if(!p) break;

    if(p.q === start.q && p.r === start.r){
      step = cur;
      break;
    }

    cur = p;
  }

  return step;
}

/* =========================
   游戏结束检测
========================= */
function checkFail(){
  if(isEdge(cat.q, cat.r)){
    statusEl.innerText = "猫逃出边界！你失败了 💀";
    gameOver = true;
    return true;
  }
  return false;
}

/* 猫移动 */
function moveCat(){
  if(gameOver) return;

  let next = bfsNext(cat);

  if(!next){
    statusEl.innerText = "猫被困住了！你赢了 🎉";
    gameOver = true;
    return;
  }

  cat = next;
  updateCat();

  checkFail(); // 🔥 新增：到边界失败
}

/* =========================
   点击格子（🔥 修改点）
========================= */
function toggle(q,r){
  if(gameOver) return;

  // ❌ 禁止点猫
  if(cat.q === q && cat.r === r) return;

  let k = key(q,r);

  // ❌ 禁止点已有障碍
  if(obstacles.has(k)) return;

  save();

  obstacles.add(k);
  cells.get(k).classList.add("obstacle");

  moveCat();
}

/* 保存 */
function save(){
  history.push({
    cat: {...cat},
    obstacles: new Set([...obstacles])
  });
}

/* 悔棋 */
function undo(){
  if(history.length === 0) return;

  let last = history.pop();

  cat = last.cat;
  obstacles = new Set(last.obstacles);

  cells.forEach((el,k)=>{
    el.classList.toggle("obstacle", obstacles.has(k));
  });

  updateCat();
  gameOver = false;
  statusEl.innerText = "";
}

/* 初始化 */
function init(){
  for(let q=-N;q<=N;q++){
    for(let r=-N;r<=N;r++){
      let s = -q-r;
      if(Math.abs(s) > N) continue;

      let el = document.createElement("div");
      el.className = "hex";

      let k = key(q,r);

      let d = dist({q,r},{q:0,r:0});
      el.classList.add(d === 0 ? "start" : (d % 2 ? "dark" : "light"));

      let p = toPixel(q,r);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;

      el.onclick = () => toggle(q,r);

      board.appendChild(el);
      cells.set(k, el);
    }
  }

  updateCat();
}

/* 重开 */
function resetGame(){
  obstacles.clear();
  history = [];
  cat = {q:0,r:0};
  gameOver = false;
  statusEl.innerText = "";

  cells.forEach(el => el.classList.remove("obstacle"));
  updateCat();
}

init();