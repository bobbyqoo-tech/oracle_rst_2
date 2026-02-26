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

function unitSpriteKey(state, u){
  if(u.role!=="lumber" && u.role!=="miner" && u.role!=="hunter" && u.role!=="scout") return null;
  const t = getUnitTargetPos(state, u);
  const dir = t ? facing4FromVector(t.x-u.x, t.y-u.y) : "s";
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

function drawGroundTileSprite(state, x, y){
  if(drawCachedSprite(state.baseCtx, "terrain.ground", x*state.TILEPX, y*state.TILEPX, state.TILEPX, state.TILEPX)) return;
  fallbackTerrainTile(state, x, y);
}

function drawBlockTileSprite(state, x, y){
  if(drawCachedSprite(state.baseCtx, "terrain.block", x*state.TILEPX, y*state.TILEPX, state.TILEPX, state.TILEPX)) return;
  fallbackBlockTile(state, x, y);
}

function renderSpriteStorageAndRings(state){
  for(const b of state.buildings){
    if(!drawBuildingSpriteWithFallback(state, b)){
      fallbackBuildingBaseTile(state, b);
    }
  }

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
  if(!drawResourceSpriteWithFallback(state.baseCtx, state, kind, x, y)){
    fallbackResourceBaseTile(state, kind, x, y);
  }
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

function renderSpriteFrame(state){
  const ctx=state.ctx;
  if(!state.grid){
    ctx.fillStyle="#111";
    ctx.fillRect(0,0,state.canvas.width,state.canvas.height);
    return;
  }

  ctx.clearRect(0,0,state.canvas.width,state.canvas.height);
  ctx.drawImage(state.baseLayer,0,0);

  for(const id of state.knownTreeIds){
    const t=state.trees[id];
    if(!t || !t.alive) continue;
    const i=idxOf(state, t.x, t.y);
    if(!state.visible[i]) continue;
    if(!drawResourceSpriteWithFallback(ctx, state, "tree", t.x, t.y)){
      const p=tileBox(state, t.x, t.y);
      ctx.fillStyle="rgba(0,0,0,0.18)";
      ctx.fillRect(p.px+1, p.py+1, state.TILEPX-2, state.TILEPX-2);
      drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.38), "rgb(32,170,60)", "rgba(10,60,20,0.9)");
      drawDisc(ctx, p.cx, p.cy+1, Math.max(1,state.TILEPX*0.18), "rgb(70,90,40)");
    }
  }

  for(const id of state.knownRockIds){
    const r=state.rocks[id];
    if(!r || !r.alive) continue;
    const i=idxOf(state, r.x, r.y);
    if(!state.visible[i]) continue;
    if(!drawResourceSpriteWithFallback(ctx, state, "rock", r.x, r.y)){
      const p=tileBox(state, r.x, r.y);
      ctx.fillStyle="rgb(132,90,220)";
      ctx.beginPath();
      ctx.moveTo(p.cx, p.py+1);
      ctx.lineTo(p.px+state.TILEPX-1, p.cy);
      ctx.lineTo(p.cx+1, p.py+state.TILEPX-1);
      ctx.lineTo(p.px+1, p.cy+1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle="rgba(230,220,255,0.6)";
      ctx.lineWidth=1;
      ctx.stroke();
    }
  }

  for(const id of state.knownMeatIds){
    const m=state.meats[id];
    if(!m || !m.alive) continue;
    const i=idxOf(state, m.x, m.y);
    if(!state.visible[i]) continue;
    if(!drawResourceSpriteWithFallback(ctx, state, "meat", m.x, m.y)){
      const p=tileBox(state, m.x, m.y);
      drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), "rgb(190,95,70)", "rgba(80,30,20,0.85)");
      drawDisc(ctx, p.cx+1, p.cy-1, Math.max(1,state.TILEPX*0.10), "rgba(255,220,210,0.55)");
    }
  }

  for(const a of state.animals){
    if(a.state==="Dead") continue;
    const i=idxOf(state, a.x, a.y);
    if(!state.visible[i]) continue;
    const p=tileBox(state, a.x, a.y);
    const fill = a.state==="Chase" ? "rgb(220,90,90)" : (a.state==="Return" ? "rgb(160,160,160)" : "rgb(200,170,110)");
    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.fillRect(p.px+1, p.py+state.TILEPX-3, Math.max(2,state.TILEPX-2), 2);
    drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), fill, "rgba(20,20,20,0.8)");
    ctx.fillStyle="rgba(255,255,255,0.35)";
    ctx.fillRect(p.px+2, p.py+2, Math.max(1,(state.TILEPX/4)|0), 1);
  }

  for(const u of state.units){
    if(u.dead) continue;
    const i=idxOf(state, u.x, u.y);
    if(!state.visible[i]) continue;
    if(!drawUnitSprite(ctx, state, u)){
      drawUnitPlaceholder(ctx, state, u);
    }

    const frac=u.hp/u.maxHP;
    if(frac<0.45){
      ctx.fillStyle = frac<0.2 ? "rgb(255,80,80)" : "rgb(255,210,80)";
      ctx.fillRect(u.x*state.TILEPX, u.y*state.TILEPX, Math.max(1,(state.TILEPX/3)|0), Math.max(1,(state.TILEPX/3)|0));
    }
  }

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
