
import { state } from "./state.js";
import {
  idx, xOf, yOf, inBounds, manhattan, cheb,
  distToBuilding, isAdjacentToBuilding, distToNearestBuilding,
  drawFogTile, drawFogAll, drawBaseAll, eraseTileToBackground, drawMeatTile, buildRings,
  redrawDiscoveredResources, updateVisibilityAndFogLayers,
  isWalkableTile, canMoveDiag,
  rebuildOccupancy,
  reserveTileFromList, releaseReservation, ensureDropReservation, ensureParkReservation, pickFreeTileFromList,
  isWorkerRole, roleMaxHP,
} from "./world.js";
import { requestPath, processPathQueue } from "./pathfinding.js";

function nowStr(){ const t=new Date(); return `[${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}:${String(t.getSeconds()).padStart(2,"0")}]`; }
function log(msg){ state.dom.logEl.textContent = `${nowStr()} ${msg}\n` + state.dom.logEl.textContent; }

function roleAbbr(role){
  if(role==="lumber") return "L";
  if(role==="miner") return "M";
  if(role==="hunter") return "H";
  if(role==="scout") return "S";
  if(role==="builder") return "B";
  return "U";
}
function hpBar(hp,max, w=12){
  if(max<=0) return "".padEnd(w,"░");
  const f=Math.max(0, Math.min(w, Math.round(w*hp/max)));
  return "█".repeat(f) + "░".repeat(w-f);
}
function padL(s,w){ s=String(s); return (s.length>=w)?s:(" ".repeat(w-s.length)+s); }

function countAlive(list){ let c=0; for(const r of list) if(r.alive) c++; return c; }
function countAnimalsAlive(){ let c=0; for(const a of state.animals) if(a.state!=="Dead") c++; return c; }
function getTownCenter(){
  for(const b of state.buildings) if(b.type==="town_center") return b;
  return state.buildings[0] || null;
}
function getCandidateBuildingsForRole(role){
  const out=[];
  if(role==="lumber"){
    for(const b of state.buildings) if(b.type==="lumberyard" && b.built) out.push(b);
  } else if(role==="miner"){
    for(const b of state.buildings) if(b.type==="mining_site" && b.built) out.push(b);
  } else if(role==="hunter"){
    for(const b of state.buildings) if(b.type==="granary" && b.built) out.push(b);
  }
  const town=getTownCenter();
  if(town && !out.includes(town)) out.push(town);
  return out;
}
function pickNearestBuilding(u, list){
  if(!list.length) return null;
  let best=list[0], bestD=1e9;
  for(const b of list){
    const d=distToBuilding(u.x,u.y,b);
    if(d<bestD){ bestD=d; best=b; }
  }
  return best;
}
function getTransplantationBuildings(){
  const out=[];
  for(const b of state.buildings){
    if(b.type==="transplantation" && b.built) out.push(b);
  }
  return out;
}
function roleLabel(role){
  if(role==="lumber") return "伐木工";
  if(role==="miner") return "採礦工";
  if(role==="hunter") return "獵人";
  if(role==="builder") return "建築工";
  if(role==="scout") return "斥侯";
  return role;
}
function removeFromArray(arr, item){
  const i=arr.indexOf(item);
  if(i>=0) arr.splice(i,1);
}
function applyReclass(u){
  const toRole=u.reclassToRole;
  if(!toRole) return false;
  const fromRole=u.role;
  if(fromRole===toRole){
    u.reclassToRole=null;
    u.reclassFromRole=null;
    u.reclassBuildingId=-1;
    u.reclassStarted=false;
    return false;
  }

  if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
  if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }

  const wasScout = fromRole==="scout";
  const toScout = toRole==="scout";
  if(wasScout && !toScout){
    removeFromArray(state.scouts, u);
    if(!state.workers.includes(u)) state.workers.push(u);
  } else if(!wasScout && toScout){
    removeFromArray(state.workers, u);
    if(!state.scouts.includes(u)) state.scouts.push(u);
  }

  u.role=toRole;
  u.maxHP=roleMaxHP(toRole);
  u.hp=Math.min(u.hp, u.maxHP);
  u.carry=0;
  u.target=null;
  u.intent=null;
  u.path=[];
  u.progress=0;
  u.waitingPath=false;
  u.state="Idle";
  u.storageTargetId=-1;
  u.reclassToRole=null;
  u.reclassFromRole=null;
  u.reclassBuildingId=-1;
  u.reclassStarted=false;
  u.resumeTarget=null;
  u.avoidTarget=null;
  u.avoidUntilTick=0;
  log(`轉職完成：${u.id} ${roleLabel(fromRole)} -> ${roleLabel(toRole)}`);
  return true;
}
function requestMoveToTransplantation(u){
  const guilds=getTransplantationBuildings();
  const b=pickNearestBuilding(u, guilds);
  if(!b) return false;
  u.reclassBuildingId=b.id;
  if(isAdjacentToBuilding(u.x,u.y,b)){
    u.state="ReclassWork";
    u.progress=0;
    u.reclassStarted=true;
    return true;
  }
  let stand=-1, bestD=1e9;
  for(let dy=-1; dy<=1; dy++){
    for(let dx=-1; dx<=1; dx++){
      if(dx===0 && dy===0) continue;
      const nx=b.x+dx, ny=b.y+dy;
      if(!inBounds(nx,ny)) continue;
      const ni=idx(nx,ny);
      if(!isWalkableTile(ni)) continue;
      if(state.animalAt[ni]!==-1) continue;
      const d=Math.abs(nx-u.x)+Math.abs(ny-u.y);
      if(d<bestD){ bestD=d; stand=ni; }
    }
  }
  if(stand===-1) return false;
  u.intent="ToTransplantation";
  requestPath(u.id, stand);
  u.state="ToTransplantation";
  return true;
}
function tickReclass(u){
  if(!u.reclassToRole || u.dead || u.flee) return false;
  if(u.nextReclassRetryTick!=null && state.tickCount<u.nextReclassRetryTick) return true;

  if(u.state==="ToTransplantation"){
    const moved=tryStepFromPath(u);
    if(!moved){
      if(u.stuckTicks>state.constants.PUSH_STUCK_TICKS && u.path && u.path.length && tryYieldOrPush(u, u.path[0])) return true;
      if(u.stuckTicks>16){
        u.stuckTicks=0;
        if(u.path && u.path.length) requestPath(u.id, u.path[u.path.length-1]);
        else u.state="Idle";
      }
      return true;
    }
    if(!u.path.length){
      u.state="ReclassWork";
      u.progress=0;
      u.reclassStarted=true;
    }
    return true;
  }

  if(u.state==="ReclassWork"){
    const b=state.buildings.find(bb=>bb.id===u.reclassBuildingId && bb.built) || pickNearestBuilding(u, getTransplantationBuildings());
    if(!b){ u.state="Idle"; return true; }
    u.reclassBuildingId=b.id;
    if(cheb(u.x,u.y,b.x,b.y)>1){
      requestMoveToTransplantation(u);
      return true;
    }
    u.progress += state.STEP_TIME;
    if(u.progress>=1.0){
      applyReclass(u);
    }
    return true;
  }

  u.target=null;
  u.intent=null;
  u.path=[];
  u.progress=0;
  u.state="Idle";
  if(!requestMoveToTransplantation(u)){
    u.nextReclassRetryTick = state.tickCount + Math.max(10, (state.TICK_HZ/2)|0);
    u.state="Idle";
  }
  return true;
}

