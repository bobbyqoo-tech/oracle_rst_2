import {
  configureRenderAssets,
  preloadRenderAssets,
  drawCachedSprite,
} from "./assets.js";

const SPRITE_MANIFEST = {
  "terrain.ground": "assets/sprites/terrain/ground.svg",
  "terrain.block": "assets/sprites/terrain/block.svg",
  "resource.tree": "assets/sprites/resources/tree.svg",
  "resource.rock": "assets/sprites/resources/ore.svg",
  "resource.meat": "assets/sprites/resources/meat.svg",
  "building.site": "assets/sprites/buildings/building_site.svg",
  "building.town_center": "assets/sprites/buildings/town_center.svg",
  "building.lumberyard": "assets/sprites/buildings/lumberyard.svg",
  "building.mining_site": "assets/sprites/buildings/mining_site.svg",
  "building.granary": "assets/sprites/buildings/granary.svg",
  "building.transplantation": "assets/sprites/buildings/transplantation.svg",
  "unit.lumber.n": "assets/sprites/units/lumber_n.svg",
  "unit.lumber.e": "assets/sprites/units/lumber_e.svg",
  "unit.lumber.s": "assets/sprites/units/lumber_s.svg",
  "unit.lumber.w": "assets/sprites/units/lumber_w.svg",
  "unit.miner.n": "assets/sprites/units/miner_n.svg",
  "unit.miner.e": "assets/sprites/units/miner_e.svg",
  "unit.miner.s": "assets/sprites/units/miner_s.svg",
  "unit.miner.w": "assets/sprites/units/miner_w.svg",
  "unit.hunter.n": "assets/sprites/units/hunter_n.svg",
  "unit.hunter.e": "assets/sprites/units/hunter_e.svg",
  "unit.hunter.s": "assets/sprites/units/hunter_s.svg",
  "unit.hunter.w": "assets/sprites/units/hunter_w.svg",
  "unit.scout.n": "assets/sprites/units/scout_n.svg",
  "unit.scout.e": "assets/sprites/units/scout_e.svg",
  "unit.scout.s": "assets/sprites/units/scout_s.svg",
  "unit.scout.w": "assets/sprites/units/scout_w.svg",
  "unit.builder.n": "assets/sprites/units/builder_n.svg",
  "unit.builder.e": "assets/sprites/units/builder_e.svg",
  "unit.builder.s": "assets/sprites/units/builder_s.svg",
  "unit.builder.w": "assets/sprites/units/builder_w.svg",
  "animal.wander.n": "assets/sprites/animals/wander_n.svg",
  "animal.wander.e": "assets/sprites/animals/wander_e.svg",
  "animal.wander.s": "assets/sprites/animals/wander_s.svg",
  "animal.wander.w": "assets/sprites/animals/wander_w.svg",
  "animal.chase.n": "assets/sprites/animals/chase_n.svg",
  "animal.chase.e": "assets/sprites/animals/chase_e.svg",
  "animal.chase.s": "assets/sprites/animals/chase_s.svg",
  "animal.chase.w": "assets/sprites/animals/chase_w.svg",
  "animal.return.n": "assets/sprites/animals/return_n.svg",
  "animal.return.e": "assets/sprites/animals/return_e.svg",
  "animal.return.s": "assets/sprites/animals/return_s.svg",
  "animal.return.w": "assets/sprites/animals/return_w.svg",
};

let spriteAssetsInit = false;
let spriteAssetsReady = false;
let spriteAssetsPromise = null;

function idxOf(state, x, y){ return y*state.constants.W + x; }
function xOf(state, i){ return i % state.constants.W; }
function yOf(state, i){ return (i / state.constants.W) | 0; }

function roleColor(role){
  if(role==="lumber") return "rgb(70,170,255)";
  if(role==="miner") return "rgb(190,130,255)";
  if(role==="hunter") return "rgb(90,230,170)";
  if(role==="builder") return "rgb(230,210,90)";
  return "rgb(255,170,70)";
}

function drawDisc(ctx, cx, cy, r, fill, stroke=null){
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle=fill;
  ctx.fill();
  if(stroke){
    ctx.strokeStyle=stroke;
    ctx.lineWidth=1;
    ctx.stroke();
  }
}

function tileBox(state, x, y){
  const px = x*state.TILEPX;
  const py = y*state.TILEPX;
  return { px, py, cx:px + state.TILEPX/2, cy:py + state.TILEPX/2 };
}

function drawAnchoredSprite(ctx, state, key, x, y, w=24, h=24){
  const p = tileBox(state, x, y);
  return drawCachedSprite(ctx, key, Math.round(p.cx - w/2), Math.round(p.cy - h), w, h);
}

