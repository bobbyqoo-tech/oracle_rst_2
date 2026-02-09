import { state } from "./state.js";
import { generate, resizeCanvases, updateVisibilityAndFogLayers, addBuilding } from "./world.js";
import { initAstarArrays } from "./pathfinding.js";
import { log, updateInfo, tick, render, setStatus } from "./sim.js";

const canvas=document.getElementById("c");
const ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;

state.canvas=canvas;
state.ctx=ctx;

state.dom.logEl=document.getElementById("log");
state.dom.infoEl=document.getElementById("info");
state.dom.statusTag=document.getElementById("statusTag");
state.dom.hpAllEl=document.getElementById("hpAll");
state.dom.statsEl=document.getElementById("statPanel");
const ageTag=document.getElementById("ageTag");
const ageUpBtn=document.getElementById("ageUp");
const ageCostEl=document.getElementById("ageCost");
const techLogBtn=document.getElementById("techLog");
const techDoubleAxeBtn=document.getElementById("techDoubleAxe");
const techBowSawBtn=document.getElementById("techBowSaw");
const techDigBtn=document.getElementById("techDig");
const techBronzeBtn=document.getElementById("techBronze");
const techCastingBtn=document.getElementById("techCasting");
const costLogEl=document.getElementById("costLog");
const costDoubleAxeEl=document.getElementById("costDoubleAxe");
const costBowSawEl=document.getElementById("costBowSaw");
const costDigEl=document.getElementById("costDig");
const costBronzeEl=document.getElementById("costBronze");
const costCastingEl=document.getElementById("costCasting");

const inpLumber=document.getElementById("inpLumber");
const inpMiner=document.getElementById("inpMiner");
const inpHunter=document.getElementById("inpHunter");
const inpScout=document.getElementById("inpScout");
const inpHPLumber=document.getElementById("inpHPLumber");
const inpHPMiner=document.getElementById("inpHPMiner");
const inpHPHunter=document.getElementById("inpHPHunter");
const inpHPScout=document.getElementById("inpHPScout");
const inpHPAnimal=document.getElementById("inpHPAnimal");
const inpTrees=document.getElementById("inpTrees");
const inpRocks=document.getElementById("inpRocks");
const inpAnimals=document.getElementById("inpAnimals");
const inpObs=document.getElementById("inpObs");
const inpVisW=document.getElementById("inpVisW");
const inpVisS=document.getElementById("inpVisS");
const inpTile=document.getElementById("inpTile");
const inpAstarBudget=document.getElementById("inpAstarBudget");
const inpSampleK=document.getElementById("inpSampleK");
const inpHz=document.getElementById("inpHz");

const btnGen=document.getElementById("gen");
const btnStart=document.getElementById("start");
const btnPause=document.getElementById("pause");
const btnStep=document.getElementById("step");
const btnClear=document.getElementById("clearlog");
const inpBuildX=document.getElementById("buildX");
const inpBuildY=document.getElementById("buildY");
const selBuildType=document.getElementById("buildType");
const btnBuild=document.getElementById("buildBtn");
btnClear.onclick=()=> (state.dom.logEl.textContent="");

btnBuild.onclick=()=>{
  if(!state.grid){ log("請先按「生成地圖」。"); return; }
  const x=clampInt(inpBuildX.value,0,state.constants.W-1,0);
  const y=clampInt(inpBuildY.value,0,state.constants.H-1,0);
  const type=selBuildType.value;
  inpBuildX.value=x; inpBuildY.value=y;
  const res=addBuilding(type,x,y);
  if(!res.ok){
    log("建造失敗：位置不可用。");
    return;
  }
  log(`建造完成：${type} @(${x},${y})`);
  updateInfo();
  render();
};

ageUpBtn.onclick=()=>{
  if(!state.grid){ log("請先按「生成地圖」。"); return; }
  if(state.ageIndex>=state.constants.AGES.length-1) return;
  const c=AGE_COSTS[state.ageIndex];
  if(!canAfford(c)) return;
  spend(c);
  state.ageIndex++;
  log(`時代提升：${state.constants.AGES[state.ageIndex]}`);
  updateInfo();
};

function researchTech(id){
  const t=TECHS[id];
  if(state.techs[id]) return;
  if(state.ageIndex < t.reqAge) return;
  if(t.prereq && !state.techs[t.prereq]) return;
  if(!canAfford(t.cost)) return;
  spend(t.cost);
  state.techs[id]=true;
  t.apply();
  log(`研發完成：${t.name}`);
  updateInfo();
}

techLogBtn.onclick=()=>researchTech("logging");
techDoubleAxeBtn.onclick=()=>researchTech("doubleAxe");
techBowSawBtn.onclick=()=>researchTech("bowSaw");
techDigBtn.onclick=()=>researchTech("digging");
techBronzeBtn.onclick=()=>researchTech("bronze");
techCastingBtn.onclick=()=>researchTech("casting");