function updateInfo(){
  const aliveTrees=countAlive(state.trees||[]);
  const aliveRocks=countAlive(state.rocks||[]);
  const aliveMeats=countAlive(state.meats||[]);
  const aliveAnimals=countAnimalsAlive();
  const exploredCnt = state.explored ? state.explored.reduce((a,v)=>a+v,0) : 0;
  const exploredPct = Math.round(100*exploredCnt/(state.constants.W*state.constants.H));

  let qDrop=0, qPark=0, fleeing=0, deadUnits=0;
  for(const w of state.workers){
    if(w.dead) deadUnits++;
    if(w.flee && !w.dead) fleeing++;
    if(w.state==="QueueStorage") qDrop++;
    if(w.state==="Parked" || w.state==="ToPark") qPark++;
  }

  state.dom.infoEl.innerHTML = `
    <div class="kv">
      <div class="pill">狀態 <b>${state.simState}</b></div>
      <div class="pill">探索度 <b>${exploredPct}%</b></div>
      <div class="pill">PathQueue <b>${state.pathQueue.length}</b> / budget ${state.ASTAR_BUDGET}</div>
      <div class="pill">Park/Queue <b>${qPark}</b> / <b>${qDrop}</b></div>
      <div class="pill">逃跑中 <b>${fleeing}</b></div>
      <div class="pill">已陣亡 <b>${deadUnits}</b></div>
      <div class="pill">Tick <b>${state.tickCount}</b></div>
      <div style="margin-top:8px;"><b>倉庫</b>：木=<b>${state.storage.wood}</b>　礦=<b>${state.storage.ore}</b>　食物=<b>${state.storage.food}</b></div>
      <div><b>資源</b>：樹<b>${aliveTrees}</b> / ${state.trees?state.trees.length:0}　礦<b>${aliveRocks}</b> / ${state.rocks?state.rocks.length:0}　肉<b>${aliveMeats}</b></div>
      <div><b>動物</b>：存活<b>${aliveAnimals}</b> / ${state.animals?state.animals.length:0}</div>
      <div><b>單位</b>：總數 ${state.units?state.units.length:0}　工人/獵人/建築工 ${state.workers?state.workers.length:0}　斥侯 ${state.scouts?state.scouts.length:0}</div>
      <div><b>參數</b>：tick ${state.TICK_HZ}Hz　抽樣K=${state.SAMPLE_K}　格像素=${state.TILEPX}px　逃跑<20%</div>
      <div><b>時代</b>：${state.constants.AGES[state.ageIndex]}　<b>伐木效率</b> x${state.chopRate.toFixed(2)}　<b>採礦效率</b> x${state.mineRate.toFixed(2)}</div>
    </div>
  `;

  if(state.dom.hpAllEl){
    const rows=[];
    for(const u of state.units){
      if(u.dead) continue;
      const ab=roleAbbr(u.role);
      const idStr=padL(u.id,3);
      const hpStr=padL(u.hp,3)+"/"+padL(u.maxHP,3);
      rows.push(`${ab}#${idStr}  ${hpStr}  ${hpBar(u.hp,u.maxHP)}`);
    }
    state.dom.hpAllEl.textContent = rows.length ? rows.join("\n") : "(無單位)";
  }

  if(state.dom.statsEl){
    const workerMove = state.TICK_HZ;
    const scoutMove = state.TICK_HZ;
    const hunterMove = state.TICK_HZ;
    const animalMove = (1 / state.constants.ANIMAL_MOVE_INTERVAL).toFixed(2);
    const hx=(state.hoverX==null || state.hoverY==null) ? "--" : `${state.hoverX},${state.hoverY}`;
    const lines=[
      `游標座標: (${hx})`,
      `伐木效率: x${state.chopRate.toFixed(2)}`,
      `採礦效率: x${state.mineRate.toFixed(2)}`,
      `伐木工移速: ${workerMove.toFixed(1)} 格/秒`,
      `採礦工移速: ${workerMove.toFixed(1)} 格/秒`,
      `獵人移速: ${hunterMove.toFixed(1)} 格/秒`,
      `斥侯移速: ${scoutMove.toFixed(1)} 格/秒`,
      `野生動物移速: ${animalMove} 格/秒`,
    ];
    state.dom.statsEl.textContent = lines.join("\n");
  }

  if(state.refreshTechUI) state.refreshTechUI();
}
function requestMoveToResource(u,target){
  if(target.type==="tree"){
    const res=state.trees[target.id]; if(!res||!res.alive) return false;
    const stand=chooseBestStandTile(u, idx(res.x,res.y)); if(stand===-1) return false;
    u.target=target; u.intent=null; requestPath(u.id, stand); return true;
  }
  if(target.type==="rock"){
    const res=state.rocks[target.id]; if(!res||!res.alive) return false;
    const stand=chooseBestStandTile(u, idx(res.x,res.y)); if(stand===-1) return false;
    u.target=target; u.intent=null; requestPath(u.id, stand); return true;
  }
  if(target.type==="meat"){
    const res=state.meats[target.id]; if(!res||!res.alive) return false;
    const stand=chooseBestStandTile(u, idx(res.x,res.y)); if(stand===-1) return false;
    u.target=target; u.intent=null; requestPath(u.id, stand); return true;
  }
  if(target.type==="animal"){
    const a=state.animals[target.id]; if(!a||a.state==="Dead") return false;
    const ai=idx(a.x,a.y);
    const opts=adjacentStandTilesForRes(ai);
    if(!opts.length) return false;
    let best=opts[0], bestD=1e9;
    for(const i of opts){
      const d=Math.abs(xOf(i)-u.x)+Math.abs(yOf(i)-u.y);
      if(d<bestD){ bestD=d; best=i; }
    }
    u.target=target; u.intent=null; requestPath(u.id, best); return true;
  }
  return false;
}

