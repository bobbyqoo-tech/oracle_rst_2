import { state } from "./state.js";

const W = state.constants.W;
const H = state.constants.H;
const N = W * H;

const idx = (x,y)=> y*W+x;
const xOf = (i)=> i%W;
const yOf = (i)=> (i/W)|0;
const inBounds = (x,y)=> x>=0&&x<W&&y>=0&&y<H;
const manhattan = (ax,ay,bx,by)=> Math.abs(ax-bx)+Math.abs(ay-by);
const cheb = (ax,ay,bx,by)=> Math.max(Math.abs(ax-bx), Math.abs(ay-by));

function distToBuilding(x,y,b){
  return Math.max(Math.abs(x-b.x), Math.abs(y-b.y));
}
function isAdjacentToBuilding(x,y,b){
  return Math.abs(x-b.x)<=1 && Math.abs(y-b.y)<=1 && !(x===b.x && y===b.y);
}
function distToNearestBuilding(x,y){
  if(!state.buildings || !state.buildings.length) return 9999;
  let best=9999;
  for(const b of state.buildings){
    const d=distToBuilding(x,y,b);
    if(d<best) best=d;
  }
  return best;
}
function buildingAt(x,y){
  if(!state.buildingAt) return null;
  const i=idx(x,y);
  const id=state.buildingAt[i];
  if(id==null || id<0) return null;
  return state.buildings.find(b=>b.id===id) || null;
}

function resizeCanvases(){
  state.canvas.width=W*state.TILEPX; state.canvas.height=H*state.TILEPX;
  state.baseLayer=document.createElement("canvas");
  state.fogLayer=document.createElement("canvas");
  state.baseLayer.width=state.fogLayer.width=state.canvas.width;
  state.baseLayer.height=state.fogLayer.height=state.canvas.height;
  state.baseCtx=state.baseLayer.getContext("2d");
  state.fogCtx=state.fogLayer.getContext("2d");
  state.baseCtx.imageSmoothingEnabled=false;
  state.fogCtx.imageSmoothingEnabled=false;
}
function clearCanvas(c){ c.clearRect(0,0,c.canvas.width,c.canvas.height); }

function drawStorageAndRings(){
  for(const b of state.buildings){
    if(b.type==="town_center") state.baseCtx.fillStyle="rgb(220,200,60)";
    else if(b.type==="lumberyard") state.baseCtx.fillStyle="rgb(120,200,120)";
    else if(b.type==="mining_site") state.baseCtx.fillStyle="rgb(140,120,220)";
    else if(b.type==="granary") state.baseCtx.fillStyle="rgb(220,160,90)";
    else state.baseCtx.fillStyle="rgb(200,200,200)";
    state.baseCtx.fillRect(b.x*state.TILEPX, b.y*state.TILEPX, state.TILEPX, state.TILEPX);
  }

  state.baseCtx.fillStyle="rgba(220,200,60,0.22)";
  for(const ti of state.dropTiles){
    state.baseCtx.fillRect(xOf(ti)*state.TILEPX, yOf(ti)*state.TILEPX, state.TILEPX, state.TILEPX);
  }
  state.baseCtx.fillStyle="rgba(120,190,255,0.10)";
  for(const ti of state.parkTiles){
    state.baseCtx.fillRect(xOf(ti)*state.TILEPX, yOf(ti)*state.TILEPX, state.TILEPX, state.TILEPX);
  }
}
function drawTreeTile(x,y){ state.baseCtx.fillStyle="rgb(0,120,0)"; state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX); }
function drawRockTile(x,y){ state.baseCtx.fillStyle="rgb(90,40,140)"; state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX); }
function drawMeatTile(x,y){ state.baseCtx.fillStyle="rgb(170,90,60)"; state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX); }

function drawBaseAll(){
  clearCanvas(state.baseCtx);
  state.baseCtx.fillStyle="#111";
  state.baseCtx.fillRect(0,0,state.baseLayer.width,state.baseLayer.height);

  state.baseCtx.fillStyle="rgb(70,70,70)";
  for(let i=0;i<N;i++){
    if(state.grid[i]===state.constants.Tile.Block){
      state.baseCtx.fillRect(xOf(i)*state.TILEPX, yOf(i)*state.TILEPX, state.TILEPX, state.TILEPX);
    }
  }
  drawStorageAndRings();
}

