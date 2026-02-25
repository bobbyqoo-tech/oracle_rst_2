import { idx, xOf, yOf } from "../world.js";

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

function tileCenter(state, x, y){
  const px = x*state.TILEPX;
  const py = y*state.TILEPX;
  return { cx:px + state.TILEPX/2, cy:py + state.TILEPX/2, px, py };
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
    const i=idx(t.x,t.y);
    if(!state.visible[i]) continue;
    const p=tileCenter(state, t.x, t.y);
    ctx.fillStyle="rgba(0,0,0,0.18)";
    ctx.fillRect(p.px+1, p.py+1, state.TILEPX-2, state.TILEPX-2);
    drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.38), "rgb(32,170,60)", "rgba(10,60,20,0.9)");
    drawDisc(ctx, p.cx, p.cy+1, Math.max(1,state.TILEPX*0.18), "rgb(70,90,40)");
  }

  for(const id of state.knownRockIds){
    const r=state.rocks[id];
    if(!r || !r.alive) continue;
    const i=idx(r.x,r.y);
    if(!state.visible[i]) continue;
    const p=tileCenter(state, r.x, r.y);
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

  for(const id of state.knownMeatIds){
    const m=state.meats[id];
    if(!m || !m.alive) continue;
    const i=idx(m.x,m.y);
    if(!state.visible[i]) continue;
    const p=tileCenter(state, m.x, m.y);
    drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), "rgb(190,95,70)", "rgba(80,30,20,0.85)");
    drawDisc(ctx, p.cx+1, p.cy-1, Math.max(1,state.TILEPX*0.10), "rgba(255,220,210,0.55)");
  }

  for(const a of state.animals){
    if(a.state==="Dead") continue;
    const i=idx(a.x,a.y);
    if(!state.visible[i]) continue;
    const p=tileCenter(state, a.x, a.y);
    const fill = a.state==="Chase" ? "rgb(220,90,90)" : (a.state==="Return" ? "rgb(160,160,160)" : "rgb(200,170,110)");
    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.fillRect(p.px+1, p.py+state.TILEPX-3, Math.max(2,state.TILEPX-2), 2);
    drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.34), fill, "rgba(20,20,20,0.8)");
    ctx.fillStyle="rgba(255,255,255,0.35)";
    ctx.fillRect(p.px+2, p.py+2, Math.max(1,(state.TILEPX/4)|0), 1);
  }

  for(const u of state.units){
    if(u.dead) continue;
    const i=idx(u.x,u.y);
    if(!state.visible[i]) continue;
    const p=tileCenter(state, u.x, u.y);
    ctx.fillStyle="rgba(0,0,0,0.20)";
    ctx.fillRect(p.px+1, p.py+state.TILEPX-2, Math.max(2,state.TILEPX-2), 1);
    drawDisc(ctx, p.cx, p.cy, Math.max(2,state.TILEPX*0.30), roleColor(u.role), "rgba(15,15,15,0.85)");
    ctx.fillStyle="rgba(255,255,255,0.30)";
    ctx.fillRect(p.px+2, p.py+2, Math.max(1,(state.TILEPX/4)|0), 1);

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
      ctx.strokeRect(xOf(ti)*state.TILEPX+0.5, yOf(ti)*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
    }
  }
  for(const ti of state.parkTiles){
    const r=state.parkReservedBy[ti];
    if(r!==-1 && state.visible[ti]){
      ctx.strokeStyle="rgba(120,190,255,0.22)";
      ctx.lineWidth=1;
      ctx.strokeRect(xOf(ti)*state.TILEPX+0.5, yOf(ti)*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
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
        ctx.strokeStyle="rgba(255,255,255,0.95)";
        ctx.lineWidth=1;
        ctx.strokeRect(rx*state.TILEPX+0.5, ry*state.TILEPX+0.5, state.TILEPX-1, state.TILEPX-1);
      }
    }
  }

  ctx.drawImage(state.fogLayer,0,0);
}

export { renderSpriteFrame };

