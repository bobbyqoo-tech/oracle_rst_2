import { idx, xOf, yOf } from "../world.js";

function renderPixelFrame(state){
  if(!state.grid){
    state.ctx.fillStyle="#111";
    state.ctx.fillRect(0,0,state.canvas.width,state.canvas.height);
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
      state.ctx.fillStyle = frac<0.2 ? "rgb(255,80,80)" : "rgb(255,210,80)";
      state.ctx.fillRect(
        u.x*state.TILEPX,
        u.y*state.TILEPX,
        Math.max(1,(state.TILEPX/3)|0),
        Math.max(1,(state.TILEPX/3)|0)
      );
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

export { renderPixelFrame };