function eraseTileToBackground(i){
  const x=xOf(i), y=yOf(i);
  state.baseCtx.fillStyle="#111";
  state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
  if(state.grid[i]===state.constants.Tile.Block){
    state.baseCtx.fillStyle="rgb(70,70,70)";
    state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
  } else if(state.grid[i]===state.constants.Tile.Storage){
    drawStorageAndRings();
  } else {
    const r=distToNearestBuilding(x,y);
    if(r===state.constants.STORAGE_RING_R){
      state.baseCtx.fillStyle="rgba(220,200,60,0.22)";
      state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
    } else if(r===state.constants.PARK_RING_R){
      state.baseCtx.fillStyle="rgba(120,190,255,0.10)";
      state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
    }
  }
}

function drawFogTile(i){
  const x=xOf(i), y=yOf(i);
  if(!state.explored[i]){
    state.fogCtx.fillStyle="rgb(0,0,0)";
    state.fogCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
    return;
  }
  if(!state.visible[i]){
    state.fogCtx.fillStyle="rgba(0,0,0,0.55)";
    state.fogCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
    return;
  }
  state.fogCtx.clearRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
}
function drawFogAll(){ clearCanvas(state.fogCtx); for(let i=0;i<N;i++) drawFogTile(i); }

function buildOffsets(r){
  const out=[];
  for(let dy=-r; dy<=r; dy++){
    for(let dx=-r; dx<=r; dx++){
      if(dx*dx+dy*dy<=r*r) out.push({dx,dy});
    }
  }
  return out;
}
function clearFog(){
  state.explored=new Uint8Array(N);
  state.visible=new Uint8Array(N);
  state.visiblePrev=new Uint8Array(N);
  state.knownTreeIds=[];
  state.knownRockIds=[];
  state.knownMeatIds=[];
}

function discoverResourceAtTile(i){
  const rt=state.resType[i];
  if(rt===state.constants.ResT.Tree){
    const id=state.resIdAt[i];
    if(id>=0) state.knownTreeIds.push(id);
    drawTreeTile(xOf(i), yOf(i));
  } else if(rt===state.constants.ResT.Rock){
    const id=state.resIdAt[i];
    if(id>=0) state.knownRockIds.push(id);
    drawRockTile(xOf(i), yOf(i));
  } else if(rt===state.constants.ResT.Meat){
    const id=state.resIdAt[i];
    if(id>=0) state.knownMeatIds.push(id);
    drawMeatTile(xOf(i), yOf(i));
  }
}

function updateVisibilityAndFogLayers(){
  state.visible.fill(0);
  for(const u of state.units){
    const offsets = (u.role==="scout") ? state.visOffsetsScout : state.visOffsetsWorker;
    const ux=u.x, uy=u.y;
    for(const o of offsets){
      const x=ux+o.dx, y=uy+o.dy;
      if(!inBounds(x,y)) continue;
      state.visible[idx(x,y)]=1;
    }
  }
  const changed=[];
  const newly=[];
  for(let i=0;i<N;i++){
    const v=state.visible[i], pv=state.visiblePrev[i];
    if(v!==pv) changed.push(i);
    if(v===1 && state.explored[i]===0){
      state.explored[i]=1;
      newly.push(i);
    }
  }
  for(const i of changed) state.visiblePrev[i]=state.visible[i];
  for(const i of newly){
    if(state.resType[i]!==state.constants.ResT.None) discoverResourceAtTile(i);
    drawFogTile(i);
  }
  for(const i of changed) drawFogTile(i);
}

function isWalkableTile(i){
  if(state.grid[i]===state.constants.Tile.Block) return false;
  if(state.resType[i]!==state.constants.ResT.None) return false;
  return true;
}
function canMoveDiag(fromI,toI){
  const fx=xOf(fromI), fy=yOf(fromI);
  const tx=xOf(toI), ty=yOf(toI);
  const dx=tx-fx, dy=ty-fy;
  if(Math.abs(dx)===1 && Math.abs(dy)===1){
    const i1=idx(fx+dx, fy);
    const i2=idx(fx, fy+dy);
    if(!isWalkableTile(i1) || !isWalkableTile(i2)) return false;
  }
  return true;
}