function requestMoveToStorageLogic(u){
  const candidates=getCandidateBuildingsForRole(u.role);
  const b=pickNearestBuilding(u, candidates);
  if(!b) return;
  u.storageTargetId=b.id;
  if(isAdjacentToBuilding(u.x,u.y,b)){ u.state="Dropoff"; return; }

  const dropI=reserveTileFromList(u.id, b.dropTiles, state.dropReservedBy);
  if(dropI!==-1){
    u.dropTileI=dropI;
    if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
    u.intent="ToStorage";
    requestPath(u.id, dropI);
    u.state="ToStorage";
    return;
  }

  const parkI=reserveTileFromList(u.id, b.parkTiles, state.parkReservedBy);
  if(parkI!==-1){
    u.parkTileI=parkI;
    u.intent="ToPark";
    requestPath(u.id, parkI);
    u.state="ToPark";
    u.nextDropRetryTick = state.tickCount + Math.max(6, (state.TICK_HZ/2)|0);
    return;
  }

  u.state="QueueStorage";
  u.intent="ToStorage";
  u.nextDropRetryTick = state.tickCount + Math.max(6, (state.TICK_HZ/2)|0);
}

function doDropoff(u){
  const b=state.buildings.find(bb=>bb.id===u.storageTargetId) || getTownCenter();
  if(!b || !isAdjacentToBuilding(u.x,u.y,b)){ requestMoveToStorageLogic(u); return; }
  if(u.carry>0){
    if(u.role==="lumber") state.storage.wood += u.carry;
    else if(u.role==="miner") state.storage.ore += u.carry;
    else if(u.role==="hunter") state.storage.food += u.carry;
    u.carry=0;
  }
  if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
  if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
  u.state="Idle";
  u.target=null;
  u.intent=null;
}

function requestFlee(u){
  const all=state.buildings || [];
  const b=pickNearestBuilding(u, all);
  if(!b) return;
  u.storageTargetId=b.id;
  const parkI=reserveTileFromList(u.id, b.parkTiles, state.parkReservedBy);
  if(parkI!==-1){ u.parkTileI=parkI; u.intent="ToPark"; requestPath(u.id, parkI); u.state="ToPark"; return; }
  const dropI=reserveTileFromList(u.id, b.dropTiles, state.dropReservedBy);
  if(dropI!==-1){ u.dropTileI=dropI; u.intent="ToStorage"; requestPath(u.id, dropI); u.state="ToStorage"; return; }
  u.state="QueueStorage";
  u.nextDropRetryTick=state.tickCount + Math.max(6,(state.TICK_HZ/2)|0);
}

function tickWorkerFleeRecovery(u){
  if(!u.flee || !isWorkerRole(u.role)) return false;

  u.healCD = Math.max(0, u.healCD-state.STEP_TIME);
  let parkB=null;
  if(u.parkTileI!=null && state.parkOwner){ 
    const bid=state.parkOwner[u.parkTileI];
    if(bid!=null && bid>=0) parkB=state.buildings.find(bb=>bb.id===bid);
  }
  const inParkRing = parkB ? (distToBuilding(u.x,u.y,parkB)===state.constants.PARK_RING_R) : (distToNearestBuilding(u.x,u.y)===state.constants.PARK_RING_R);
  if(inParkRing && u.healCD<=0){
    if(u.hp < u.maxHP && state.storage.food>0){
      u.hp = Math.min(u.maxHP, u.hp+1);
      state.storage.food -= 1;
    }
    u.healCD = state.constants.HUNTER_HEAL_INTERVAL;
  }

  if((u.hp/u.maxHP) >= state.constants.HUNTER_RESUME_HP_FRAC){
    u.flee=false;
    u.state="Idle";
    u.intent=null;
    u.path=[];
    if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
    if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
    if(u.resumeTarget){ u.target=u.resumeTarget; u.resumeTarget=null; }
    return true;
  }
  return false;
}

function adjacentStandTilesForRes(resI){
  const x=xOf(resI), y=yOf(resI);
  const out=[];
  for(let dy=-1; dy<=1; dy++){
    for(let dx=-1; dx<=1; dx++){
      if(dx===0 && dy===0) continue;
      const nx=x+dx, ny=y+dy;
      if(!inBounds(nx,ny)) continue;
      const ni=idx(nx,ny);
      if(!isWalkableTile(ni)) continue;
      if(state.occupied[ni]!==-1) continue;
      if(state.animalAt[ni]!==-1) continue;
      out.push(ni);
    }
  }
  return out;
}

function chooseBestStandTile(u,resI){
  const opts=adjacentStandTilesForRes(resI);
  if(!opts.length) return -1;
  let best=opts[0], bestD=1e9;
  for(const i of opts){
    const d=Math.abs(xOf(i)-u.x)+Math.abs(yOf(i)-u.y);
    if(d<bestD){ bestD=d; best=i; }
  }
  return best;
}
function pickFromKnown(u, type, knownIds, arr, preferredId){
  if(!knownIds.length) return null;
  const K=Math.min(state.SAMPLE_K, knownIds.length);
  let bestId=null, bestScore=Infinity;

  function consider(id){
    if(u.avoidTarget && u.avoidTarget.type===type && u.avoidTarget.id===id && state.tickCount < u.avoidUntilTick) return;
    const res=arr[id];
    if(!res || !res.alive) return;
    const ri=idx(res.x,res.y);
    const stand=chooseBestStandTile(u,ri);
    if(stand===-1) return;
    const d=manhattan(u.x,u.y,res.x,res.y);

    let load=0;
    for(const w of state.workers){
      if(w.target && w.target.type===type && w.target.id===id) load++;
    }
    let score=d + 3.2*load;
    if(preferredId!==null && id===preferredId) score*=0.25;
    if(score<bestScore){ bestScore=score; bestId=id; }
  }

  if(preferredId!==null) consider(preferredId);
  for(let s=0;s<K;s++){
    const id=knownIds[(Math.random()*knownIds.length)|0];
    consider(id);
  }
  if(bestId===null) return null;
  return {type, id: bestId};
}

function pickAnimalTarget(u, preferredId){
  if(!state.animals || !state.animals.length) return null;

  const engaged=new Set();
  let hunterCount=0;
  for(const w of state.workers){
    if(w.role!=="hunter" || w.dead) continue;
    hunterCount++;
    if(w.target && w.target.type==="animal") engaged.add(w.target.id);
  }
  if(engaged.size===0 && hunterCount<2 && preferredId==null) return null;
  const maxEngage=Math.max(1, Math.floor(hunterCount/2));

  const K=Math.min(80, state.animals.length);
  let bestId=null, bestScore=Infinity;

  function consider(a){
    if(!a || a.state==="Dead") return;
    if(engaged.size>=maxEngage && !engaged.has(a.id) && preferredId==null) return;
    const ai=idx(a.x,a.y);
    if(!state.explored[ai]) return;
    const d=manhattan(u.x,u.y,a.x,a.y);
    let load=0;
    for(const w of state.workers){
      if(w.role==="hunter" && w.target && w.target.type==="animal" && w.target.id===a.id) load++;
    }
    let score = d + (load>0 ? -4.0*load : 6.0);
    if(preferredId!=null && a.id===preferredId) score*=0.25;
    if(score<bestScore){ bestScore=score; bestId=a.id; }
  }

  if(preferredId!=null){
    const a=state.animals[preferredId];
    if(a) consider(a);
  }
  for(let s=0;s<K;s++){
    const a=state.animals[(Math.random()*state.animals.length)|0];
    consider(a);
  }
  if(bestId==null) return null;
  return {type:"animal", id: bestId};
}