function fallbackTerrainTile(state, x, y){
  state.baseCtx.fillStyle="#111";
  state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
}

function fallbackBlockTile(state, x, y){
  state.baseCtx.fillStyle="rgb(70,70,70)";
  state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
}

function fallbackResourceBaseTile(state, kind, x, y){
  if(kind==="tree") state.baseCtx.fillStyle="rgb(0,120,0)";
  else if(kind==="rock") state.baseCtx.fillStyle="rgb(90,40,140)";
  else if(kind==="meat") state.baseCtx.fillStyle="rgb(170,90,60)";
  else return;
  state.baseCtx.fillRect(x*state.TILEPX,y*state.TILEPX,state.TILEPX,state.TILEPX);
}

function fallbackBuildingBaseTile(state, b){
  if(!b.built){
    state.baseCtx.fillStyle="rgb(90,90,90)";
    state.baseCtx.fillRect(b.x*state.TILEPX, b.y*state.TILEPX, state.TILEPX, state.TILEPX);
    state.baseCtx.strokeStyle="rgba(255,255,255,0.25)";
    state.baseCtx.strokeRect(b.x*state.TILEPX+0.5, b.y*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
    return;
  }
  if(b.type==="town_center") state.baseCtx.fillStyle="rgb(220,200,60)";
  else if(b.type==="lumberyard") state.baseCtx.fillStyle="rgb(120,200,120)";
  else if(b.type==="mining_site") state.baseCtx.fillStyle="rgb(140,120,220)";
  else if(b.type==="granary") state.baseCtx.fillStyle="rgb(220,160,90)";
  else if(b.type==="transplantation") state.baseCtx.fillStyle="rgb(80,180,210)";
  else state.baseCtx.fillStyle="rgb(200,200,200)";
  state.baseCtx.fillRect(b.x*state.TILEPX, b.y*state.TILEPX, state.TILEPX, state.TILEPX);
}

function resourceKey(kind){
  if(kind==="tree") return "resource.tree";
  if(kind==="rock") return "resource.rock";
  if(kind==="meat") return "resource.meat";
  return null;
}

function buildingKey(type){
  if(type==="town_center") return "building.town_center";
  if(type==="lumberyard") return "building.lumberyard";
  if(type==="mining_site") return "building.mining_site";
  if(type==="granary") return "building.granary";
  if(type==="transplantation") return "building.transplantation";
  return null;
}

function drawResourceSpriteWithFallback(ctx, state, kind, x, y){
  const key = resourceKey(kind);
  if(key && drawAnchoredSprite(ctx, state, key, x, y, 24, 24)) return true;
  return false;
}

function drawBuildingSpriteWithFallback(state, b){
  const ctx = state.baseCtx;
  const key = b.built ? buildingKey(b.type) : "building.site";
  if(key && drawAnchoredSprite(ctx, state, key, b.x, b.y, 24, 24)) return true;
  return false;
}
function drawBuildingSpriteInFrame(ctx, state, b){
  const key = b.built ? buildingKey(b.type) : "building.site";
  if(key && drawAnchoredSprite(ctx, state, key, b.x, b.y, 24, 24)) return true;
  return false;
}

function getUnitTargetPos(state, u){
  if(u.path && u.path.length){
    const ni = u.path[0];
    return { x:xOf(state, ni), y:yOf(state, ni) };
  }
  if(u.target){
    if((u.target.type==="tree" || u.target.type==="rock" || u.target.type==="meat") && u.target.id!=null){
      const table = u.target.type==="tree" ? state.trees : (u.target.type==="rock" ? state.rocks : state.meats);
      const r = table && table[u.target.id];
      if(r && r.alive) return { x:r.x, y:r.y };
    }
    if(u.target.type==="animal" && u.target.id!=null){
      const a = state.animals && state.animals[u.target.id];
      if(a && a.state!=="Dead") return { x:a.x, y:a.y };
    }
    if(u.target.type==="build" && u.target.id!=null){
      const b = state.buildings && state.buildings.find((bb)=>bb.id===u.target.id);
      if(b) return { x:b.x, y:b.y };
    }
  }
  return null;
}

function facing4FromVector(dx, dy){
  if(dx===0 && dy===0) return "s";
  if(Math.abs(dx) >= Math.abs(dy)) return dx>=0 ? "e" : "w";
  return dy>=0 ? "s" : "n";
}

function inferFacing4(state, x, y, target){
  if(!target) return "s";
  return facing4FromVector(target.x-x, target.y-y);
}

function unitSpriteKey(state, u){
  if(u.role!=="lumber" && u.role!=="miner" && u.role!=="hunter" && u.role!=="scout" && u.role!=="builder") return null;
  const t = getUnitTargetPos(state, u);
  const dir = inferFacing4(state, u.x, u.y, t);
  return `unit.${u.role}.${dir}`;
}

function drawUnitSprite(ctx, state, u){
  const key = unitSpriteKey(state, u);
  if(!key) return false;
  return drawAnchoredSprite(ctx, state, key, u.x, u.y, 24, 32);
}

function drawUnitPlaceholder(ctx, state, u){
  const p=tileBox(state, u.x, u.y);
  ctx.fillStyle="rgba(0,0,0,0.20)";
  ctx.fillRect(p.px+1, p.py+state.TILEPX-2, Math.max(2,state.TILEPX-2), 1);
  drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.30), roleColor(u.role), "rgba(15,15,15,0.85)");
  ctx.fillStyle="rgba(255,255,255,0.30)";
  ctx.fillRect(p.px+2, p.py+2, Math.max(1,(state.TILEPX/4)|0), 1);
}
function drawUnitHpBar(ctx, state, u){
  if(u.hp>=u.maxHP || u.maxHP<=0) return;
  const p=tileBox(state, u.x, u.y);
  const w=Math.max(10, (state.TILEPX*0.72)|0);
  const h=3;
  const x=Math.round(p.cx - w/2);
  const y=Math.round(p.cy - 32 - 4);
  const frac=Math.max(0, Math.min(1, u.hp/u.maxHP));
  let fill="rgb(70,220,110)";
  if(frac<0.5) fill="rgb(255,210,80)";
  if(frac<0.25) fill="rgb(255,90,90)";
  ctx.fillStyle="rgba(0,0,0,0.55)";
  ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle="rgba(160,28,28,0.95)";
  ctx.fillRect(x,y,w,h);
  ctx.fillStyle=fill;
  ctx.fillRect(x,y,Math.max(1,Math.round(w*frac)),h);
}