function rebuildOccupancy(){
  state.occupied.fill(-1);
  for(const u of state.units) state.occupied[idx(u.x,u.y)]=u.id;
}
function rebuildAnimalOccupancy(){
  state.animalAt.fill(-1);
  for(const a of state.animals){
    if(a.state!=="Dead") state.animalAt[idx(a.x,a.y)]=a.id;
  }
}

function buildRings(){
  state.dropTiles=[]; state.parkTiles=[];
  state.dropOwner = new Int32Array(N); state.dropOwner.fill(-1);
  state.parkOwner = new Int32Array(N); state.parkOwner.fill(-1);
  for(const b of state.buildings){
    b.dropTiles=[]; b.parkTiles=[];
    for(let dy=-state.constants.PARK_RING_R; dy<=state.constants.PARK_RING_R; dy++){
      for(let dx=-state.constants.PARK_RING_R; dx<=state.constants.PARK_RING_R; dx++){
        const x=b.x+dx, y=b.y+dy;
        if(!inBounds(x,y)) continue;
        if(dx===0 && dy===0) continue;

        const r = Math.max(Math.abs(dx), Math.abs(dy));
        const i=idx(x,y);

        if(state.grid[i]===state.constants.Tile.Block) continue;
        if(state.resType[i]!==state.constants.ResT.None) continue;

        if(r===state.constants.STORAGE_RING_R){
          if(state.dropOwner[i]!==-1) continue;
          state.dropTiles.push(i);
          state.dropOwner[i]=b.id;
          b.dropTiles.push(i);
        } else if(r===state.constants.PARK_RING_R){
          if(state.parkOwner[i]!==-1) continue;
          state.parkTiles.push(i);
          state.parkOwner[i]=b.id;
          b.parkTiles.push(i);
        }
      }
    }
  }
}

function reserveTileFromList(unitId, list, reservedBy){
  const u=state.units[unitId];
  let best=-1, bestD=1e9;
  for(const ti of list){
    const r=reservedBy[ti];
    if(r!==-1 && r!==unitId) continue;
    const occ=state.occupied[ti];
    if(occ!==-1 && occ!==unitId) continue;
    if(state.animalAt[ti]!==-1) continue;
    const d=Math.abs(xOf(ti)-u.x)+Math.abs(yOf(ti)-u.y);
    if(d<bestD){ bestD=d; best=ti; }
  }
  if(best!==-1){ reservedBy[best]=unitId; return best; }
  return -1;
}
function releaseReservation(unitId, list, reservedBy){
  for(const ti of list){
    if(reservedBy[ti]===unitId) reservedBy[ti]=-1;
  }
}

function ensureDropReservation(u){
  if(u.dropTileI!=null && state.dropReservedBy[u.dropTileI]===u.id) return u.dropTileI;
  u.dropTileI = reserveTileFromList(u.id, state.dropTiles, state.dropReservedBy);
  return u.dropTileI;
}
function ensureParkReservation(u){
  if(u.parkTileI!=null && state.parkReservedBy[u.parkTileI]===u.id) return u.parkTileI;
  u.parkTileI = reserveTileFromList(u.id, state.parkTiles, state.parkReservedBy);
  return u.parkTileI;
}

function pickFreeTileFromList(u, list){
  let best=-1, bestD=1e9;
  for(const ti of list){
    if(state.occupied[ti]!==-1) continue;
    if(state.animalAt[ti]!==-1) continue;
    if(!isWalkableTile(ti)) continue;
    const d=Math.abs(xOf(ti)-u.x)+Math.abs(yOf(ti)-u.y);
    if(d<bestD){ bestD=d; best=ti; }
  }
  return best;
}

function canPlaceBuilding(x,y){
  if(!inBounds(x,y)) return false;
  const i=idx(x,y);
  if(state.grid[i]===state.constants.Tile.Block) return false;
  if(state.resType[i]!==state.constants.ResT.None) return false;
  if(state.buildingAt && state.buildingAt[i]!==-1) return false;
  if(state.occupied && state.occupied[i]!==-1) return false;
  if(state.animalAt && state.animalAt[i]!==-1) return false;
  return true;
}