function pickTargetForWorker(u){
  let type=null;
  if(u.role==="lumber") type="tree";
  else if(u.role==="miner") type="rock";
  else if(u.role==="hunter"){
    if(state.knownMeatIds.length) type="meat";
    else type="animal";
  }

  let preferredId=null;
  if(state.preferred.type===type && state.preferred.id!=null) preferredId=state.preferred.id;

  if(type==="tree") return pickFromKnown(u, type, state.knownTreeIds, state.trees, preferredId);
  if(type==="rock") return pickFromKnown(u, type, state.knownRockIds, state.rocks, preferredId);
  if(type==="meat") return pickFromKnown(u, type, state.knownMeatIds, state.meats, preferredId);
  if(type==="animal") return pickAnimalTarget(u, preferredId);
  return null;
}

function pickBuildTarget(u){
  let best=null, bestD=1e9;
  for(const b of state.buildings){
    if(b.built) continue;
    const d=manhattan(u.x,u.y,b.x,b.y);
    if(d<bestD){ bestD=d; best=b; }
  }
  if(!best) return null;
  return {type:"build", id:best.id};
}

function requestMoveToBuilding(u, b){
  const stand=chooseBestStandTile(u, idx(b.x,b.y));
  if(stand===-1) return false;
  u.target={type:"build", id:b.id};
  u.intent=null;
  requestPath(u.id, stand);
  return true;
}

function tryStepFromPath(u){
  if(!u.path || !u.path.length){ u.state="Idle"; return false; }
  const nextI=u.path[0];
  if(state.occupied[nextI]!==-1){
    if(state.constants.PUSH_STUCK_TICKS>0) u.stuckTicks++;
    return false;
  }
  if(state.animalAt[nextI]!==-1){ u.stuckTicks++; return false; }

  state.occupied[idx(u.x,u.y)]=-1;
  u.x=xOf(nextI); u.y=yOf(nextI);
  u.path.shift();
  state.occupied[nextI]=u.id;
  u.stuckTicks=0;
  return true;
}

function isPushableUnit(v){
  return (v.state==="Idle" || v.state==="QueueStorage" || v.state==="Dropoff" || v.state==="Parked");
}
function findFreeNeighborForUnit(v, avoidI){
  let best=-1, bestScore=1e9;
  for(const d of state.constants.DIRS8){
    const nx=v.x+d.dx, ny=v.y+d.dy;
    if(!inBounds(nx,ny)) continue;
    const ni=idx(nx,ny);
    if(ni===avoidI) continue;
    if(!isWalkableTile(ni)) continue;
    if(state.dropReservedBy[ni]!==-1 && state.dropReservedBy[ni]!==v.id) continue;
    if(state.parkReservedBy[ni]!==-1 && state.parkReservedBy[ni]!==v.id) continue;
    if(state.occupied[ni]!==-1) continue;
    const score = distToNearestBuilding(nx,ny) + Math.abs(nx-v.x)+Math.abs(ny-v.y)*0.2;
    if(score<bestScore){ bestScore=score; best=ni; }
  }
  return best;
}
function tryYieldOrPush(u, nextI){
  const vId = state.occupied[nextI];
  if(vId===-1) return false;
  const v = state.units[vId];
  if(!v) return false;
  if(distToNearestBuilding(u.x,u.y) > state.constants.PUSH_NEAR_STORAGE_R) return false;

  if(v.path && v.path.length && v.path[0]===idx(u.x,u.y)){
    state.occupied[idx(u.x,u.y)] = v.id;
    state.occupied[nextI] = u.id;
    const ux=u.x, uy=u.y;
    u.x=xOf(nextI); u.y=yOf(nextI);
    v.x=ux; v.y=uy;
    u.path.shift();
    v.path.shift();
    u.stuckTicks=0; v.stuckTicks=0;
    return true;
  }

  if(isPushableUnit(v)){
    const free = findFreeNeighborForUnit(v, nextI);
    if(free!==-1){
      state.occupied[idx(v.x,v.y)] = -1;
      v.x=xOf(free); v.y=yOf(free);
      state.occupied[free]=v.id;
      v.stuckTicks=0;
      return true;
    }
  }
  return false;
}

function tickBuilder(u){
  if(u.dead) return;
  if(u.waitingPath) return;

  if(u.flee){
    if(u.state==="Fight"){ u.state="Idle"; u.target=null; }
    if(u.state==="Idle" || u.state==="Work" || u.state==="Flee"){ requestFlee(u); }
  }
  if(u.flee) tickWorkerFleeRecovery(u);
  if(tickReclass(u)) return;

  if(u.state==="Move" || u.state==="ToStorage" || u.state==="ToPark" || u.state==="ToTransplantation"){
    const moved=tryStepFromPath(u);
    if(!moved){
      if(u.stuckTicks>state.constants.PUSH_STUCK_TICKS && tryYieldOrPush(u, u.path[0])) return;
      if(u.stuckTicks>16){
        u.stuckTicks=0;
        if(u.path && u.path.length){
          requestPath(u.id, u.path[u.path.length-1]);
        } else {
          u.state="Idle"; u.target=null; u.intent=null;
        }
      }
      if(u.flee && u.stuckTicks>8){ requestFlee(u); }
      return;
    }
    if(!u.path.length){
      u.state="Work";
      u.progress=0;
    }
    return;
  }

  if(u.state==="Work"){
    if(!u.target || u.target.type!=="build"){ u.state="Idle"; return; }
    const b=state.buildings.find(bb=>bb.id===u.target.id);
    if(!b || b.built){ u.state="Idle"; u.target=null; return; }
    if(cheb(u.x,u.y,b.x,b.y)>1){ requestMoveToBuilding(u, b); return; }
    b.progress += state.constants.BUILD_RATE * state.STEP_TIME;
    if(b.progress>=1){
      b.built=true;
      b.progress=1;
      if(typeof buildRings==="function") buildRings();
      else log("建造完成但 buildRings 未載入");
      state.dropReservedBy=new Int32Array(state.constants.W*state.constants.H); state.dropReservedBy.fill(-1);
      state.parkReservedBy=new Int32Array(state.constants.W*state.constants.H); state.parkReservedBy.fill(-1);
      drawBaseAll();
      redrawDiscoveredResources();
      log(`建造完成：${b.type} @(${b.x},${b.y})`);
      u.state="Idle";
      u.target=null;
    }
    return;
  }

  if(u.state==="Idle"){
    if(u.flee){ requestFlee(u); return; }
    const t=pickBuildTarget(u);
    if(!t) return;
    const b=state.buildings.find(bb=>bb.id===t.id);
    if(!b) return;
    requestMoveToBuilding(u, b);
    u.state="Move";
  }
}

