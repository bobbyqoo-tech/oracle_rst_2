import { state } from "./state.js?v=9";
import { idx, xOf, yOf, inBounds, isWalkableTile, canMoveDiag, releaseReservation } from "./world.js?v=9";

function octileH(ax, ay, bx, by){
  const dx=Math.abs(ax-bx), dy=Math.abs(ay-by);
  const F=Math.SQRT2-1;
  return (dx<dy)?F*dx+dy:F*dy+dx;
}

class MinHeap{
  constructor(){ this.nodes=[]; this.fs=[]; }
  size(){ return this.nodes.length; }
  push(node,f){
    const a=this.nodes, b=this.fs;
    let i=a.length;
    a.push(node); b.push(f);
    while(i>0){
      const p=(i-1)>>1;
      if(b[p]<=f) break;
      a[i]=a[p]; b[i]=b[p];
      i=p;
    }
    a[i]=node; b[i]=f;
  }
  pop(){
    const a=this.nodes, b=this.fs;
    const n=a.length;
    if(!n) return null;
    const out=a[0];
    const lastN=a.pop();
    const lastF=b.pop();
    if(n>1){
      let i=0;
      while(true){
        let l=i*2+1, r=l+1;
        if(l>=a.length) break;
        let s=l;
        if(r<a.length && b[r]<b[l]) s=r;
        if(b[s]>=lastF) break;
        a[i]=a[s]; b[i]=b[s];
        i=s;
      }
      a[i]=lastN; b[i]=lastF;
    }
    return out;
  }
}

function initAstarArrays(){
  const N=state.constants.W*state.constants.H;
  state.gScore=new Float32Array(N);
  state.parent=new Int32Array(N);
  state.seenStamp=new Int32Array(N);
  state.closedStamp=new Int32Array(N);
  state.stampCounter=1;
}

function astar(startI, goalI, avoidOccupied=true){
  const stamp=state.stampCounter++;
  if(state.stampCounter>1e9){ state.seenStamp.fill(0); state.closedStamp.fill(0); state.stampCounter=1; }

  const open=new MinHeap();
  const sx=xOf(startI), sy=yOf(startI), gx=xOf(goalI), gy=yOf(goalI);

  state.seenStamp[startI]=stamp;
  state.gScore[startI]=0;
  state.parent[startI]=-1;
  open.push(startI, octileH(sx,sy,gx,gy));

  while(open.size()){
    const cur=open.pop();
    if(cur===goalI){
      const path=[];
      let p=cur;
      while(p!==-1 && p!==startI){
        path.push(p);
        p=state.parent[p];
      }
      path.reverse();
      return path;
    }
    state.closedStamp[cur]=stamp;
    const baseG=state.gScore[cur];
    const cx=xOf(cur), cy=yOf(cur);

    for(const d of state.constants.DIRS8){
      const nx=cx+d.dx, ny=cy+d.dy;
      if(!inBounds(nx,ny)) continue;
      const ni=idx(nx,ny);

      if(!isWalkableTile(ni) && ni!==goalI) continue;
      if(!canMoveDiag(cur,ni)) continue;

      if(avoidOccupied){
        const occ=state.occupied[ni];
        if(occ!==-1 && ni!==goalI) continue;
      }
      if(state.closedStamp[ni]===stamp) continue;

      const tentative=baseG+d.c;
      if(state.seenStamp[ni]!==stamp || tentative<state.gScore[ni]){
        state.seenStamp[ni]=stamp;
        state.gScore[ni]=tentative;
        state.parent[ni]=cur;
        open.push(ni, tentative + octileH(nx,ny,gx,gy));
      }
    }
  }
  return null;
}

function requestPath(unitId, goalI){
  const u=state.units[unitId];
  if(!u || u.waitingPath) return;
  u.waitingPath=true;
  state.pathQueue.push({unitId, startI: idx(u.x,u.y), goalI});
}

function processPathQueue(){
  let done=0;
  while(done<state.ASTAR_BUDGET && state.pathQueue.length){
    const job=state.pathQueue.shift();
    const u=state.units[job.unitId];
    if(!u) continue;
    u.waitingPath=false;

    const path=astar(job.startI, job.goalI, true);
    if(!path){
      u.path=[];
      u.state="Idle";
      u.target=null;
      u.intent=null;
      u.stuckTicks=0;
      if(u.dropTileI!=null){ releaseReservation(u.id, state.dropTiles, state.dropReservedBy); u.dropTileI=null; }
      if(u.parkTileI!=null){ releaseReservation(u.id, state.parkTiles, state.parkReservedBy); u.parkTileI=null; }
    } else {
      u.path=path;
      u.state=u.intent==="ToStorage" ? "ToStorage" : (u.intent==="ToPark" ? "ToPark" : "Move");
      u.stuckTicks=0;
    }
    done++;
  }
}

export { initAstarArrays, requestPath, processPathQueue, astar };