function animalTargetPos(state, a){
  if(a.targetUnitId!=null && a.targetUnitId>=0){
    const u = state.units && state.units[a.targetUnitId];
    if(u && !u.dead) return { x:u.x, y:u.y };
  }
  if(a.state==="Return"){
    return { x:a.homeX, y:a.homeY };
  }
  if(a.wanderTX!=null && a.wanderTY!=null){
    return { x:a.wanderTX, y:a.wanderTY };
  }
  return { x:a.homeX, y:a.homeY };
}

function animalSpriteStateKey(a){
  if(a.state==="Chase") return "chase";
  if(a.state==="Return") return "return";
  return "wander";
}

function animalSpriteKey(state, a){
  const t = animalTargetPos(state, a);
  const dir = inferFacing4(state, a.x, a.y, t);
  return `animal.${animalSpriteStateKey(a)}.${dir}`;
}

function drawAnimalSprite(ctx, state, a){
  const key = animalSpriteKey(state, a);
  return drawAnchoredSprite(ctx, state, key, a.x, a.y, 24, 28);
}

function drawAnimalPlaceholder(ctx, state, a){
  const p=tileBox(state, a.x, a.y);
  const fill = a.state==="Chase" ? "rgb(220,90,90)" : (a.state==="Return" ? "rgb(160,160,160)" : "rgb(200,170,110)");
  ctx.fillStyle="rgba(0,0,0,0.22)";
  ctx.fillRect(p.px+1, p.py+state.TILEPX-3, Math.max(2,state.TILEPX-2), 2);
  drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), fill, "rgba(20,20,20,0.8)");
  ctx.fillStyle="rgba(255,255,255,0.35)";
  ctx.fillRect(p.px+2, p.py+2, Math.max(1,(state.TILEPX/4)|0), 1);
}

function pushDrawable(list, footY, footX, layer, draw){
  list.push({ footY, footX, layer, draw });
}
function sortDrawables(list){
  list.sort((a,b)=>{
    if(a.footY!==b.footY) return a.footY-b.footY;
    if(a.layer!==b.layer) return a.layer-b.layer;
    return a.footX-b.footX;
  });
}

function drawGroundTileSprite(state, x, y){
  if(drawCachedSprite(state.baseCtx, "terrain.ground", x*state.TILEPX, y*state.TILEPX, state.TILEPX, state.TILEPX)) return;
  fallbackTerrainTile(state, x, y);
}

function drawBlockTileSprite(state, x, y){
  if(drawCachedSprite(state.baseCtx, "terrain.block", x*state.TILEPX, y*state.TILEPX, state.TILEPX, state.TILEPX)) return;
  fallbackBlockTile(state, x, y);
}

