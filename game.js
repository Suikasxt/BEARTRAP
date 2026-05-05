const N = 10;

const board = document.getElementById("board");
const statusEl = document.getElementById("status");

let obstacles = new Set();
let cat = { q: 0, r: 0 };
let cells = new Map();

const history = []; // 🔥 悔棋栈

const catEl = document.createElement("div");
catEl.id = "cat";
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

/* 🔥 BFS（保留最短路逻辑） */
function bfsAllNextSteps(start){
  let queue = [start];
  let distMap = new Map();
  let firstStepMap = new Map();

  distMap.set(key(start.q,start.r), 0);
  firstStepMap.set(key(start.q,start.r), null);

  let bestEdgeDist = Infinity;
  let candidates = [];

  while(queue.length){
    let cur = queue.shift();
    let curKey = key(cur.q,cur.r);
    let curDist = distMap.get(curKey);

    if(curDist > bestEdgeDist) continue;

    if(isEdge(cur.q,cur.r)){
      bestEdgeDist = curDist;
      candidates.push(cur);
      continue;
    }

    for(let [dq,dr] of dirs){
      let nq = cur.q + dq;
      let nr = cur.r + dr;
      let k = key(nq,nr);

      if(!inBoard(nq,nr)) continue;
      if(obstacles.has(k)) continue;
      if(distMap.has(k)) continue;

      distMap.set(k, curDist + 1);

      if(cur.q === start.q && cur.r === start.r){
        firstStepMap.set(k, {q:nq,r:nr});
      } else {
        firstStepMap.set(k, firstStepMap.get(curKey));
      }

      queue.push({q:nq,r:nr});
    }
  }

  if(candidates.length === 0) return null;

  let target = candidates[Math.floor(Math.random() * candidates.length)];
  return firstStepMap.get(key(target.q,target.r));
}

/* =========================
   🔥 记录状态（用于悔棋）
========================= */
function saveState(){
  history.push({
    cat: { ...cat },
    obstacles: new Set([...obstacles])
  });
}

/* =========================
   玩家操作
========================= */
function moveCat(){
  let next = bfsAllNextSteps(cat);

  if(!next){
    statusEl.innerText = "猫被困住了！你赢了 🎉";
    return;
  }

  cat = next;
  updateCat();
}

/* 点击格子 */
function toggle(q,r){
  let k = key(q,r);

  saveState(); // 🔥 每一步都存

  if(obstacles.has(k)){
    obstacles.delete(k);
    cells.get(k).classList.remove("obstacle");
  } else {
    obstacles.add(k);
    cells.get(k).classList.add("obstacle");
  }

  moveCat();
}

/* =========================
   悔棋
========================= */
function undo(){
  if(history.length === 0) return;

  const last = history.pop();

  cat = last.cat;
  obstacles = new Set(last.obstacles);

  // 重新渲染障碍
  cells.forEach((el,k)=>{
    if(obstacles.has(k)){
      el.classList.add("obstacle");
    } else {
      el.classList.remove("obstacle");
    }
  });

  updateCat();
  statusEl.innerText = "";
}

/* =========================
   初始化棋盘
========================= */
function init(){
  for(let q=-N;q<=N;q++){
    for(let r=-N;r<=N;r++){
      let s = -q-r;
      if(Math.abs(s) > N) continue;

      let el = document.createElement("div");
      el.className = "hex";

      let k = key(q,r);

      let d = dist({q,r},{q:0,r:0});
      if(d === 0){
        el.classList.add("start");
      } else {
        el.classList.add(d % 2 === 0 ? "light" : "dark");
      }

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
  history.length = 0;
  cat = {q:0,r:0};
  statusEl.innerText = "";

  cells.forEach(el => el.classList.remove("obstacle"));
  updateCat();
}

init();