function tickWorker(u){
  if(u.dead) return;
  if(u.waitingPath) return;

  if(u.flee){
    if(u.state==="Fight"){ u.state="Idle"; u.target=null; }
    if(u.state==="Idle" || u.state==="Work" || u.state==="Flee"){ requestFlee(u); }
  }
  if(u.flee) tickWorkerFleeRecovery(u);
  if(tickReclass(u)) return;

  if(u.state==="Move" || u.state==="ToStorage" || u.state==="ToPark" || u.state==="ToTransplantation"){
    const moved=tryStepFromPath(u);
    if(u.role==="hunter" && u.target && u.target.type==="animal"){
      const a=state.animals[u.target.id];
      if(a && a.state!=="Dead" && cheb(u.x,u.y,a.x,a.y)<=2){
        u.state="Fight";
        u.path=[];
        u.stuckTicks=0;
        a.targetUnitId=u.id;
        a.state="Chase";
        return;
      }
    }
    if(!moved){
      if(u.stuckTicks>state.constants.PUSH_STUCK_TICKS && tryYieldOrPush(u, u.path[0])) return;
      if(u.stuckTicks>state.constants.RES_STUCK_TICKS && u.target && (u.target.type==="tree" || u.target.type==="rock") && u.carry===0){
        u.avoidTarget = {type:u.target.type, id:u.target.id};
        u.avoidUntilTick = state.tickCount + state.constants.RES_AVOID_TICKS;
        u.stuckTicks=0;
        u.path=[];
        u.intent=null;
        u.state="Idle";
        u.target=null;
        return;
      }
      if(u.stuckTicks>16){
        u.stuckTicks=0;
        if(u.path && u.path.length){
          requestPath(u.id, u.path[u.path.length-1]);
        } else {
          u.state="Idle"; u.target=null; u.intent=null;
        }
      }
      if(u.flee && u.stuckTicks>8){ requestFlee(u); }
      return;
    }
    if(!u.path.length){
      if(u.state==="ToPark") u.state="Parked";
      else if(u.state==="ToStorage") u.state="Dropoff";
      else u.state="Work";
      u.progress=0;
    }
    return;
  }

  if(u.state==="Parked" || u.state==="QueueStorage"){
    if(!u.flee && u.carry===0){
      if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
      if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
      u.state="Idle";
      return;
    }
    if(u.flee){
      const b=state.buildings.find(bb=>bb.id===u.storageTargetId) || pickNearestBuilding(u, state.buildings||[]);
      if(b){
        if(distToBuilding(u.x,u.y,b)!==state.constants.PARK_RING_R){
          const parkI=reserveTileFromList(u.id, b.parkTiles, state.parkReservedBy);
          if(parkI!==-1){ u.intent="ToPark"; requestPath(u.id, parkI); u.state="ToPark"; return; }
          const freeI=pickFreeTileFromList(u, b.parkTiles);
          if(freeI!==-1){ u.intent="ToPark"; requestPath(u.id, freeI); u.state="ToPark"; return; }
        }
      }
      return;
    }
    if(state.tickCount >= u.nextDropRetryTick){
      u.nextDropRetryTick = state.tickCount + Math.max(6, (state.TICK_HZ/2)|0);
      const b=state.buildings.find(bb=>bb.id===u.storageTargetId) || pickNearestBuilding(u, getCandidateBuildingsForRole(u.role));
      const dropI=b ? reserveTileFromList(u.id, b.dropTiles, state.dropReservedBy) : -1;
      if(dropI!==-1){
        u.dropTileI=dropI;
        if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
        u.intent="ToStorage"; requestPath(u.id, dropI); u.state="ToStorage";
      } else if(u.state==="QueueStorage"){
        const parkI=b ? reserveTileFromList(u.id, b.parkTiles, state.parkReservedBy) : -1;
        if(parkI!==-1){ u.parkTileI=parkI; u.intent="ToPark"; requestPath(u.id, parkI); u.state="ToPark"; }
        else {
          const freeI=b ? pickFreeTileFromList(u, b.parkTiles) : -1;
          if(freeI!==-1){ u.intent="ToPark"; requestPath(u.id, freeI); u.state="ToPark"; }
        }
      }
    }
    return;
  }

  if(u.state==="Dropoff"){ doDropoff(u); return; }

  if(u.role==="hunter" && u.target && u.target.type==="animal"){
    const a=state.animals[u.target.id];
    if(!a || a.state==="Dead"){ u.target=null; u.state="Idle"; }
    else {
      if(cheb(u.x,u.y,a.x,a.y)<=2 && !(u.x===a.x && u.y===a.y)){
        u.state="Fight";
        a.targetUnitId=u.id;
        a.state="Chase";
      }
    }
  }

  if(u.state==="Fight"){
    const a= u.target ? state.animals[u.target.id] : null;
    if(!a || a.state==="Dead"){ u.state="Idle"; u.target=null; return; }
    if(cheb(u.x,u.y,a.x,a.y)>2){ requestMoveToResource(u, u.target); return; }
    u.atkCD = Math.max(0, u.atkCD-state.STEP_TIME);
    if(u.atkCD<=0){ u.atkCD = state.constants.ATK_INTERVAL; dealDamageAnimal(a, state.constants.ATK_DAMAGE); }
    if(a.state==="Dead" && a.meatId>=0){ u.target=null; u.state="Idle"; }
    return;
  }

  if(u.state==="Work"){
    if(!u.target){ u.state="Idle"; return; }
    if(u.flee){ requestFlee(u); return; }
    if(u.role!=="hunter" && u.lastHitTick>=0 && (state.tickCount - u.lastHitTick) <= (state.TICK_HZ*2|0)){
      if((u.hp/u.maxHP) <= state.constants.FLEE_HIT_FRAC){
        u.flee=true; u.target=null; u.path=[]; u.intent=null; u.state="Flee"; requestFlee(u); return;
      }
    }

    if(u.target.type==="tree"){
      const res=state.trees[u.target.id];
      if(!res||!res.alive){ if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;} return; }
      if(Math.abs(u.x-res.x)>1 || Math.abs(u.y-res.y)>1 || (u.x===res.x && u.y===res.y)){
        requestMoveToResource(u, u.target); return;
      }
      u.progress += state.STEP_TIME;
      while(u.progress>=1.0 && u.carry<state.constants.WORKER_CARRY_CAP && res.amt>0){
        u.progress -= 1.0;
        const take=Math.min(state.chopRate, res.amt, state.constants.WORKER_CARRY_CAP-u.carry);
        res.amt-=take; u.carry+=take;
      }
      if(res.amt<=0){
        res.alive=false;
        const ri=idx(res.x,res.y);
        state.resType[ri]=state.constants.ResT.None; state.resIdAt[ri]=-1;
        eraseTileToBackground(ri);
        if(state.preferred.type==="tree" && state.preferred.id===res.id) state.preferred={type:null,id:null};
        if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;}
        return;
      }
      if(u.carry>=state.constants.WORKER_CARRY_CAP){ requestMoveToStorageLogic(u); return; }
      return;
    }

    if(u.target.type==="rock"){
      const res=state.rocks[u.target.id];
      if(!res||!res.alive){ if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;} return; }
      if(Math.abs(u.x-res.x)>1 || Math.abs(u.y-res.y)>1 || (u.x===res.x && u.y===res.y)){
        requestMoveToResource(u, u.target); return;
      }
      u.progress += state.STEP_TIME;
      while(u.progress>=1.0 && u.carry<state.constants.WORKER_CARRY_CAP && res.amt>0){
        u.progress -= 1.0;
        const take=Math.min(state.mineRate, res.amt, state.constants.WORKER_CARRY_CAP-u.carry);
        res.amt-=take; u.carry+=take;
      }
      if(res.amt<=0){
        res.alive=false;
        const ri=idx(res.x,res.y);
        state.resType[ri]=state.constants.ResT.None; state.resIdAt[ri]=-1;
        eraseTileToBackground(ri);
        if(state.preferred.type==="rock" && state.preferred.id===res.id) state.preferred={type:null,id:null};
        if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;}
        return;
      }
      if(u.carry>=state.constants.WORKER_CARRY_CAP){ requestMoveToStorageLogic(u); return; }
      return;
    }

    if(u.target.type==="meat"){
      const res=state.meats[u.target.id];
      if(!res||!res.alive){ if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;} return; }
      if(Math.abs(u.x-res.x)>1 || Math.abs(u.y-res.y)>1 || (u.x===res.x && u.y===res.y)){
        requestMoveToResource(u, u.target); return;
      }
      u.progress += state.STEP_TIME;
      while(u.progress>=1.0 && u.carry<state.constants.WORKER_CARRY_CAP && res.amt>0){
        u.progress -= 1.0;
        const take=Math.min(state.constants.MEAT_RATE, res.amt, state.constants.WORKER_CARRY_CAP-u.carry);
        res.amt-=take; u.carry+=take;
      }
      if(res.amt<=0){
        res.alive=false;
        const ri=idx(res.x,res.y);
        state.resType[ri]=state.constants.ResT.None; state.resIdAt[ri]=-1;
        eraseTileToBackground(ri);
        if(state.preferred.type==="meat" && state.preferred.id===res.id) state.preferred={type:null,id:null};
        if(u.carry>0) requestMoveToStorageLogic(u); else {u.state="Idle";u.target=null;}
        return;
      }
      if(u.carry>=state.constants.WORKER_CARRY_CAP){ requestMoveToStorageLogic(u); return; }
      return;
    }

    if(u.target.type==="animal"){ u.state="Idle"; return; }
  }

  if(u.state==="Idle"){
    if(u.dropTileI!=null && state.dropReservedBy[u.dropTileI]!==u.id) u.dropTileI=null;
    if(u.parkTileI!=null && state.parkReservedBy[u.parkTileI]!==u.id) u.parkTileI=null;

    if(u.flee){ requestFlee(u); return; }

    if(u.carry>0){ requestMoveToStorageLogic(u); return; }

    if(u.resumeTarget){
      const t=u.resumeTarget; u.resumeTarget=null;
      const ok=requestMoveToResource(u, t); if(ok) return;
    }

    const target=pickTargetForWorker(u);
    if(!target) return;
    const ok=requestMoveToResource(u,target);
    if(ok) return;
    u.target=null;
  }
}

