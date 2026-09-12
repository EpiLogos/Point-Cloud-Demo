/** Native background modes, painted identically on the live page and clean exports. */
import type {Scene} from './model';
import {hexToRgb,isLightHex,hexToRgbaStr} from '../../src/engine/colorPalettes';
let tile:HTMLCanvasElement|null=null;
function paperTile(){if(tile)return tile;tile=document.createElement('canvas');tile.width=tile.height=128;const c=tile.getContext('2d')!,im=c.createImageData(128,128);let seed=1031;for(let i=0;i<im.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)|0;const v=(seed>>>24);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=210;}c.putImageData(im,0,0);return tile;}
export function paintPaper(ctx:CanvasRenderingContext2D,s:Scene,w:number,h:number){
 const bg=s.field.background,mode=s.engine.backgroundMode??'solid',light=isLightHex(bg),rgb=hexToRgb(bg),intensity=s.field.params.native_backgroundGlowIntensity??.45;
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const edge=(f:number)=>`rgb(${rgb.map(v=>Math.floor(v*f)).join(',')})`;
 if(mode!=='solid'){
  ctx.save();let g:CanvasGradient;
  if(mode==='adaptive'){ctx.translate(w/2,h/2);ctx.scale(w*.75,h*.7);g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,hexToRgbaStr(s.field.palette[0],intensity*(light?.12:.22)));g.addColorStop(.4,hexToRgbaStr(s.field.palette[Math.floor(s.field.palette.length/2)],intensity*(light?.08:.15)));g.addColorStop(.75,bg);g.addColorStop(1,edge(light?.92:.4));ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);}
  else {g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w/2,h/2));if(mode==='vignette'){g.addColorStop(light?.35:.25,bg);g.addColorStop(1,edge(light?.88:.35));}else{g.addColorStop(0,hexToRgbaStr(s.field.palette[0],intensity*(light?.15:.28)));g.addColorStop(.58,bg);g.addColorStop(1,edge(light?.9:.3));}ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}ctx.restore();
 }
 const grain=s.field.params.grain??0;if(grain>0){ctx.save();ctx.globalAlpha=Math.min(.2,grain);ctx.globalCompositeOperation=light?'multiply':'screen';ctx.fillStyle=ctx.createPattern(paperTile(),'repeat')!;ctx.fillRect(0,0,w,h);ctx.restore();}
}