function clampInt(v,lo,hi,f){ const n=Number(v); if(!Number.isFinite(n)) return f; return Math.max(lo,Math.min(hi,Math.floor(n))); }

const AGE_COSTS=[
  { wood:200, ore:150, food:80 },
  { wood:400, ore:300, food:160 },
];
const TECHS={
  logging:{ name:"伐木", cost:{wood:80, ore:30, food:20}, reqAge:0, prereq:null, apply:()=>{ state.chopRate*=1.25; } },
  doubleAxe:{ name:"雙面斧", cost:{wood:140, ore:80, food:40}, reqAge:1, prereq:"logging", apply:()=>{ state.chopRate*=1.30; } },
  bowSaw:{ name:"弓形鉅", cost:{wood:220, ore:140, food:60}, reqAge:2, prereq:"doubleAxe", apply:()=>{ state.chopRate*=1.35; } },
  digging:{ name:"挖掘", cost:{wood:70, ore:80, food:20}, reqAge:0, prereq:null, apply:()=>{ state.mineRate*=1.25; } },
  bronze:{ name:"青銅術", cost:{wood:130, ore:160, food:50}, reqAge:1, prereq:"digging", apply:()=>{ state.mineRate*=1.30; } },
  casting:{ name:"鑄造技術", cost:{wood:220, ore:240, food:80}, reqAge:2, prereq:"bronze", apply:()=>{ state.mineRate*=1.35; } },
};

function costText(c){ return `木${c.wood} / 礦${c.ore} / 食物${c.food}`; }
function canAfford(c){ return state.storage.wood>=c.wood && state.storage.ore>=c.ore && state.storage.food>=c.food; }
function spend(c){ state.storage.wood-=c.wood; state.storage.ore-=c.ore; state.storage.food-=c.food; }

function refreshTechUI(){
  if(!ageTag || !ageUpBtn) return;
  ageTag.textContent = state.constants.AGES[state.ageIndex];
  const maxAge = state.constants.AGES.length-1;
  if(!state.grid){
    ageUpBtn.disabled=true;
    ageCostEl.textContent = "";
  } else if(state.ageIndex>=maxAge){
    ageUpBtn.disabled=true;
    ageCostEl.textContent = "已達最高時代";
  } else {
    const c=AGE_COSTS[state.ageIndex];
    ageCostEl.textContent = `需求：${costText(c)}`;
    ageUpBtn.disabled = !canAfford(c);
  }

  function updateTech(btn, costEl, id){
    const t=TECHS[id];
    const researched=state.techs[id];
    const blockedAge = state.ageIndex < t.reqAge;
    const blockedPre = t.prereq && !state.techs[t.prereq];
    const blockedRes = !canAfford(t.cost);
    let status="";
    if(researched) status="已研發";
    else if(blockedAge) status=`需${state.constants.AGES[t.reqAge]}`;
    else if(blockedPre) status=`需先研發${TECHS[t.prereq].name}`;
    else if(blockedRes) status="資源不足";
    costEl.textContent = `需求：${costText(t.cost)}${status?`（${status}）`:""}`;
    btn.disabled = !state.grid || researched || blockedAge || blockedPre || blockedRes;
  }

  updateTech(techLogBtn, costLogEl, "logging");
  updateTech(techDoubleAxeBtn, costDoubleAxeEl, "doubleAxe");
  updateTech(techBowSawBtn, costBowSawEl, "bowSaw");
  updateTech(techDigBtn, costDigEl, "digging");
  updateTech(techBronzeBtn, costBronzeEl, "bronze");
  updateTech(techCastingBtn, costCastingEl, "casting");
}

state.refreshTechUI = refreshTechUI;

function readParams(){
  return {
    lumberCount: clampInt(inpLumber.value,0,900,10),
    minerCount: clampInt(inpMiner.value,0,900,10),
    hunterCount: clampInt(inpHunter.value,0,900,10),
    scoutCount: clampInt(inpScout.value,0,200,6),
    hpLumber: clampInt(inpHPLumber.value,1,200,10),
    hpMiner: clampInt(inpHPMiner.value,1,200,10),
    hpHunter: clampInt(inpHPHunter.value,1,200,12),
    hpScout: clampInt(inpHPScout.value,1,200,8),
    hpAnimal: clampInt(inpHPAnimal.value,1,200,18),
    treeCount: clampInt(inpTrees.value,0,9000,500),
    rockCount: clampInt(inpRocks.value,0,6000,200),
    animalCount: clampInt(inpAnimals.value,0,3000,40),
    obsPercent: clampInt(inpObs.value,0,40,10),
    visionWorker: clampInt(inpVisW.value,2,24,7),
    visionScout: clampInt(inpVisS.value,4,36,13),
    tilePx: clampInt(inpTile.value,4,12,7),
    astarBudget: clampInt(inpAstarBudget.value,1,80,12),
    sampleK: clampInt(inpSampleK.value,5,200,45),
    tickHz: clampInt(inpHz.value,5,60,20),
  };
}

