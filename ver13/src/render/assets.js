const assetManifest = new Map();
const assetCache = new Map();
const warnedKeys = new Set();

function warnOnce(key, msg, extra=null){
  const id = `${key}|${msg}`;
  if(warnedKeys.has(id)) return;
  warnedKeys.add(id);
  if(extra!=null) console.warn(`[render-assets] ${msg}: ${key}`, extra);
  else console.warn(`[render-assets] ${msg}: ${key}`);
}

function configureRenderAssets(manifest){
  if(!manifest) return;
  for(const [key, url] of Object.entries(manifest)){
    assetManifest.set(key, url);
  }
}

function ensureAssetRecord(key){
  let rec = assetCache.get(key);
  if(rec) return rec;

  const url = assetManifest.get(key);
  rec = {
    key,
    url: url || null,
    status: url ? "idle" : "missing",
    image: null,
    error: null,
    promise: null,
    warned: false,
  };
  assetCache.set(key, rec);
  if(rec.status==="missing"){
    warnOnce(key, "Missing manifest entry");
  }
  return rec;
}

function loadRenderAsset(key){
  const rec = ensureAssetRecord(key);
  if(rec.status==="ready" || rec.status==="loading" || rec.status==="error" || rec.status==="missing"){
    return rec.promise || Promise.resolve(rec);
  }
  rec.status = "loading";
  rec.image = new Image();
  rec.promise = new Promise((resolve)=>{
    rec.image.onload = ()=>{
      rec.status = "ready";
      resolve(rec);
    };
    rec.image.onerror = (err)=>{
      rec.status = "error";
      rec.error = err || new Error(`Failed to load ${rec.url || key}`);
      warnOnce(key, `Failed to load asset (${rec.url || "no-url"})`, rec.error);
      resolve(rec);
    };
  });
  rec.image.src = rec.url;
  return rec.promise;
}

function preloadRenderAssets(keys=null){
  const list = Array.isArray(keys) ? keys : [...assetManifest.keys()];
  return Promise.all(list.map((key)=>loadRenderAsset(key)));
}

function getRenderAsset(key){
  return ensureAssetRecord(key);
}

function isRenderAssetReady(key){
  return ensureAssetRecord(key).status === "ready";
}

function drawCachedSprite(ctx, key, dx, dy, dw, dh){
  const rec = ensureAssetRecord(key);
  if(rec.status==="idle") loadRenderAsset(key);
  if(rec.status==="missing"){
    warnOnce(key, "Sprite key unresolved in manifest");
  }
  if(rec.status!=="ready" || !rec.image) return false;
  ctx.drawImage(rec.image, dx, dy, dw, dh);
  return true;
}

export {
  configureRenderAssets,
  preloadRenderAssets,
  getRenderAsset,
  isRenderAssetReady,
  drawCachedSprite,
};