function addBuilding(type,x,y){
  if(!state.grid) return { ok:false, reason:"no_world" };
  if(!canPlaceBuilding(x,y)) return { ok:false, reason:"blocked" };
  const id=state.buildings.length;
  const b={id,type,x,y,dropTiles:[],parkTiles:[]};
  state.buildings.push(b);
  if(state.buildingAt) state.buildingAt[idx(x,y)]=id;
  state.grid[idx(x,y)] = state.constants.Tile.Storage;
  buildRings();
  state.dropReservedBy=new Int32Array(N); state.dropReservedBy.fill(-1);
  state.parkReservedBy=new Int32Array(N); state.parkReservedBy.fill(-1);
  drawBaseAll();
  return { ok:true, id };
}

function roleMaxHP(role){
  if(role==="lumber") return state.HP_LUMBER;
  if(role==="miner") return state.HP_MINER;
  if(role==="hunter") return state.HP_HUNTER;
  if(role==="scout") return state.HP_SCOUT;
  return 10;
}
function isWorkerRole(role){ return role==="lumber"||role==="miner"||role==="hunter"; }

function makeUnit(id,role,x,y){
  const maxHP=roleMaxHP(role);
  return {
    id, role, x, y,
    state:"Idle",
    intent:null,
    waitingPath:false,
    path:[],
    target:null,
    carry:0,
    progress:0,
    stuckTicks:0,
    nextScoutThinkTick:0,
    exploreTarget:null,
    dropTileI:null,
    parkTileI:null,
    nextDropRetryTick:0,
    hp:maxHP,
    maxHP,
    atkCD:0,
    flee:false,
    healCD:0,
    resumeTarget:null,
    fleeFromAnimalId:-1,
    lastAttackerAnimalId:-1,
    lastHitTick:-1,
    avoidTarget:null,
    avoidUntilTick:0,
    storageTargetId:-1,
  };
}

function makeAnimal(id,x,y){
  return {
    id,
    x,y,
    homeX:x, homeY:y,
    hp:state.ANIMAL_HP,
    maxHP:state.ANIMAL_HP,
    state:"Wander",
    targetUnitId:-1,
    atkCD:0,
    moveCD:0,
    thinkT:0,
    wanderTX:x, wanderTY:y,
    meatId:-1,
  };
}

function addObstaclePatches(percent){
  const target=Math.floor(N*(percent/100));
  let added=0;
  const rects=Math.max(3, Math.floor(percent/2));
  for(let r=0;r<rects;r++){
    const rw=6+((Math.random()*18)|0);
    const rh=4+((Math.random()*14)|0);
    const x0=((Math.random()*(W-rw))|0);
    const y0=((Math.random()*(H-rh))|0);
    for(let y=y0;y<y0+rh;y++){
      for(let x=x0;x<x0+rw;x++){
        const i=idx(x,y);
        if(state.grid[i]!==state.constants.Tile.Block){ state.grid[i]=state.constants.Tile.Block; added++; }
      }
    }
  }
  let guard=0;
  while(added<target && guard<300000){
    guard++;
    const x=(Math.random()*W)|0, y=(Math.random()*H)|0;
    const i=idx(x,y);
    if(state.grid[i]===state.constants.Tile.Block) continue;
    state.grid[i]=state.constants.Tile.Block; added++;
  }
  return added;
}

function spawnClusteredPoints(count, occupiedSet, avoid){
  const clusters=Math.max(4, Math.floor(Math.sqrt(Math.max(1,count))/1.2));
  const centers=[];
  let tries=0;
  while(centers.length<clusters && tries<200000){
    tries++;
    const x=(Math.random()*W)|0, y=(Math.random()*H)|0;
    const k=`${x},${y}`;
    if(occupiedSet.has(k)) continue;
    const i=idx(x,y);
    if(state.grid[i]===state.constants.Tile.Block) continue;
    if(manhattan(x,y,avoid.x,avoid.y)<avoid.dist) continue;
    centers.push({x,y});
  }
  const used=new Set();
  const pts=[];
  function place(x,y){
    if(!inBounds(x,y)) return false;
    const k=`${x},${y}`;
    if(used.has(k) || occupiedSet.has(k)) return false;
    const i=idx(x,y);
    if(state.grid[i]===state.constants.Tile.Block) return false;
    used.add(k); pts.push({x,y});
    return true;
  }
  let placed=0, guard2=0;
  while(placed<count && guard2<800000){
    guard2++;
    const c=centers[(Math.random()*centers.length)|0];
    const r=(Math.random()<0.75)?6:12;
    const ang=Math.random()*Math.PI*2;
    const rad=Math.abs((Math.random()+Math.random()+Math.random())/3)*r;
    let x=Math.round(c.x+Math.cos(ang)*rad);
    let y=Math.round(c.y+Math.sin(ang)*rad);
    x += ((Math.random()-0.5)*2)|0;
    y += ((Math.random()-0.5)*2)|0;
    if(place(x,y)) placed++;
  }
  let guard3=0;
  while(placed<count && guard3<300000){
    guard3++;
    const x=(Math.random()*W)|0, y=(Math.random()*H)|0;
    if(place(x,y)) placed++;
  }
  return pts;
}

