const N = 20;
const board = document.getElementById("board");
const statusEl = document.getElementById("status");

let obstacles = new Set();

// 猫位置
let cat = { q: 0, r: 0 };

// 存 hex DOM
let cells = new Map();

// 猫 DOM（关键：只创建一次）
const catEl = document.createElement("div");
catEl.id = "cat";
board.appendChild(catEl);

// 六方向
const dirs = [
  [1,0], [1,-1], [0,-1],
  [-1,0], [-1,1], [0,1]
];

function key(q, r) {
  return `${q},${r}`;
}

// hex 距离
function dist(a, b) {
  return (Math.abs(a.q - b.q)
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2;
}

function inBoard(q, r) {
  return dist({q,r},{q:0,r:0}) <= N;
}

function isEdge(q,r){
  return dist({q,r},{q:0,r:0}) === N;
}

// BFS 最短路
function bfs(start) {
  let q = [start];
  let prev = new Map();
  prev.set(key(start.q,start.r), null);

  while(q.length){
    let cur = q.shift();

    if(isEdge(cur.q,cur.r)){
      let path = [];
      let k = key(cur.q,cur.r);

      while(k){
        let [a,b] = k.split(",").map(Number);
        path.push({q:a,r:b});
        k = prev.get(k);
      }
      return path.reverse();
    }

    for(let [dq,dr] of dirs){
      let nq = cur.q + dq;
      let nr = cur.r + dr;
      let k = key(nq,nr);

      if(!inBoard(nq,nr)) continue;
      if(obstacles.has(k)) continue;
      if(prev.has(k)) continue;

      prev.set(k, key(cur.q,cur.r));
      q.push({q:nq,r:nr});
    }
  }

  return null;
}

// 位置转像素
const spacing = 24;

function toPixel(q,r){
  return {
    x: (q + r/2) * spacing,
    y: r * spacing * 0.9
  };
}

// 更新猫动画位置
function updateCat(){
  const p = toPixel(cat.q, cat.r);
  catEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

// 猫移动
function moveCat(){
  let path = bfs(cat);

  if(!path){
    statusEl.innerText = "猫被困住了！你赢了 🎉";
    return;
  }

  if(path.length > 1){
    cat = path[1];
    updateCat();
  }
}

// 创建棋盘（只做一次）
function initBoard(){
  let size = 14;

  for(let q=-N;q<=N;q++){
    for(let r=-N;r<=N;r++){
      let s = -q-r;
      if(Math.abs(s) > N) continue;

      let el = document.createElement("div");
      el.className = "hex";

      let k = key(q,r);

      // 颜色交错
      el.classList.add((dist({q,r},{q:0,r:0}) % 2 === 0) ? "light" : "dark");

      let p = toPixel(q,r);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;

      el.onclick = () => {
        if(cat.q===q && cat.r===r) return;

        if(obstacles.has(k)) {
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

// 重开
function resetGame(){
  obstacles.clear();
  cat = {q:0,r:0};
  statusEl.innerText = "";

  cells.forEach(el => el.classList.remove("obstacle"));
  updateCat();
}

// init
initBoard();