btnGen.onclick=()=>{
  const p=readParams();
  inpLumber.value=p.lumberCount; inpMiner.value=p.minerCount; inpHunter.value=p.hunterCount; inpScout.value=p.scoutCount;
  inpHPLumber.value=p.hpLumber; inpHPMiner.value=p.hpMiner; inpHPHunter.value=p.hpHunter; inpHPScout.value=p.hpScout; inpHPAnimal.value=p.hpAnimal;
  inpTrees.value=p.treeCount; inpRocks.value=p.rockCount; inpAnimals.value=p.animalCount; inpObs.value=p.obsPercent;
  inpVisW.value=p.visionWorker; inpVisS.value=p.visionScout; inpTile.value=p.tilePx;
  inpAstarBudget.value=p.astarBudget; inpSampleK.value=p.sampleK; inpHz.value=p.tickHz;

  generate(p);
  initAstarArrays();
  setStatus("READY");
  log(`生成完成：工人(含獵人)=${state.workers.length} 斥侯=${state.scouts.length} 動物=${state.animals.length}`);
  updateInfo();
  refreshTechUI();
  render();
};

btnStart.onclick=()=>{
  if(!state.grid){ log("請先按「生成地圖」。"); return; }
  if(state.simState==="READY"||state.simState==="PAUSE"){
    state.simState="RUN"; setStatus("RUN"); log("開始");
    try{ tick(); } catch(e){ log(`JS Error: ${e.message}`); }
  } else if(state.simState==="DONE") log("已完成，請先生成地圖再開始。");
};

btnPause.onclick=()=>{
  if(!state.grid) return;
  if(state.simState==="RUN"){ state.simState="PAUSE"; setStatus("PAUSE"); log("暫停"); }
  else if(state.simState==="PAUSE"){ state.simState="RUN"; setStatus("RUN"); log("繼續"); }
  else log("目前狀態非 RUN（READY/DONE）。");
};

btnStep.onclick=()=>{
  if(!state.grid) return;
  if(state.simState==="RUN"||state.simState==="DONE") return;
  const prev=state.simState;
  state.simState="PAUSE"; setStatus("PAUSE");
  tick();
  state.simState=prev; setStatus(prev);
};

canvas.addEventListener("click",(ev)=>{
  if(!state.grid) return;
  const rect=canvas.getBoundingClientRect();
  const mx=((ev.clientX-rect.left)/state.TILEPX)|0;
  const my=((ev.clientY-rect.top)/state.TILEPX)|0;
  if(mx<0||my<0||mx>=state.constants.W||my>=state.constants.H) return;
  const i=(my*state.constants.W)+mx;
  if(!state.explored[i]) { log(`(點擊) 未探索：(${mx},${my})`); return; }
  const rt=state.resType[i];
  if(rt===state.constants.ResT.Tree){ state.preferred={type:"tree",id:state.resIdAt[i]}; log(`偏好目標：樹#${state.preferred.id} @(${mx},${my})`); }
  else if(rt===state.constants.ResT.Rock){ state.preferred={type:"rock",id:state.resIdAt[i]}; log(`偏好目標：礦#${state.preferred.id} @(${mx},${my})`); }
  else if(rt===state.constants.ResT.Meat){ state.preferred={type:"meat",id:state.resIdAt[i]}; log(`偏好目標：肉#${state.preferred.id} @(${mx},${my})`); }
  else log(`(點擊) 不是樹/礦/肉：(${mx},${my})`);
});

canvas.addEventListener("mousemove",(ev)=>{
  if(!state.grid) return;
  const rect=canvas.getBoundingClientRect();
  const mx=((ev.clientX-rect.left)/state.TILEPX)|0;
  const my=((ev.clientY-rect.top)/state.TILEPX)|0;
  if(mx<0||my<0||mx>=state.constants.W||my>=state.constants.H){
    state.hoverX=null; state.hoverY=null;
  } else {
    state.hoverX=mx; state.hoverY=my;
  }
  updateInfo();
});
canvas.addEventListener("mouseleave",()=>{
  state.hoverX=null; state.hoverY=null;
  updateInfo();
});

window.onerror=(msg, src, line, col)=>{
  log(`JS Error: ${msg} @${line}:${col}`);
};

let lastTime=performance.now();
let acc=0;
function raf(t){
  const dt=(t-lastTime)/1000;
  lastTime=t;
  if(state.simState==="RUN"){
    acc += dt;
    const step=1/state.TICK_HZ;
    let steps=0;
    const maxSteps=6;
    while(acc>=step && steps<maxSteps){
      tick();
      acc -= step;
      steps++;
    }
  } else acc=0;

  render();
  requestAnimationFrame(raf);
}

resizeCanvases();
state.ctx.fillStyle="#111"; state.ctx.fillRect(0,0,state.canvas.width,state.canvas.height);
log("v7：獵人/野生動物/血量/逃跑。先調參數→生成地圖→開始。");
setStatus("READY");
updateInfo();
refreshTechUI();
requestAnimationFrame(raf);