function pickFrontierForScout(u){
  let best=-1, bestD=1e9;
  for(let s=0;s<120;s++){
    const x=(Math.random()*state.constants.W)|0, y=(Math.random()*state.constants.H)|0;
    const i=idx(x,y);
    if(!state.explored[i]) continue;
    let hasUn=false;
    for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
        if(dx===0&&dy===0) continue;
        const nx=x+dx, ny=y+dy;
        if(!inBounds(nx,ny)) continue;
        if(!state.explored[idx(nx,ny)]) { hasUn=true; break; }
      }
      if(hasUn) break;
    }
    if(!hasUn) continue;
    if(state.grid[i]===state.constants.Tile.Block) continue;
    if(!isWalkableTile(i) && state.grid[i]!==state.constants.Tile.Storage) continue;

    const d=Math.abs(x-u.x)+Math.abs(y-u.y);
    if(d<bestD){ bestD=d; best=i; }
  }
  return best;
}

function tickScout(u){
  if(u.dead) return;
  if(u.waitingPath) return;
  if(tickReclass(u)) return;

  if(u.state==="Move" || u.state==="Explore" || u.state==="ToTransplantation"){
    const moved=tryStepFromPath(u);
    if(!moved){
      if(u.stuckTicks>16){
        u.stuckTicks=0;
        if(u.path && u.path.length){
          requestPath(u.id, u.path[u.path.length-1]);
        } else u.state="Idle";
      }
      return;
    }
    if(!u.path.length){
      u.state="Idle";
      u.exploreTarget=null;
    }
    return;
  }

  if(state.tickCount>=u.nextScoutThinkTick){
    u.nextScoutThinkTick = state.tickCount + Math.max(10, (state.TICK_HZ|0));
    const fi=pickFrontierForScout(u);
    if(fi!==-1){
      u.exploreTarget=fi;
      u.intent=null;
      requestPath(u.id, fi);
      u.state="Explore";
    }
  }
}

