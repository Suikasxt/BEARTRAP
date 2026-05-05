const N = 10; // 🔥 棋盘缩小
const board = document.getElementById("board");
const statusEl = document.getElementById("status");

let obstacles = new Set();

let cat = { q: 0, r: 0 };

let cells = new Map();

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

/* 🔥 BFS + 多最短路随机选择 */
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

      // 记录第一步方向
      if(cur.q === start.q && cur.r === start.r){
        firstStepMap.set(k, {q:nq,r:nr});
      } else {
        firstStepMap.set(k, firstStepMap.get(curKey));
      }

      queue.push({q:nq,r:nr});
    }
  }

  if(candidates.length === 0) return null;

  // 🔥 从所有最短边界点随机选一个
  let target = candidates[Math.floor(Math.random() * candidates.length)];

  // 回溯第一步
  let k = key(target.q,target.r);
  let step = firstStepMap.get(k);

  return step;
}

/* 猫移动（随机最短路） */
function moveCat(){
  let next = bfsAllNextSteps(cat);

  if(!next){
    statusEl.innerText = "猫被困住了！你赢了 🎉";
    return;
  }

  cat = next;
  updateCat();
}

/* 初始化棋盘 */
function init(){
  for(let q=-N;q<=N;q++){
    for(let r=-N;r<=N;r++){
      let s = -q-r;
      if(Math.abs(s) > N) continue;

      let el = document.createElement("div");
      el.className = "hex";

      let k = key(q,r);

      // 🔥 更强对比
      let d = dist({q,r},{q:0,r:0});
      if(d === 0){
        el.classList.add("start"); // 起点
      } else {
        el.classList.add(d % 2 === 0 ? "light" : "dark");
      }

      let p = toPixel(q,r);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;

      el.onclick = () => {
        if(cat.q===q && cat.r===r) return;

        if(obstacles.has(k)){
          obstacles.delete(k);
          el.classList.remove("obstacle");
        } else {
          obstacles.add(k);
          el.classList.add("obstacle");
        }

        moveCat();
      };

      board.appendChild(el);
      cells.set(k, el);
    }
  }

  updateCat();
}

/* 重开 */
function resetGame(){
  obstacles.clear();
  cat = {q:0,r:0};
  statusEl.innerText = "";

  cells.forEach(el => el.classList.remove("obstacle"));
  updateCat();
}

init();