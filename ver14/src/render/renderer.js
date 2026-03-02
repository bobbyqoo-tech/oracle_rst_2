import {
  renderPixelFrame,
  renderPixelBaseAll,
  renderPixelStorageAndRings,
  renderPixelResourceBaseTile,
  renderPixelEraseBaseTile,
  primePixelAssets,
} from "./render_pixel.js";
import {
  renderSpriteFrame,
  renderSpriteBaseAll,
  renderSpriteStorageAndRings,
  renderSpriteResourceBaseTile,
  renderSpriteEraseBaseTile,
  primeSpriteAssets,
} from "./render_sprite.js";

let rendererMode = "pixel";

function setRendererMode(mode){
  rendererMode = (mode==="sprite") ? "sprite" : "pixel";
}

function renderFrame(state){
  if(rendererMode==="sprite") return renderSpriteFrame(state);
  return renderPixelFrame(state);
}

function primeRendererAssets(state, onReady){
  if(rendererMode==="sprite") return primeSpriteAssets(state, onReady);
  return primePixelAssets(state, onReady);
}

function renderBaseAllLayer(state){
  if(rendererMode==="sprite") return renderSpriteBaseAll(state);
  return renderPixelBaseAll(state);
}

function renderStorageAndRingsLayer(state){
  if(rendererMode==="sprite") return renderSpriteStorageAndRings(state);
  return renderPixelStorageAndRings(state);
}

function renderResourceBaseTile(state, kind, x, y){
  if(rendererMode==="sprite") return renderSpriteResourceBaseTile(state, kind, x, y);
  return renderPixelResourceBaseTile(state, kind, x, y);
}

function eraseBaseTileLayer(state, i, helpers){
  if(rendererMode==="sprite") return renderSpriteEraseBaseTile(state, i, helpers);
  return renderPixelEraseBaseTile(state, i, helpers.getDistToNearestBuilding);
}

export {
  setRendererMode,
  renderFrame,
  primeRendererAssets,
  renderBaseAllLayer,
  renderStorageAndRingsLayer,
  renderResourceBaseTile,
  eraseBaseTileLayer,
};