function animalStepGreedy(a, tx, ty){
  const curI=idx(a.x,a.y);
  let bestI=-1, bestD=1e9;
  const start=((Math.random()*8)|0);
  for(let k=0;k<8;k++){
    const d=state.constants.DIRS8[(start+k)&7];
    const nx=a.x+d.dx, ny=a.y+d.dy;
    if(!inBounds(nx,ny)) continue;
    const ni=idx(nx,ny);
    if(!isWalkableTile(ni)) continue;
    if(!canMoveDiag(curI,ni)) continue;
    if(state.occupied[ni]!==-1) continue;
    if(state.animalAt[ni]!==-1) continue;
    const dist=cheb(nx,ny,tx,ty);
    if(dist<bestD){ bestD=dist; bestI=ni; }
  }
  if(bestI===-1) return false;
  state.animalAt[curI]=-1;
  a.x=xOf(bestI); a.y=yOf(bestI);
  state.animalAt[bestI]=a.id;
  return true;
}

function animalPickWanderTarget(a){
  for(let tries=0; tries<10; tries++){
    const dx=((Math.random()* (state.constants.ANIMAL_WANDER_R*2+1))|0)-state.constants.ANIMAL_WANDER_R;
    const dy=((Math.random()* (state.constants.ANIMAL_WANDER_R*2+1))|0)-state.constants.ANIMAL_WANDER_R;
    const tx=a.homeX+dx, ty=a.homeY+dy;
    if(!inBounds(tx,ty)) continue;
    if(cheb(tx,ty,a.homeX,a.homeY)>state.constants.ANIMAL_WANDER_R) continue;
    const ti=idx(tx,ty);
    if(!isWalkableTile(ti)) continue;
    a.wanderTX=tx; a.wanderTY=ty;
    return;
  }
  a.wanderTX=a.homeX; a.wanderTY=a.homeY;
}

function animalAcquireTarget(a){
  if(a.targetUnitId>=0){
    const u=state.units[a.targetUnitId];
    if(!u || u.dead){ a.targetUnitId=-1; return; }
    if(cheb(u.x,u.y,a.homeX,a.homeY) > state.constants.ANIMAL_LEASH_R){ a.targetUnitId=-1; return; }
    return;
  }
  const r=2;
  for(let dy=-r; dy<=r; dy++){
    for(let dx=-r; dx<=r; dx++){
      const x=a.x+dx, y=a.y+dy;
      if(!inBounds(x,y)) continue;
      const i=idx(x,y);
      const uid=state.occupied[i];
      if(uid===-1) continue;
      const u=state.units[uid];
      if(!u || u.dead) continue;
      if(u.role==="scout") continue;
      if(cheb(u.x,u.y,a.homeX,a.homeY) > state.constants.ANIMAL_LEASH_R) continue;
      a.targetUnitId=u.id;
      return;
    }
  }
}

function tickAnimal(a){
  if(a.state==="Dead") return;

  a.atkCD=Math.max(0, a.atkCD-state.STEP_TIME);
  a.thinkT=Math.max(0, a.thinkT-state.STEP_TIME);
  a.moveCD=Math.max(0, a.moveCD-state.STEP_TIME);

  if(a.targetUnitId>=0){
    const u=state.units[a.targetUnitId];
    if(!u || u.dead || cheb(u.x,u.y,a.homeX,a.homeY)>state.constants.ANIMAL_LEASH_R){
      a.targetUnitId=-1;
    }
  }

  if(a.targetUnitId>=0) a.state="Chase";
  else {
    if(cheb(a.x,a.y,a.homeX,a.homeY)>state.constants.ANIMAL_WANDER_R) a.state="Return";
    else a.state="Wander";
  }

  animalAcquireTarget(a);

  if(a.state==="Chase" && a.targetUnitId>=0){
    const u=state.units[a.targetUnitId];
    if(!u || u.dead){ a.targetUnitId=-1; return; }
    if(cheb(a.x,a.y,u.x,u.y)<=1 && !(a.x===u.x && a.y===u.y)){
      if(a.atkCD<=0){ a.atkCD=state.constants.ATK_INTERVAL; dealDamageUnit(u, state.constants.ATK_DAMAGE, a.id); }
    } else {
      if(a.moveCD<=0){ animalStepGreedy(a, u.x, u.y); a.moveCD=state.constants.ANIMAL_MOVE_INTERVAL; }
    }
    return;
  }

  if(a.state==="Return"){
    if(cheb(a.x,a.y,a.homeX,a.homeY)>0){
      if(a.moveCD<=0){ animalStepGreedy(a, a.homeX, a.homeY); a.moveCD=state.constants.ANIMAL_MOVE_INTERVAL; }
    }
    return;
  }

  if(a.thinkT<=0){
    a.thinkT = state.constants.ANIMAL_THINK_MIN + Math.random()*(state.constants.ANIMAL_THINK_MAX-state.constants.ANIMAL_THINK_MIN);
    animalPickWanderTarget(a);
  }
  if(cheb(a.x,a.y,a.wanderTX,a.wanderTY)>0){
    if(a.moveCD<=0){ animalStepGreedy(a, a.wanderTX, a.wanderTY); a.moveCD=state.constants.ANIMAL_MOVE_INTERVAL; }
  }
}

function spawnMeatAt(x,y){
  const i=idx(x,y);
  if(state.resType[i]!==state.constants.ResT.None) return -1;
  const id=state.meats.length;
  state.meats.push({id,x,y,amt:state.constants.MEAT_MIN+((Math.random()*(state.constants.MEAT_MAX-state.constants.MEAT_MIN+1))|0), alive:true});
  state.resType[i]=state.constants.ResT.Meat;
  state.resIdAt[i]=id;
  if(state.explored[i]){
    drawMeatTile(x,y);
    state.knownMeatIds.push(id);
  }
  return id;
}

function dealDamageUnit(u, dmg, attackerAnimalId){
  u.hp = Math.max(0, u.hp-dmg);
  if(attackerAnimalId!=null) u.lastAttackerAnimalId = attackerAnimalId;
  u.lastHitTick = state.tickCount;
  if(u.hp<=0){
    state.occupied[idx(u.x,u.y)] = -1;
    u.dead=true;
    u.state="Dead";
    if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
    if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
    log(`陣亡：${u.role}#${u.id}`);
  } else {
    if(isWorkerRole(u.role) && !u.flee && (u.hp/u.maxHP)<=state.constants.FLEE_HP_FRAC){
      u.resumeTarget = u.target ? {type:u.target.type, id:u.target.id} : null;
      u.fleeFromAnimalId = u.lastAttackerAnimalId ?? -1;
      u.flee=true;
      u.target=null;
      u.path=[];
      u.intent=null;
      u.state="Flee";
      log(`逃跑：${u.role}#${u.id} (${u.hp}/${u.maxHP})`);
    }
  }
}

function dealDamageAnimal(a, dmg){
  a.hp = Math.max(0, a.hp-dmg);
  if(a.hp<=0 && a.state!=="Dead"){
    a.state="Dead";
    state.animalAt[idx(a.x,a.y)] = -1;
    a.targetUnitId=-1;
    a.meatId = spawnMeatAt(a.x,a.y);
    log(`動物擊殺：#${a.id} 掉落肉${a.meatId>=0?("#"+a.meatId):"(失敗)"}`);
  }
}