function renderSpriteStorageAndRings(state){
  state.baseCtx.fillStyle="rgba(220,200,60,0.22)";
  for(const ti of state.dropTiles){
    state.baseCtx.fillRect(xOf(state, ti)*state.TILEPX, yOf(state, ti)*state.TILEPX, state.TILEPX, state.TILEPX);
  }
  state.baseCtx.fillStyle="rgba(120,190,255,0.10)";
  for(const ti of state.parkTiles){
    state.baseCtx.fillRect(xOf(state, ti)*state.TILEPX, yOf(state, ti)*state.TILEPX, state.TILEPX, state.TILEPX);
  }
}

function renderSpriteBaseAll(state){
  state.baseCtx.clearRect(0,0,state.baseLayer.width,state.baseLayer.height);
  for(let y=0; y<state.constants.H; y++){
    for(let x=0; x<state.constants.W; x++){
      drawGroundTileSprite(state, x, y);
    }
  }
  for(let i=0;i<state.constants.W*state.constants.H;i++){
    if(state.grid[i]!==state.constants.Tile.Block) continue;
    drawBlockTileSprite(state, xOf(state, i), yOf(state, i));
  }
  renderSpriteStorageAndRings(state);
}

function renderSpriteResourceBaseTile(state, kind, x, y){
  // Sprite mode draws resources in frame-time for depth sorting.
  return;
}

function renderSpriteEraseBaseTile(state, i, helpers={}){
  renderSpriteBaseAll(state);
  if(typeof helpers.redrawDiscoveredResources==="function"){
    helpers.redrawDiscoveredResources();
  }
}

function primeSpriteAssets(state, onReady){
  if(!spriteAssetsInit){
    configureRenderAssets(SPRITE_MANIFEST);
    spriteAssetsInit = true;
  }
  if(spriteAssetsReady){
    if(onReady) onReady();
    return Promise.resolve();
  }
  if(!spriteAssetsPromise){
    spriteAssetsPromise = preloadRenderAssets().then(()=>{
      spriteAssetsReady = true;
      if(onReady) onReady();
    });
  } else if(onReady){
    spriteAssetsPromise = spriteAssetsPromise.then(()=>{
      onReady();
    });
  }
  return spriteAssetsPromise;
}

function addBuildingDrawables(state, list){
  for(const b of state.buildings){
    const footX=b.x*state.TILEPX + state.TILEPX/2;
    const footY=b.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 10, ()=>{
      if(drawBuildingSpriteInFrame(state.ctx, state, b)) return;
      const prev=state.baseCtx;
      state.baseCtx=state.ctx;
      try{ fallbackBuildingBaseTile(state, b); } finally { state.baseCtx=prev; }
    });
  }
}
function addResourceDrawables(state, list){
  for(const id of state.knownTreeIds){
    const t=state.trees[id];
    if(!t || !t.alive) continue;
    const i=idxOf(state,t.x,t.y);
    if(!state.explored[i]) continue;
    const footX=t.x*state.TILEPX + state.TILEPX/2;
    const footY=t.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 20, ()=>{
      if(!drawResourceSpriteWithFallback(state.ctx, state, "tree", t.x, t.y)){
        const p=tileBox(state, t.x, t.y);
        state.ctx.fillStyle="rgba(0,0,0,0.18)";
        state.ctx.fillRect(p.px+1, p.py+1, state.TILEPX-2, state.TILEPX-2);
        drawDisc(state.ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.38), "rgb(32,170,60)", "rgba(10,60,20,0.9)");
        drawDisc(state.ctx, p.cx, p.cy+1, Math.max(1,state.TILEPX*0.18), "rgb(70,90,40)");
      }
    });
  }
  for(const id of state.knownRockIds){
    const r=state.rocks[id];
    if(!r || !r.alive) continue;
    const i=idxOf(state,r.x,r.y);
    if(!state.explored[i]) continue;
    const footX=r.x*state.TILEPX + state.TILEPX/2;
    const footY=r.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 21, ()=>{
      if(!drawResourceSpriteWithFallback(state.ctx, state, "rock", r.x, r.y)){
        const p=tileBox(state, r.x, r.y);
        state.ctx.fillStyle="rgb(132,90,220)";
        state.ctx.beginPath();
        state.ctx.moveTo(p.cx, p.py+1);
        state.ctx.lineTo(p.px+state.TILEPX-1, p.cy);
        state.ctx.lineTo(p.cx+1, p.py+state.TILEPX-1);
        state.ctx.lineTo(p.px+1, p.cy+1);
        state.ctx.closePath();
        state.ctx.fill();
        state.ctx.strokeStyle="rgba(230,220,255,0.6)";
        state.ctx.lineWidth=1;
        state.ctx.stroke();
      }
    });
  }
  for(const id of state.knownMeatIds){
    const m=state.meats[id];
    if(!m || !m.alive) continue;
    const i=idxOf(state,m.x,m.y);
    if(!state.explored[i]) continue;
    const footX=m.x*state.TILEPX + state.TILEPX/2;
    const footY=m.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 22, ()=>{
      if(!drawResourceSpriteWithFallback(state.ctx, state, "meat", m.x, m.y)){
        const p=tileBox(state, m.x, m.y);
        drawDisc(state.ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), "rgb(190,95,70)", "rgba(80,30,20,0.85)");
        drawDisc(state.ctx, p.cx+1, p.cy-1, Math.max(1,state.TILEPX*0.10), "rgba(255,220,210,0.55)");
      }
    });
  }
}
function addAnimalDrawables(state, list){
  for(const a of state.animals){
    if(a.state==="Dead") continue;
    const i=idxOf(state,a.x,a.y);
    if(!state.visible[i]) continue;
    const footX=a.x*state.TILEPX + state.TILEPX/2;
    const footY=a.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 30, ()=>{
      if(!drawAnimalSprite(state.ctx, state, a)) drawAnimalPlaceholder(state.ctx, state, a);
    });
  }
}
function addUnitDrawables(state, list){
  for(const u of state.units){
    if(u.dead) continue;
    const i=idxOf(state,u.x,u.y);
    if(!state.visible[i]) continue;
    const footX=u.x*state.TILEPX + state.TILEPX/2;
    const footY=u.y*state.TILEPX + state.TILEPX/2;
    pushDrawable(list, footY, footX, 40, ()=>{
      if(!drawUnitSprite(state.ctx, state, u)) drawUnitPlaceholder(state.ctx, state, u);
      drawUnitHpBar(state.ctx, state, u);
    });
  }
}