function spawnSeparatedPoints(count, occupiedSet, avoid, minDist){
  const pts=[];
  let guard=0;
  while(pts.length<count && guard<800000){
    guard++;
    const x=(Math.random()*W)|0, y=(Math.random()*H)|0;
    const k=`${x},${y}`;
    if(occupiedSet.has(k)) continue;
    const i=idx(x,y);
    if(state.grid[i]===state.constants.Tile.Block) continue;
    if(manhattan(x,y,avoid.x,avoid.y)<avoid.dist) continue;
    let ok=true;
    for(const p of pts){
      if(cheb(x,y,p.x,p.y)<minDist){ ok=false; break; }
    }
    if(!ok) continue;
    pts.push({x,y});
    occupiedSet.add(k);
  }
  if(pts.length<count){
    const rest=count-pts.length;
    const extra=spawnClusteredPoints(rest, occupiedSet, avoid);
    for(const p of extra) pts.push(p);
  }
  return pts;
}

function generate(params){
  state.TILEPX=params.tilePx;
  state.TICK_HZ=params.tickHz;
  state.STEP_TIME=1/state.TICK_HZ;
  state.ASTAR_BUDGET=params.astarBudget;
  state.SAMPLE_K=params.sampleK;

  state.HP_LUMBER=params.hpLumber;
  state.HP_MINER=params.hpMiner;
  state.HP_HUNTER=params.hpHunter;
  state.HP_SCOUT=params.hpScout;
  state.ANIMAL_HP=params.hpAnimal;
  state.chopRate=state.constants.CHOP_RATE;
  state.mineRate=state.constants.MINE_RATE;
  state.ageIndex=0;
  state.techs.logging=false;
  state.techs.doubleAxe=false;
  state.techs.bowSaw=false;
  state.techs.digging=false;
  state.techs.bronze=false;
  state.techs.casting=false;

  resizeCanvases();

  state.grid=new Uint8Array(N);
  state.occupied=new Int32Array(N); state.occupied.fill(-1);
  state.animalAt=new Int32Array(N); state.animalAt.fill(-1);

  state.resType=new Uint8Array(N);
  state.resIdAt=new Int32Array(N); state.resIdAt.fill(-1);

  state.trees=[]; state.rocks=[]; state.meats=[];
  state.animals=[];
  state.units=[]; state.workers=[]; state.scouts=[];
  state.preferred={type:null,id:null};
  const centerX=(W/2)|0, centerY=(H/2)|0;
  state.storage={x:centerX, y:centerY, wood:0, ore:0, food:0};
  state.buildings=[];
  state.buildingAt=new Int32Array(N); state.buildingAt.fill(-1);
  const town={id:0,type:"town_center",x:centerX,y:centerY,dropTiles:[],parkTiles:[]};
  state.buildings.push(town);
  state.buildingAt[idx(centerX,centerY)] = town.id;

  state.grid[idx(centerX,centerY)] = state.constants.Tile.Storage;

  addObstaclePatches(params.obsPercent);

  for(let y=centerY-4;y<=centerY+4;y++){
    for(let x=centerX-4;x<=centerX+4;x++){
      if(!inBounds(x,y)) continue;
      const i=idx(x,y);
      state.grid[i] = (x===centerX && y===centerY) ? state.constants.Tile.Storage : state.constants.Tile.Empty;
    }
  }

  const occ=new Set([`${centerX},${centerY}`]);
  function spawnRole(n,role){
    let created=0;
    for(let ring=1; created<n && ring<60; ring++){
      for(let dy=-ring; dy<=ring && created<n; dy++){
        for(let dx=-ring; dx<=ring && created<n; dx++){
          if(Math.abs(dx)!==ring && Math.abs(dy)!==ring) continue;
          const x=centerX+dx, y=centerY+dy;
          if(!inBounds(x,y)) continue;
          const i=idx(x,y);
          if(state.grid[i]===state.constants.Tile.Block) continue;
          const k=`${x},${y}`;
          if(occ.has(k)) continue;
          const id=state.units.length;
          const u=makeUnit(id,role,x,y);
          state.units.push(u);
          if(role==="scout") state.scouts.push(u); else state.workers.push(u);
          occ.add(k);
          created++;
        }
      }
    }
    while(created<n){
      const x=centerX+1, y=centerY;
      const id=state.units.length;
      const u=makeUnit(id,role,x,y);
      state.units.push(u);
      if(role==="scout") state.scouts.push(u); else state.workers.push(u);
      created++;
    }
  }

  spawnRole(params.lumberCount,"lumber");
  spawnRole(params.minerCount,"miner");
  spawnRole(params.hunterCount,"hunter");
  spawnRole(params.scoutCount,"scout");

  rebuildOccupancy();

  const treePts=spawnClusteredPoints(params.treeCount, occ, {x:centerX,y:centerY,dist:10});
  state.trees = treePts.map((p,i)=>({id:i,x:p.x,y:p.y,amt:state.constants.TREE_MIN+((Math.random()*(state.constants.TREE_MAX-state.constants.TREE_MIN+1))|0), alive:true}));
  for(const t of state.trees){
    const ti=idx(t.x,t.y);
    state.resType[ti]=state.constants.ResT.Tree; state.resIdAt[ti]=t.id;
    occ.add(`${t.x},${t.y}`);
  }
  const rockPts=spawnClusteredPoints(params.rockCount, occ, {x:centerX,y:centerY,dist:12});
  state.rocks = rockPts.map((p,i)=>({id:i,x:p.x,y:p.y,amt:state.constants.ROCK_MIN+((Math.random()*(state.constants.ROCK_MAX-state.constants.ROCK_MIN+1))|0), alive:true}));
  for(const r of state.rocks){
    const ri=idx(r.x,r.y);
    state.resType[ri]=state.constants.ResT.Rock; state.resIdAt[ri]=r.id;
  }

  const animalPts=spawnSeparatedPoints(params.animalCount, occ, {x:centerX,y:centerY,dist:14}, state.constants.ANIMAL_MIN_DIST);
  state.animals = animalPts.map((p,i)=>makeAnimal(i,p.x,p.y));
  rebuildAnimalOccupancy();

  buildRings();
  state.dropReservedBy=new Int32Array(N); state.dropReservedBy.fill(-1);
  state.parkReservedBy=new Int32Array(N); state.parkReservedBy.fill(-1);

  state.visOffsetsWorker=buildOffsets(params.visionWorker);
  state.visOffsetsScout=buildOffsets(params.visionScout);
  clearFog();

  drawBaseAll();
  state.visiblePrev.fill(0);
  updateVisibilityAndFogLayers();
  drawFogAll();
  updateVisibilityAndFogLayers();

  state.pathQueue=[];
  state.tickCount=0;
  state.simState="READY";
}

export {
  idx, xOf, yOf, inBounds, manhattan, cheb,
  distToBuilding, isAdjacentToBuilding, distToNearestBuilding, buildingAt,
  resizeCanvases, clearCanvas, drawStorageAndRings, drawTreeTile, drawRockTile, drawMeatTile,
  drawBaseAll, eraseTileToBackground, drawFogTile, drawFogAll,
  buildOffsets, clearFog, discoverResourceAtTile, updateVisibilityAndFogLayers,
  isWalkableTile, canMoveDiag,
  rebuildOccupancy, rebuildAnimalOccupancy,
  buildRings, reserveTileFromList, releaseReservation, ensureDropReservation, ensureParkReservation, pickFreeTileFromList,
  canPlaceBuilding, addBuilding,
  roleMaxHP, isWorkerRole, makeUnit, makeAnimal,
  addObstaclePatches, spawnClusteredPoints, spawnSeparatedPoints,
  generate,
};

