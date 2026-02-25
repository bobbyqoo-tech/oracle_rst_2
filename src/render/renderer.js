import { renderPixelFrame } from "./render_pixel.js";
import { renderSpriteFrame } from "./render_sprite.js";

let rendererMode = "pixel";

function setRendererMode(mode){
  rendererMode = (mode==="sprite") ? "sprite" : "pixel";
}

function renderFrame(state){
  if(rendererMode==="sprite") return renderSpriteFrame(state);
  return renderPixelFrame(state);
}

export { setRendererMode, renderFrame };