function renderSpriteFrame(state){
  const ctx=state.ctx;
  if(!state.grid){
    ctx.fillStyle="#111";
    ctx.fillRect(0,0,state.canvas.width,state.canvas.height);
    return;
  }

  ctx.clearRect(0,0,state.canvas.width,state.canvas.height);
  ctx.drawImage(state.baseLayer,0,0);
  const drawables=[];
  addBuildingDrawables(state, drawables);
  addResourceDrawables(state, drawables);
  addAnimalDrawables(state, drawables);
  addUnitDrawables(state, drawables);
  sortDrawables(drawables);
  for(const d of drawables) d.draw();

  for(const ti of state.dropTiles){
    const r=state.dropReservedBy[ti];
    if(r!==-1 && state.visible[ti]){
      ctx.strokeStyle="rgba(255,255,255,0.22)";
      ctx.lineWidth=1;
      ctx.strokeRect(xOf(state, ti)*state.TILEPX+0.5, yOf(state, ti)*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
    }
  }
  for(const ti of state.parkTiles){
    const r=state.parkReservedBy[ti];
    if(r!==-1 && state.visible[ti]){
      ctx.strokeStyle="rgba(120,190,255,0.22)";
      ctx.lineWidth=1;
      ctx.strokeRect(xOf(state, ti)*state.TILEPX+0.5, yOf(state, ti)*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
    }
  }

  if(state.preferred.type && state.preferred.id!=null){
    let rx=-1, ry=-1;
    if(state.preferred.type==="tree"){
      const t=state.trees[state.preferred.id];
      if(t&&t.alive){ rx=t.x; ry=t.y; }
    } else if(state.preferred.type==="rock"){
      const r=state.rocks[state.preferred.id];
      if(r&&r.alive){ rx=r.x; ry=r.y; }
    } else if(state.preferred.type==="meat"){
      const m=state.meats[state.preferred.id];
      if(m&&m.alive){ rx=m.x; ry=m.y; }
    }
    if(rx!==-1){
      const i=idxOf(state, rx, ry);
      if(state.explored[i]){
        ctx.strokeStyle="rgba(255,255,255,0.95)";
        ctx.lineWidth=1;
        ctx.strokeRect(rx*state.TILEPX+0.5, ry*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
      }
    }
  }

  ctx.drawImage(state.fogLayer,0,0);
}

export {
  renderSpriteFrame,
  renderSpriteBaseAll,
  renderSpriteStorageAndRings,
  renderSpriteResourceBaseTile,
  renderSpriteEraseBaseTile,
  primeSpriteAssets,
};