function anyAlive(list){ for(const r of list) if(r.alive) return true; return false; }
function anyAnimalAlive(){ for(const a of state.animals) if(a.state!=="Dead") return true; return false; }
function allDone(){
  if(anyAlive(state.trees) || anyAlive(state.rocks) || anyAlive(state.meats) || anyAnimalAlive()) return false;
  for(const u of state.workers){
    if(u.dead) continue;
    if(u.carry>0) return false;
    if(u.state!=="Idle" && u.state!=="Parked" && u.state!=="QueueStorage") return false;
  }
  return true;
}

function tick(){
  state.tickCount++;

  processPathQueue();

  for(const a of state.animals) tickAnimal(a);
  for(const s of state.scouts) tickScout(s);
  for(const w of state.workers){
    if(w.role==="builder") tickBuilder(w);
    else tickWorker(w);
  }

  updateVisibilityAndFogLayers();

  if((state.tickCount % (state.TICK_HZ*3|0))===0){
    state.knownTreeIds = state.knownTreeIds.filter(id => state.trees[id] && state.trees[id].alive);
    state.knownRockIds = state.knownRockIds.filter(id => state.rocks[id] && state.rocks[id].alive);
    state.knownMeatIds = state.knownMeatIds.filter(id => state.meats[id] && state.meats[id].alive);
  }

  if(state.simState==="RUN" && allDone()){
    state.simState="DONE"; setStatus("DONE");
    log(`完成：木=${state.storage.wood}、礦=${state.storage.ore}、食物=${state.storage.food}`);
  }

  updateInfo();
}

function render(){
  if(!state.grid){
    state.ctx.fillStyle="#111"; state.ctx.fillRect(0,0,state.canvas.width,state.canvas.height);
    return;
  }
  state.ctx.clearRect(0,0,state.canvas.width,state.canvas.height);
  state.ctx.drawImage(state.baseLayer,0,0);

  for(const id of state.knownTreeIds){
    const t=state.trees[id];
    if(!t || !t.alive) continue;
    const i=idx(t.x,t.y);
    if(!state.visible[i]) continue;
    state.ctx.fillStyle="rgb(0,190,0)";
    state.ctx.fillRect(t.x*state.TILEPX,t.y*state.TILEPX,state.TILEPX,state.TILEPX);
  }
  for(const id of state.knownRockIds){
    const r=state.rocks[id];
    if(!r || !r.alive) continue;
    const i=idx(r.x,r.y);
    if(!state.visible[i]) continue;
    state.ctx.fillStyle="rgb(160,80,255)";
    state.ctx.fillRect(r.x*state.TILEPX,r.y*state.TILEPX,state.TILEPX,state.TILEPX);
  }
  for(const id of state.knownMeatIds){
    const m=state.meats[id];
    if(!m || !m.alive) continue;
    const i=idx(m.x,m.y);
    if(!state.visible[i]) continue;
    state.ctx.fillStyle="rgb(210,120,80)";
    state.ctx.fillRect(m.x*state.TILEPX,m.y*state.TILEPX,state.TILEPX,state.TILEPX);
  }

  for(const a of state.animals){
    if(a.state==="Dead") continue;
    const i=idx(a.x,a.y);
    if(!state.visible[i]) continue;
    if(a.state==="Chase") state.ctx.fillStyle="rgb(220,90,90)";
    else if(a.state==="Return") state.ctx.fillStyle="rgb(160,160,160)";
    else state.ctx.fillStyle="rgb(200,170,110)";
    state.ctx.fillRect(a.x*state.TILEPX,a.y*state.TILEPX,state.TILEPX,state.TILEPX);
  }

  for(const u of state.units){
    if(u.dead) continue;
    const i=idx(u.x,u.y);
    if(!state.visible[i]) continue;
    if(u.role==="lumber") state.ctx.fillStyle="rgb(80,160,255)";
    else if(u.role==="miner") state.ctx.fillStyle="rgb(200,120,255)";
    else if(u.role==="hunter") state.ctx.fillStyle="rgb(100,220,160)";
    else if(u.role==="builder") state.ctx.fillStyle="rgb(200,200,90)";
    else state.ctx.fillStyle="rgb(255,170,70)";
    state.ctx.fillRect(u.x*state.TILEPX,u.y*state.TILEPX,state.TILEPX,state.TILEPX);

    const frac=u.hp/u.maxHP;
    if(frac<0.45){
      state.ctx.fillStyle= frac<0.2 ? "rgb(255,80,80)" : "rgb(255,210,80)";
      state.ctx.fillRect(u.x*state.TILEPX, u.y*state.TILEPX, Math.max(1,(state.TILEPX/3)|0), Math.max(1,(state.TILEPX/3)|0));
    }
  }

  for(const ti of state.dropTiles){
    const r=state.dropReservedBy[ti];
    if(r!==-1 && state.visible[ti]){
      state.ctx.fillStyle="rgba(255,255,255,0.10)";
      state.ctx.fillRect(xOf(ti)*state.TILEPX, yOf(ti)*state.TILEPX, state.TILEPX, state.TILEPX);
    }
  }
  for(const ti of state.parkTiles){
    const r=state.parkReservedBy[ti];
    if(r!==-1 && state.visible[ti]){
      state.ctx.fillStyle="rgba(120,190,255,0.12)";
      state.ctx.fillRect(xOf(ti)*state.TILEPX, yOf(ti)*state.TILEPX, state.TILEPX, state.TILEPX);
    }
  }

  if(state.preferred.type && state.preferred.id!=null){
    let rx=-1, ry=-1;
    if(state.preferred.type==="tree"){ const t=state.trees[state.preferred.id]; if(t&&t.alive){rx=t.x;ry=t.y;} }
    else if(state.preferred.type==="rock"){ const r=state.rocks[state.preferred.id]; if(r&&r.alive){rx=r.x;ry=r.y;} }
    else if(state.preferred.type==="meat"){ const m=state.meats[state.preferred.id]; if(m&&m.alive){rx=m.x;ry=m.y;} }
    if(rx!==-1){
      const i=idx(rx,ry);
      if(state.explored[i]){
        state.ctx.strokeStyle="rgba(255,255,255,0.9)";
        state.ctx.lineWidth=1;
        state.ctx.strokeRect(rx*state.TILEPX+0.5, ry*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
      }
    }
  }

  state.ctx.drawImage(state.fogLayer,0,0);
}

function setStatus(s){ state.dom.statusTag.textContent=s; }

export { log, updateInfo, tick, render, setStatus };
