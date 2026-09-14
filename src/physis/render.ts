import {ProductionAdapter} from '../../field-studies-journeys/src/production';
import {fieldStudies,clone,validateJourney,type Scene} from '../../field-studies-journeys/src/model';
import {importDocuments} from '../../field-studies-journeys/src/nativeBridge';
import {defaultCamera,stageCentre,stageScale,basis,type Camera} from '../../field-studies-journeys/src/camera';
const canvas=document.querySelector<HTMLCanvasElement>('canvas')!;
let engine=new ProductionAdapter(canvas), scene:Scene|null=null, camera=defaultCamera();
let savedView:any=null;
let signature='', revision=0, fps=30, pixelRatio=1, last=performance.now(), ready=false, raf=0;
function resize(){
 engine.resize(innerWidth,innerHeight,pixelRatio);
 if(!scene)return;
 camera={...defaultCamera(),...scene.view,panX:scene.view.panX*innerWidth,panY:scene.view.panY*innerHeight};
 if(savedView?.expression&&savedView.camera){camera={...camera,...savedView.camera};if(savedView.viewport){camera.panX*=innerWidth/savedView.viewport.width;camera.panY*=innerHeight/savedView.viewport.height;}}
 else if(scene.view.nativeCamera){const c=scene.view.nativeCamera;camera.yaw=-c.yaw;camera.pitch=c.pitch;camera.zoom=c.zoom*400/stageScale(innerWidth,innerHeight);const {a,b}=basis(camera),o=stageCentre(innerWidth,innerHeight);camera.panX=innerWidth/2-o.x-c.zoom*(a[0]*c.panX+a[1]*c.panY);camera.panY=innerHeight/2-o.y+c.zoom*(b[0]*c.panX+b[1]*c.panY);}
}
const events=new EventSource('/api/events?renderer=1');
events.onmessage=event=>{
 try {
  const state=JSON.parse(event.data), nextSignature=JSON.stringify([state.sceneId,state.particleLimit]);
  fps=state.fps;pixelRatio=state.pixelRatio;canvas.style.opacity=String(state.opacity);resize();
  if(signature===nextSignature&&scene)return;
  const saved=state.scene;
  let expression=saved?.expression?validateJourney(saved.expression):saved?.config?importDocuments({name:saved.name,config:saved.config}).journeys[0]:fieldStudies();
  if(!expression)throw new Error('The selected scene could not be migrated to the current engine.');
  scene=clone(expression.scenes[saved?.sceneIndex??0]??expression.scenes[0]);
  scene.field.params.count=Math.min(scene.field.params.count,state.particleLimit);
  savedView=saved;resize();
  signature=nextSignature;revision++;ready=false;
 }catch(error){canvas.dataset.phase='error';console.error(error);}
};
events.onerror=()=>{canvas.dataset.connection='reconnecting';};
function tick(now:number){
 raf=requestAnimationFrame(tick);
 const elapsed=now-last;
 if(!scene||elapsed<1000/fps-1)return;
 last=now;
 try{
  engine.render({scene,authoringRevision:revision,scaffold:'off',simTime:0,delta:Math.min(elapsed/1000,.05),params:scene.field.params,camera,pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]});
  canvas.dataset.phase='rendering';
  if(!ready){ready=true;window.dispatchEvent(new Event('physis-ready'));console.log('PHYSIS_ENGINE_READY');}
 }catch(error){canvas.dataset.phase='error: '+String(error);console.error(error);cancelAnimationFrame(raf);}
}
window.addEventListener('resize',resize);
window.addEventListener('pagehide',()=>{events.close();cancelAnimationFrame(raf);engine.dispose();});
raf=requestAnimationFrame(tick);
