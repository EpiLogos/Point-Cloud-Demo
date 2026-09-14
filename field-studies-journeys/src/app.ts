import {physisHost,installPhysis,saveDesktopCapture,type DesktopScene} from './physis';
import {applyPalette,applyBackground,invertPalette,applyChain,applyGlyph,applyKundaliniSequence,NATIVE_LAYOUTS} from './nativeFeatures';
import {COLOR_PALETTES,hexToRgb,isLightHex} from '../../src/engine/colorPalettes';
import {Journey,Scene,Entity,TextLayer,Tool,Shape,Vec3,clone,uid,clamp,fieldStudies,sevenCentres,smallLanguage,blankJourney,blankScene,entity,pin,chakraEntities,validateJourney} from './model.js';
import {DocumentStore,readLibrary,readLibraryDetailed,saveToLibrary,removeFromLibrary} from './store.js';
import {defaultCamera,project,unproject,facePlane,stageScale,stageCentre,basis,Camera} from './camera.js';
import {FieldEngineAdapter,EngineFrame} from './engine.js';
import {readPath} from '../../src/engine/automation';
import {paintPaper} from './paper';
import {ProductionAdapter} from './production.js';
import {importDocuments,nativeExport,nativeChakras,checkNativeLimits} from './nativeBridge.js';
import {baseValue,NATIVE_BINDINGS,nativeBinding,automationTarget,automationTargets,bindValue} from './nativeParameters.js';
import {inspectorHTML,InspectorContext} from './inspector.js';
import {PARAMETERS,parameter} from './registry.js';
import {evaluateParameters,phases,sequenceAt,focusAt,arrange,reorderFocus} from './timeline.js';
import {icon,esc} from './icons.js';
import {defaultCapture,CaptureSettings,CaptureTransition,download,slug,createOutput,paintCapture,paintNativeCapture,png,LiveRecorder,textLayout} from './capture.js';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
import {mountShell,iconButton as ib} from './shell.js';
import {OrbitControl} from './orbitControl.js';
import {railClick,RailItem} from './rail.js';
import {featuredExpressions,startingPoints,nativeSeven,forkExpression,libraryHTML,modesHTML,compositionCover} from './expressions.js';
mountShell();
const recovery=document.createElement('section');recovery.id='engine-recovery';recovery.hidden=true;recovery.className='engine-recovery';recovery.setAttribute('role','alert');recovery.innerHTML='<h3>GPU context interrupted</h3><p>The expression is intact. Recovering recreates lost particle state, not a runtime checkpoint.</p><button class="secondary" data-action="native-recover">Recover field</button>';document.body.append(recovery);

let initial:Journey=fieldStudies(),startupError='';
try{if(window.__JOURNEY__)initial=validateJourney(window.__JOURNEY__);else{try{const last=localStorage.getItem('oi.field-studies.last');const saved=readLibrary().find(j=>j.id===last);if(saved)initial=saved;}catch{/* An opaque or private origin must still open cleanly. */}}}catch(err){startupError=err instanceof Error?err.message:String(err);}
const store=new DocumentStore(initial);let engine:FieldEngineAdapter;
try{engine=window.OI_ENGINE_FACTORY?window.OI_ENGINE_FACTORY($<HTMLCanvasElement>('field-canvas')):new ProductionAdapter($<HTMLCanvasElement>('field-canvas'));}catch(err){$('stage').innerHTML='<p style="padding:110px 40px">The native WebGL field could not start. '+esc(err instanceof Error?err.message:err)+'</p>';throw err;}
let sceneIndex=0;let selected:string[]=[];let textId:string|null=null;let tab:InspectorContext['tab']='scene';let motionTab:InspectorContext['motionTab']='sequence';let stepIndex=0;let search='';let editing=false,inspectorOpen=false,timelineOpen=false,presenting=false,shapePickerOpen=false,tool:Tool='interact';let shapeChoice:Shape='text',glyphChoice='O';let camera=defaultCamera();let placementStep=false,keepPlacing=false,pinRepeat=false;
let width=innerWidth,height=innerHeight;let simTime=0,sceneElapsed=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,journeyPlaying=false;let lastTime=performance.now(),lastUI=0;let toastTimeout=0,saveTimeout=0;let transitionStart=0,transitionDuration=0;let transitionBackground='#f4f2eb',transitionSceneId='';let autosaveErrorShown=false;let captureSettings=defaultCapture();let recordPerformanceWarned=false;let currentVideo:{blob:Blob;mime:string;url:string;source:DesktopScene;settings:CaptureSettings}|null=null;let recordingSource:DesktopScene|null=null;let recordingSettings:CaptureSettings|null=null;const recorder=new LiveRecorder();
let pointer={active:false,world:{x:0,y:0,z:0}};let drag:null|{kind:'entity'|'radius'|'camera'|'text';id:string;startX:number;startY:number;startWorld:Vec3;positions:Map<string,Vec3>;initialRadius:number;cam:Camera;layer:TextLayer|null;pan:boolean}=null;
let guidesVisible=true;let sourceUploadEntityId:string|null=null;let overlayDirty=true,needsFrame=true;const detailState=new Map<string,boolean>();
let libraryOpen=false,librarySection:'collection'|'about'='collection',modesOpen=false,captureOpen=false;
let railKey:RailItem='interact',railExpanded=false;
const featured=featuredExpressions(),starters=startingPoints();
const covers=new Map<string,string>();
const sessionExpressions=new Map<string,Journey>();
const orbitControl=new OrbitControl($('orbit-control'),()=>camera,()=>{overlayDirty=true;needsFrame=true;},()=>{pointer.active=false;});
const scene=()=>store.document.scenes[sceneIndex]??store.document.scenes[0];
const selectedEntity=()=>scene().entities.find(e=>e.id===selected[0]);
const currentText=()=>scene().text.find(t=>t.id===textId)??scene().text[0];
function toast(message:string,duration=4200){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=window.setTimeout(()=>$('toast').hidden=true,duration);}
function error(err:unknown){console.error(err);toast(err instanceof Error?err.message:String(err),6500);}
const deletedLibraryIds=new Set<string>();
function markSaved(){clearTimeout(saveTimeout);if(deletedLibraryIds.has(store.document.id)){$('save-status').textContent='Saved copy removed · use Save to keep again';return;}$('save-status').textContent='Saving in this browser…';saveTimeout=window.setTimeout(()=>{try{if(!deletedLibraryIds.has(store.document.id))saveToLibrary(store.document);localStorage.setItem('oi.field-studies.last',store.document.id);$('save-status').textContent='Saved in this browser';}catch{$('save-status').textContent='Not saved · export a file';if(!autosaveErrorShown){toast('Browser storage is unavailable or full. Use Library → Export expression to preserve your work.',7000);autosaveErrorShown=true;}}},350);}
function changed(fn:()=>void,render=true){store.change(fn);markSaved();overlayDirty=true;needsFrame=true;if(render)renderAll();}
function sanitiseSelection(){sceneIndex=clamp(sceneIndex,0,store.document.scenes.length-1);selected=selected.filter(id=>scene().entities.some(e=>e.id===id));if(!scene().text.some(t=>t.id===textId))textId=scene().text[0]?.id??null;const e=selectedEntity();stepIndex=clamp(stepIndex,0,Math.max(0,(e?.sequence.steps.length??1)-1));}
let paperSignature='';
function paintLivePaper(s:Scene){const signature=JSON.stringify([width,height,s.field.background,s.field.palette,s.engine.backgroundMode,s.field.params.grain,s.field.params.native_backgroundGlowIntensity]);if(signature===paperSignature)return;paperSignature=signature;const canvas=$<HTMLCanvasElement>('paper-canvas');canvas.width=width;canvas.height=height;paintPaper(canvas.getContext('2d')!,s,width,height);}
function theme(){const s=scene(),hex=s.field.background;document.documentElement.style.setProperty('--paper',hex);document.documentElement.style.setProperty('--ink',s.field.palette[0]);const vals=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));document.body.classList.toggle('night',(vals[0]*.2126+vals[1]*.7152+vals[2]*.0722)<100);$('grain').style.opacity='0';paintLivePaper(s);document.title=`${physisHost()?'Physis · ':''}${s.name} — ${store.document.name} · O:I Expressions`;}
function renderText(){const s=scene();$('text-layers').innerHTML=s.text.map(t=>{const l=textLayout(t,width,height);return `<article class="page-text ${t.id===textId?'selected':''}" data-text-id="${t.id}" ${t.visible?'':'hidden'} style="left:${t.x*100}%;top:${t.y*100}%;width:${l.width}px;text-align:${t.align};"><div class="kicker">${esc(t.kicker)}</div><h1 style="font-size:${l.size}px">${esc(t.title)}${t.italic?`<em>${esc(t.italic)}</em>`:''}</h1><p>${esc(t.body)}</p></article>`;}).join('');}
function renderInspector(){if(!inspectorOpen)return;if(tab==='motion'&&motionTab==='sequence'&&selectedEntity()?.kind!=='formation'){const form=scene().entities.find(e=>e.kind==='formation');if(form)selected=[form.id];}const content=$('inspector-content'),scroll=content.scrollTop;content.querySelectorAll<HTMLDetailsElement>('details[data-detail]').forEach(d=>detailState.set(d.dataset.detail!,d.open));
 const ctx:InspectorContext={scene:scene(),journey:store.document,selected,textId,tab,motionTab,stepIndex,preview:engine.capabilities.kind==='preview',search,supported:[...engine.capabilities.parameters],stations:engine.stations?.()};$('inspector').classList.toggle('is-motion',tab==='motion');content.innerHTML=inspectorHTML(ctx);content.querySelectorAll<HTMLDetailsElement>('details[data-detail]').forEach(d=>{if(detailState.has(d.dataset.detail!))d.open=detailState.get(d.dataset.detail!)!;});content.scrollTop=scroll;
$('inspector-title').textContent=tab==='scene'?'Scene settings':tab==='objects'?'Object settings':tab==='field'?'Field settings':'Motion and rhythm';
 document.querySelectorAll<HTMLButtonElement>('[data-action="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.value===tab)));
 $('control-search').setAttribute('value',search);
}
function thumbnail(s:Scene){const forms=s.entities.filter(e=>e.kind==='formation');if(forms.length>4)return '⁙';return forms.map(e=>e.shape==='ring'?'◯':e.shape==='triangle'?'△':e.shape==='square'?'▧':e.shape==='disc'?'●':e.text).join('').slice(0,5)||'+';}
function renderTimeline(){if(!timelineOpen)return;const s=scene();$('timeline-panel').innerHTML=`<div class="timeline-heading"><div><strong>${esc(store.document.name)}</strong><p>${store.document.scenes.length} named scenes · ${Math.round(store.document.scenes.reduce((n,s)=>n+s.duration,0))} seconds · ${journeyPlaying?'expression running':'scene held'}</p></div><div class="button-row"><button class="secondary" data-action="journey-settings">Expression settings</button>${ib('close-timeline','close','Close scene strip')}</div></div><div class="scene-strip">${store.document.scenes.map((s,i)=>`<div class="scene-card ${i===sceneIndex?'active':''}" draggable="${editing}" data-scene-index="${i}"><button class="scene-thumb" data-action="choose-scene" data-index="${i}" aria-label="Open scene ${i+1}: ${esc(s.name)}" style="--swatch-paper:${s.field.background};--swatch-ink:${s.field.palette[0]}"><span>${esc(thumbnail(s))}</span>${s.text.some(t=>t.visible)?`<small>${esc(s.text[0]?.title??'')}</small>`:''}</button><div class="scene-card-name"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(s.name)}</strong><small>${s.duration}s</small></div>${editing?`<div class="scene-order"><button data-action="move-scene-left" data-index="${i}" aria-label="Move ${esc(s.name)} earlier">←</button><button data-action="duplicate-scene" data-index="${i}" aria-label="Duplicate ${esc(s.name)}">${icon('copy')}</button><button data-action="delete-scene" data-index="${i}" aria-label="Remove ${esc(s.name)}">${icon('trash')}</button><button data-action="move-scene-right" data-index="${i}" aria-label="Move ${esc(s.name)} later">→</button></div>`:''}<div class="scene-progress"><i data-scene-progress="${i}"></i></div></div>`).join('')}<button class="scene-add" data-action="new-scene">${icon('plus')}New scene</button></div>`;}
function renderShapePicker(){if(!shapePickerOpen)return;$('shape-picker').innerHTML=`<h3>Choose a form</h3><div class="shape-choices">${[['text','O','Glyph'],['ring','◯','Ring'],['disc','●','Disc'],['triangle','△','Triangle'],['square','□','Plane'],['text','&','Character']].map(([s,g,l])=>`<button data-action="choose-shape" data-value="${s}" data-glyph="${esc(g)}" class="${shapeChoice===s&&((s==='text'&&glyphChoice===g)||s!=='text')?'active':''}">${esc(g)}<small>${l}</small></button>`).join('')}</div>${shapeChoice==='text'?`<label class="control"><span>Your glyph or word</span><input id="placement-glyph" value="${esc(glyphChoice)}" maxlength="120" aria-label="Formation to place"></label>`:''}<p>Pick a point and set the form anchor. The working plane keeps your depth consistent.</p><label class="toggle-row" style="margin-top:15px;margin-bottom:0"><span>Keep placing</span><input id="keep-placing" type="checkbox" ${keepPlacing?'checked':''}><i></i></label>`;}
function setHint(){let h='';if(placementStep)h=`Place link ${stepIndex+1} on the working plane.<button data-action="cancel-placement">Cancel</button>`;else if(tool==='pin')h=`Click to place one attractor.<button data-action="repeat-pins" aria-pressed="${pinRepeat}">${pinRepeat?'✓ Keep placing':'Keep placing'}</button>`;else if(tool==='formation')h='Choose a form, then click where it belongs.';else if(tool==='text')h='Drag text blocks and adjust wording in Scene settings.';
 $('tool-hint').innerHTML=h;$('tool-hint').hidden=!h||!editing||!railExpanded;$('stage').style.cursor=tool==='select'?'default':tool==='orbit'?'grab':'crosshair';}
function renderAll(){sanitiseSelection();if(railKey!=='objects'||tool!=='select')railKey=tool;if(transitionDuration&&transitionSceneId!==scene().id){transitionDuration=0;$('transition-canvas').hidden=true;}theme();document.body.classList.toggle('editing',editing);document.body.classList.toggle('presentation',presenting);document.body.classList.toggle('editing-text',editing&&tool==='text');
 $('inspector').hidden=!inspectorOpen||!editing;$('tool-rail').hidden=presenting;$('view-controls').hidden=!editing||!railExpanded||tool==='orbit'||tool==='interact';$('coordinates').hidden=presenting||libraryOpen;$('timeline-panel').hidden=!timelineOpen;$('shape-picker').hidden=!shapePickerOpen||!editing;$('present-return').hidden=!presenting;
 $('scene-number').textContent=String(sceneIndex+1).padStart(2,'0');$('scene-name').textContent=scene().name;
 $('scene-picker').setAttribute('aria-expanded',String(timelineOpen));$('edit-button').setAttribute('aria-expanded',String(editing));
 document.querySelectorAll<HTMLButtonElement>('[data-rail]').forEach(b=>{const active=b.dataset.rail===(tool==='interact'?'interact':railKey);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});document.querySelectorAll('[data-action="grid"]').forEach(b=>b.classList.toggle('active',camera.grid));document.querySelectorAll('[data-action="snap"]').forEach(b=>b.classList.toggle('active',camera.snap));document.querySelectorAll('[data-action="view-2d"]').forEach(b=>b.classList.toggle('active',camera.mode==='2d'));document.querySelectorAll('[data-action="view-3d"]').forEach(b=>b.classList.toggle('active',camera.mode==='3d'));$<HTMLSelectElement>('working-plane').value=camera.plane;$<HTMLInputElement>('working-depth').value=String(camera.depth);$('depth-axis').textContent=camera.plane==='XY'?'Z':camera.plane==='XZ'?'Y':'X';
 document.querySelectorAll<HTMLButtonElement>('[data-action="undo"]').forEach(b=>b.disabled=!store.undoStack.length);document.querySelectorAll<HTMLButtonElement>('[data-action="redo"]').forEach(b=>b.disabled=!store.redoStack.length);
 document.body.classList.toggle('library-open',libraryOpen);
 $('library-page').hidden=!libraryOpen;$('stage').inert=libraryOpen;
 document.querySelectorAll<HTMLElement>('.chrome,#inspector,#shape-picker').forEach(el=>el.inert=libraryOpen);
 $('modes-panel').hidden=!modesOpen||libraryOpen;$('capture-panel').hidden=!captureOpen||libraryOpen;
 document.querySelector('[data-action="modes"]')?.setAttribute('aria-expanded',String(modesOpen));
 document.querySelector('[data-action="capture-options"]')?.setAttribute('aria-expanded',String(captureOpen));
 if(libraryOpen)renderLibrary();
 renderText();renderInspector();renderTimeline();renderShapePicker();setHint();transportUI();orbitControl.render();overlayDirty=true;needsFrame=true;
}
function transportUI(){
 const b=$('play-button');b.innerHTML=icon(playing?'pause':'play');b.setAttribute('aria-label',playing?'Pause motion (Space)':'Resume motion (Space)');b.title=playing?'Pause motion (Space)':'Resume motion (Space)';
 $('journey-play').classList.toggle('active',journeyPlaying);$('journey-play').setAttribute('aria-pressed',String(journeyPlaying));$('journey-play').title=journeyPlaying?'Hold this scene':'Play expression';$('journey-play').setAttribute('aria-label',$('journey-play').title);
 $('record-button').classList.toggle('recording',recorder.active);$('record-button').setAttribute('aria-pressed',String(recorder.active));$('record-button').title=recorder.active?'Stop recording':'Record video';$('record-button').setAttribute('aria-label',$('record-button').title);
}
function edit(open=true,newTab:InspectorContext['tab']=tab){pointer.active=false;editing=open;inspectorOpen=open;tab=newTab;railExpanded=open;
 if(open){journeyPlaying=false;if(tool==='interact')tool='select';railKey=tool;}
 else{tool='interact';railKey='interact';shapePickerOpen=false;placementStep=false;selected=[];}renderAll();}
function toolTo(next:Tool){
 pointer.active=false;editing=next!=='interact';journeyPlaying=false;tool=next;placementStep=false;shapePickerOpen=next==='formation';railKey=next;railExpanded=next!=='interact';timelineOpen=false;
 inspectorOpen=next==='select'||next==='text';tab=next==='text'?'scene':'objects';
 if(next==='interact'){selected=[];shapePickerOpen=false;}
 if(next==='pin')pinRepeat=false;
 if(next==='text')textId=currentText()?.id??null;
 if(next==='orbit'&&camera.mode==='2d'){camera.mode='3d';camera.yaw=-.32;camera.pitch=.20;}
 renderAll();
}
function activateRail(next:RailItem){
 const result=railClick(railKey,next,railExpanded);
 if(result==='interact'){toolTo('interact');return;}
 if(result==='close'){pointer.active=false;railExpanded=false;inspectorOpen=false;shapePickerOpen=false;timelineOpen=false;renderAll();return;}
 toolTo(next==='objects'?'select':next);railKey=next;railExpanded=true;
 if(next==='pin'||next==='formation')camera.grid=true;
 renderAll();
}
function applySceneView(){const v=scene().view;if(v){camera.mode=v.mode;camera.yaw=v.yaw;camera.pitch=v.pitch;camera.zoom=v.zoom;camera.panX=v.panX*width;camera.panY=v.panY*height;if(v.nativeCamera){const c=v.nativeCamera;camera.yaw=-c.yaw;camera.pitch=c.pitch;camera.mode=c.yaw||c.pitch?'3d':'2d';camera.zoom=c.zoom*400/stageScale(width,height);const {a,b}=basis(camera),o=stageCentre(width,height);camera.panX=width/2-o.x-c.zoom*(a[0]*c.panX+a[1]*c.panY);camera.panY=height/2-o.y+c.zoom*(b[0]*c.panX+b[1]*c.panY);}}}
function setScene(index:number,automatic=false){pointer.active=false;if(index<0)index=store.document.scenes.length-1;if(index>=store.document.scenes.length)index=0;if(index===sceneIndex&&!automatic)return;
 if(playing&&store.document.scenes[index].transition>0&&engine.capabilities.kind==='preview'){const c=$<HTMLCanvasElement>('transition-canvas');c.width=engine.canvas.width;c.height=engine.canvas.height;c.getContext('2d')!.drawImage(engine.canvas,0,0);transitionBackground=scene().field.background;c.style.background=transitionBackground;c.style.opacity='1';c.hidden=false;transitionStart=simTime;transitionDuration=store.document.scenes[index].transition;transitionSceneId=store.document.scenes[index].id;}else{transitionDuration=0;$('transition-canvas').hidden=true;}

 sceneIndex=index;applySceneView();sceneElapsed=0;selected=[];textId=scene().text[0]?.id??null;placementStep=false;shapePickerOpen=false;if(!automatic)journeyPlaying=false;renderAll();}
function selectEntity(id:string,multi=false){pointer.active=false;railKey='select';railExpanded=true;if(multi){selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];}else selected=[id];editing=true;inspectorOpen=true;tab='objects';tool='select';shapePickerOpen=false;journeyPlaying=false;stepIndex=0;renderAll();}
function pathTarget(path:string):{root:any;keys:string[]} {const s=scene();if(path.startsWith('journey.'))return{root:store.document,keys:path.slice(8).split('.')};if(path.startsWith('entity.'))return{root:selectedEntity(),keys:path.slice(7).split('.')};if(path.startsWith('text.'))return{root:currentText(),keys:path.slice(5).split('.')};if(path.startsWith('step.'))return{root:selectedEntity()?.sequence.steps[stepIndex],keys:path.slice(5).split('.')};if(path.startsWith('lane.')){const lane=s.automation.find(l=>path.startsWith('lane.'+l.id+'.'));return{root:lane,keys:lane?path.slice(lane.id.length+6).split('.'):[]};}return{root:s,keys:path.split('.')};}
function applyBinding(el:HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement,continuous=false){
 const path=el.dataset.bind;if(!path)return;const {root,keys}=pathTarget(path);if(!root||keys.some(k=>['__proto__','constructor','prototype'].includes(k)))return;
 if((path.startsWith('entity.')||path.startsWith('step.'))&&selectedEntity()?.locked&&path!=='entity.locked'){toast('Unlock this entity to edit it. Its sequence is still running.');renderInspector();return;}
 let target=root;for(const key of keys.slice(0,-1))target=target[key]??(target[key]={});const key=keys.at(-1)!;
 let value:any=el instanceof HTMLInputElement&&el.type==='checkbox'?el.checked:el.value;
 if(el instanceof HTMLInputElement&&(el.type==='number'||el.type==='range')){
  value=Number(el.value);if(!Number.isFinite(value)){toast('Enter a finite number.');return;}
  if(el.type==='range'&&el.dataset.logMin){const a=Number(el.dataset.logMin),b=Number(el.dataset.logMax);value=a*Math.pow(b/a,value);const step=Number(el.dataset.valueStep)||.0001;value=Math.round(value/step)*step;}
  else value=clamp(value,el.min!==''?Number(el.min):-1e8,el.max!==''?Number(el.max):1e8);
 }
 if(path.endsWith('.templateGeometry')||path.endsWith('.templateDimension'))value=value||undefined;
 if(path==='entity.station')value=value==='none'?null:Number(value);
 if(path==='entity.text'||path==='step.text')value=value.trim()||'O';
 if(el instanceof HTMLInputElement&&el.type==='color'&&!/^#[\da-f]{6}$/i.test(String(value)))return;
 store.begin();target[key]=value;if(path==='field.params.native_composition__orchestration__focusTintWeight'&&Number(value)>0)scene().composition.carryTint=true;
 if(path==='step.hold')target.holdOverride=true;if(path==='step.transition')target.transitionOverride=true;
 if(path==='entity.text'){const e=selectedEntity();if(e&&e.sequence.steps.length===1&&!e.sequence.enabled)e.sequence.steps[0].text=value;}
 if(path==='composition.frequencyDriver'&&value!=='automation'){for(const l of scene().automation)if(l.target==='field.frequency')l.enabled=false;}
 if(continuous){markSaved();overlayDirty=true;needsFrame=true;document.querySelectorAll<HTMLInputElement>('[data-bind]').forEach(other=>{if(other.dataset.bind!==path||other===el)return;if(other.type==='number')other.value=String(value);if(other.type==='range'){const a=Number(other.dataset.logMin),b=Number(other.dataset.logMax);const v=a&&b?Math.log(Number(value)/a)/Math.log(b/a):Number(value);other.value=String(v);other.style.setProperty('--fill',`${clamp((v-Number(other.min))/(Number(other.max)-Number(other.min)),0,1)*100}%`);}});theme();}
 else{store.finish();markSaved();renderAll();}
}

function modalCloseButton(){return `<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>`;}
function preset(value:string){return value==='seven-centres'?nativeSeven():value==='small-language'?smallLanguage():fieldStudies();}
function hasLegacyLibrary(){try{return !!localStorage.getItem('typographic_pointcloud_saved_states');}catch{return false;}}
function rememberCover(){try{engine.render(frameData(0));if(!engine.capture)return;const out=document.createElement('canvas');out.width=560;out.height=350;paintNativeCapture(out,engine.capture(560,350),scene(),{...captureSettings,transparent:false,includeText:true},width,height);covers.set(store.document.id,out.toDataURL('image/webp',.8));}catch{/* Gallery fallback is a static composition preview, not a substitute engine. */}}
let coverObserver:IntersectionObserver|null=null;
function renderLibrary(){coverObserver?.disconnect();const library=readLibraryDetailed(),scroll=$('library-page').scrollTop;const saved=Array.from(new Map([...library.journeys,...sessionExpressions.values()].map(j=>[j.id,j])).values());
 $('library-page').innerHTML=libraryHTML({current:store.document,saved,featured,starters,section:librarySection,errors:library.blocked?['Browser storage is unavailable here. Export an expression to keep a portable copy.']:library.errors,legacy:hasLegacyLibrary(),cover:j=>covers.get(j.id)});$('library-page').scrollTop=scroll;
 const documents=new Map([...featured,...saved,store.document,...starters.map(p=>p.expression)].map(j=>[j.id,j]));
 const paint=(image:HTMLImageElement)=>{const j=documents.get(image.dataset.previewId!);if(j){image.src=compositionCover(j.scenes[0]);image.removeAttribute('data-preview-id');}};
 const images=$('library-page').querySelectorAll<HTMLImageElement>('img[data-preview-id]');
 if(typeof IntersectionObserver==='undefined')images.forEach(paint);
 else{coverObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){paint(entry.target as HTMLImageElement);coverObserver?.unobserve(entry.target);}},{root:$('library-page'),rootMargin:'160px'});images.forEach(image=>coverObserver!.observe(image));}
}
function openLibrary(section:'collection'|'about'='collection',navigate=true){
 if(!libraryOpen)rememberCover();
 pointer.active=false;modesOpen=false;captureOpen=false;librarySection=section;libraryOpen=true;
 if(recorder.active){recorder.stop();toast('Recording stopped before opening the library.');}
 if(navigate)try{history.pushState({oiLibrary:true},'', '#library'+(section==='about'?'/about':''));}catch{}
 renderAll();$('library-page').focus({preventScroll:true});
}
function closeLibrary(navigate=true){coverObserver?.disconnect();libraryOpen=false;pointer.active=false;lastTime=performance.now();
 if(navigate)try{history.replaceState(null,'',location.pathname+location.search);}catch{}
 renderAll();$('stage').focus({preventScroll:true});
}
window.addEventListener('popstate',()=>{if(location.hash.startsWith('#library'))openLibrary(location.hash.includes('about')?'about':'collection',false);else closeLibrary(false);});
/** Import is additive. A different version with the same ID becomes a variation. */
function collectImported(documents:Journey[]){
 const existing=new Map([...readLibrary(),...sessionExpressions.values(),store.document].map(j=>[j.id,j]));
 const content=(j:Journey)=>JSON.stringify({...j,updatedAt:''});
 for(const original of documents){let j=clone(original);const prior=existing.get(j.id);
  if(prior&&content(prior)!==content(j)){j=forkExpression(j);j.name+=' / imported';}
  sessionExpressions.set(j.id,j);existing.set(j.id,j);
  try{saveToLibrary(j);}catch{/* Retain the imported document in-session without changing its source. */}
 }
}
function ensureCapacity(additions:Entity[]){const all=[...scene().entities,...additions];if(all.filter(e=>e.kind==='formation').length>10||all.filter(e=>e.kind==='pin').length>8)throw new Error('The native field supports 10 formations and 8 force-only pins. Remove an object before adding this composition.');}
function loadJourney(j:Journey){j.scenes.forEach(checkNativeLimits);sessionExpressions.set(store.document.id,clone(store.document));sessionExpressions.set(j.id,clone(j));try{if(!deletedLibraryIds.has(store.document.id))saveToLibrary(store.document);}catch{toast('The previous expression is retained in Undo; browser storage is unavailable. Export it before closing this page.',6500);}store.replace(j);store.document.updatedAt=j.updatedAt;sceneIndex=0;selected=[];camera=defaultCamera();applySceneView();transitionDuration=0;$('transition-canvas').hidden=true;sceneElapsed=0;journeyPlaying=false;editing=false;inspectorOpen=false;timelineOpen=false;tool='interact';railKey='interact';railExpanded=false;shapePickerOpen=false;closeDialogs();libraryOpen=false;modesOpen=false;try{history.replaceState(null,'',location.pathname+location.search);}catch{}markSaved();renderAll();}
function openKeep(){captureOpen=!captureOpen;modesOpen=false;pointer.active=false;
 if(captureOpen){$('capture-panel').innerHTML=`<header><h3>Capture</h3>${ib('capture-options','close','Close capture options')}</header><div class="two-col"><label class="control"><span>Output size</span><select id="capture-width"><option value="1280">1280</option><option value="1440">1440</option><option value="1920">1920</option><option value="3840">3840 · PNG</option></select></label><label class="control"><span>Frame</span><select id="capture-aspect"><option value="stage">Current stage</option><option value="16:9">16:9</option><option value="1:1">1:1</option><option value="9:16">9:16</option></select></label></div><label class="toggle-row"><span>Include page text</span><input id="capture-text" type="checkbox" ${captureSettings.includeText?'checked':''}><i></i></label><label class="toggle-row"><span>Transparent PNG</span><input id="capture-transparent" type="checkbox" ${captureSettings.transparent?'checked':''}><i></i></label><p class="control-note">Clean artwork only. Aspect changes centre-crop the current view. Silent live video requests 30 fps; 2-minute / 128 MB limit.</p>`;
 $<HTMLSelectElement>('capture-width').value=String(captureSettings.width);$<HTMLSelectElement>('capture-aspect').value=captureSettings.aspect;}
 renderAll();}
function readCapture(){if(!$('capture-width'))return;captureSettings.width=Number($<HTMLSelectElement>('capture-width').value);captureSettings.aspect=$<HTMLSelectElement>('capture-aspect').value as CaptureSettings['aspect'];captureSettings.includeText=$<HTMLInputElement>('capture-text').checked;captureSettings.transparent=$<HTMLInputElement>('capture-transparent').checked;}
function openAbout(){openLibrary('about');}
function closeDialogs(){document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>d.close());}
let confirmCallback:(()=>void)|null=null;
function confirmChange(title:string,body:string,callback:()=>void){confirmCallback=callback;$('confirm-dialog').innerHTML=`${modalCloseButton()}<p class="eyebrow">A DELIBERATE CHANGE</p><h2>${esc(title)}</h2><p class="intro">${esc(body)}</p><div class="confirm-row"><button class="secondary" data-action="close-dialog">Cancel</button><button class="primary" data-action="confirm">Continue</button></div>`;$<HTMLDialogElement>('confirm-dialog').showModal();}
async function exportArtifact(){let style=document.getElementById('shell-style')?.textContent,bundle=document.getElementById('app-bundle')?.textContent;
 if(!style||!bundle){const response=await fetch(new URL('./field-studies.html',location.href));if(!response.ok)throw new Error('The portable engine bundle is missing. Build the application before exporting a living artifact.');const source=new DOMParser().parseFromString(await response.text(),'text/html');style=source.getElementById('shell-style')?.textContent;bundle=source.getElementById('app-bundle')?.textContent;}
 if(!style||!bundle)throw new Error('The portable engine bundle was invalid; no incomplete artifact was exported.');
 const j=JSON.stringify(store.document).replace(/</g,'\\u003c');const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="A living, editable O:I expression."><title>${esc(store.document.name)} · O:I Expressions</title><style id="shell-style">${style}</style></head><body><div id="app"></div><script>window.__JOURNEY__=${j};window.__START_PRESENTATION__=true;<\/script><script id="app-bundle">${bundle.replace(/<\/script/gi,'<\\/script')}<\/script></body></html>`;
 download(new Blob([html],{type:'text/html'}),slug(store.document.name)+'.html');toast('A self-contained expression: open the HTML file in a browser.');}
function captureTransition():CaptureTransition|undefined{if(engine.capabilities.kind==='production')return undefined;return transitionDuration>0?{canvas:$<HTMLCanvasElement>('transition-canvas'),alpha:1-clamp((simTime-transitionStart)/Math.max(.01,transitionDuration),0,1),background:transitionBackground}:undefined;}
async function captureImage(){readCapture();engine.render(frameData(0));const out=createOutput(captureSettings,width,height);if(!engine.capture)throw new Error('This renderer does not support native-resolution capture.');const pixels=engine.capture(out.width,out.height);paintNativeCapture(out,pixels,{...scene(),field:{...scene().field,background:engine.telemetry?.()?.background??scene().field.background,palette:engine.telemetry?.()?.palette??scene().field.palette,params:{...scene().field.params,...engine.telemetry?.()?.params}}},captureSettings,width,height);const blob=await png(out),name=slug(scene().name)+'.png';if(await saveDesktopCapture(blob,name,desktopSource(),{...captureSettings,width:out.width,height:out.height}))toast('Image saved to the Physis library.');else{download(blob,name);toast(`Captured ${out.width} × ${out.height} native pixels, without resetting the field.`);}}
function startRecording(){if(recorder.active){recorder.stop();return;}recordingSource=desktopSource();readCapture();captureSettings.width=Math.min(captureSettings.width,engine.canvas.width,1920);recordingSettings={...captureSettings};recordPerformanceWarned=false;if(!playing){playing=true;transportUI();}const start=()=>recorder.start(engine.canvas,scene(),captureSettings,width,height,captureTransition());if(engine.withCleanFrame)engine.withCleanFrame(start);else start();closeDialogs();captureOpen=false;renderAll();$('recording-badge').hidden=false;$('record-size').textContent=`${captureSettings.width}px · 30 fps target`;toast('Recording the clean scene. Perform, play the expression, then stop.',3300);}
recorder.onStop=(blob,mime)=>{transportUI();$('recording-badge').hidden=true;if(currentVideo)URL.revokeObjectURL(currentVideo.url);currentVideo={blob,mime,url:URL.createObjectURL(blob),source:recordingSource??desktopSource(),settings:recordingSettings??captureSettings};$('video-dialog').innerHTML=`${modalCloseButton()}<p class="eyebrow">A PERFORMANCE, KEPT</p><h2>Let it play<br><em>once more.</em></h2><video id="recording-review" preload="auto" controls playsinline style="width:100%;border-radius:8px" src="${currentVideo.url}"></video><p class="capture-footnote">${mime.split(';')[0]} · ${(blob.size/1024/1024).toFixed(1)} MB · silent live capture</p><div class="button-row"><button class="primary" data-action="save-video">${icon('download')} Save recording</button><button class="secondary" data-action="close-dialog">Return to the field</button></div>`;$<HTMLDialogElement>('video-dialog').showModal();};recorder.onError=err=>{transportUI();$('recording-badge').hidden=true;error(err);};recorder.onLimit=m=>toast(m,6500);
function addLane(target='field.dispersion'){if(!target.startsWith('field.')&&!target.startsWith('entity:'))target='field.'+target;const p=automationTarget(scene(),target);if(!p||!Number.isFinite(p.value))return;editing=true;inspectorOpen=true;tab='motion';motionTab='automation';if(scene().automation.some(l=>l.target===target)){renderAll();return;}
 const span=(p.max-p.min)*.1,low=clamp(p.value-span,p.hardMin,p.hardMax),high=clamp(p.value+span,p.hardMin,p.hardMax);
 changed(()=>{scene().automation.push({id:uid('lane'),enabled:true,target,type:'lfo',wave:'sine',min:low,max:high,rate:.08,phase:0,blend:'replace',duration:4,delay:0,loop:'once',firedAt:null});if(target==='field.frequency')scene().composition.frequencyDriver='automation';});}
function duplicateEntity(){const list=scene().entities.filter(e=>selected.includes(e.id));if(!list.length)return;ensureCapacity(list);changed(()=>{selected=list.map(e=>{const n=clone(e);n.id=uid('entity');n.name+=' copy';n.position.x+=.12;n.position.y-=.12;n.locked=false;n.sequence.steps.forEach(k=>k.id=uid('step'));scene().entities.push(n);return n.id;});});}
function deleteEntities(){const ids=selected.filter(id=>!scene().entities.find(e=>e.id===id)?.locked);if(!ids.length){toast('Unlock a selected entity before removing it.');return;}changed(()=>{scene().entities=scene().entities.filter(e=>!ids.includes(e.id));selected=[];});toast('Removed. Undo restores the configuration.');}
function reorderScene(from:number,to:number){if(to<0||to>=store.document.scenes.length)return;const currentId=scene().id;changed(()=>{const [item]=store.document.scenes.splice(from,1);store.document.scenes.splice(to,0,item);sceneIndex=store.document.scenes.findIndex(s=>s.id===currentId);});}
async function action(name:string,el:HTMLElement,event?:Event){const s=scene(),e=selectedEntity();switch(name){
 case 'native-palette':changed(()=>applyPalette(s,el.dataset.id!));break;
 case 'native-paper-harmonize':changed(()=>{const [r,g,b]=hexToRgb(s.field.palette[0]);s.field.background='#'+[Math.max(3,Math.floor(r*.07)),Math.max(3,Math.floor(g*.07)),Math.max(8,Math.floor(b*.12))].map(n=>n.toString(16).padStart(2,'0')).join('');s.engine.backgroundMode='ambientGlow';s.engine.inkMode='whiteOnBlack';const binding=NATIVE_BINDINGS.find(b=>b.path==='backgroundGlowIntensity');if(binding)bindValue(s,binding.bind,.65);});break;
 case 'native-paper-invert':changed(()=>{s.field.background=isLightHex(s.field.background)?'#09090b':'#fafaf9';s.engine.inkMode=isLightHex(s.field.background)?'blackOnWhite':'whiteOnBlack';});break;
 case 'native-paper':changed(()=>applyBackground(s,el.dataset.id!));break;
 case 'native-palette-invert':changed(()=>invertPalette(s));break;
 case 'native-palette-random':changed(()=>{applyPalette(s,COLOR_PALETTES[Math.floor(Math.random()*COLOR_PALETTES.length)].id);});break;
 case 'native-glyph':if(e)changed(()=>applyGlyph(e,el.dataset.prefix==='step'?stepIndex:null,el.dataset.value!));break;
 case 'native-chain':if(e)changed(()=>{applyChain(e,el.dataset.id!);stepIndex=0;});break;
 case 'native-kundalini-sequence':if(e)changed(()=>{applyKundaliniSequence(e);stepIndex=0;});break;
 case 'native-layout':{const entities=s.entities.filter(v=>selected.includes(v.id)&&!v.locked&&v.kind==='formation'),layout=NATIVE_LAYOUTS[el.dataset.value!];if(layout)changed(()=>{const axes=s.composition.plane==='XZ'?['x','z']:s.composition.plane==='YZ'?['y','z']:['x','y'];layout(entities.length).forEach((pos,i)=>{entities[i].position[axes[0] as keyof Vec3]=pos.x/400;entities[i].position[axes[1] as keyof Vec3]=pos.y/400;});s.composition.layout='native-'+el.dataset.value;});break;}
 case 'native-disperse':engine.command?.({type:'disperse',strength:3});needsFrame=true;break;
 case 'native-reset-phases':engine.command?.({type:'reset-phases'});needsFrame=true;break;
 case 'native-reset':confirmChange('Reset the particle field?','This deliberately reseeds particle positions and resets morph phases. The expression and its settings are preserved.',()=>{engine.command?.({type:'reset-field'});needsFrame=true;});break;
 case 'native-recover':engine.command?.({type:'recover-context'});recovery.hidden=true;needsFrame=true;break;
 case 'delete-saved':{const id=el.dataset.id!;confirmChange('Remove this saved copy?','Only this understood saved expression is removed. Other saved and unreadable entries are retained. The active expression remains open.',()=>{removeFromLibrary(id);deletedLibraryIds.add(id);clearTimeout(saveTimeout);sessionExpressions.delete(id);covers.delete(id);renderLibrary();});break;}

 case 'edit':edit(!editing);break;
 case 'close-inspector':inspectorOpen=false;railExpanded=false;renderAll();break;
 case 'tab':tab=el.dataset.value as InspectorContext['tab'];search='';$<HTMLInputElement>('control-search').value='';if(tab==='motion'&&motionTab==='sequence'&&!e){const f=s.entities.find(x=>x.kind==='formation');if(f)selected=[f.id];}renderAll();$('inspector-content').scrollTop=0;break;
 case 'objects':activateRail('objects');break;
 case 'tool-select':case 'tool-interact':case 'tool-pin':case 'tool-formation':case 'tool-text':case 'tool-orbit':activateRail(name.slice(5) as Tool);break;
 case 'view-2d':camera.mode='2d';facePlane(camera);renderAll();break;
 case 'view-3d':camera.mode='3d';camera.yaw=-.42;camera.pitch=.25;renderAll();break;
 case 'guides':guidesVisible=!guidesVisible;renderAll();break;
 case 'grid':camera.grid=!camera.grid;renderAll();break;
 case 'snap':camera.snap=!camera.snap;renderAll();break;
 case 'face-plane':facePlane(camera);renderAll();break;
 case 'keep-view':changed(()=>{scene().view={...scene().view,mode:camera.mode,yaw:camera.yaw,pitch:camera.pitch,zoom:camera.zoom,panX:camera.panX/width,panY:camera.panY/height};});toast('This camera framing is now part of the scene.');break;
 case 'restore-view':applySceneView();renderAll();break;
 case 'fit-view':{const {plane,depth,grid,snap}=camera;camera=defaultCamera();Object.assign(camera,{plane,depth,grid,snap});facePlane(camera);renderAll();break;}
 case 'timeline':timelineOpen=!timelineOpen;renderAll();break;
 case 'open-timeline':timelineOpen=true;renderAll();break;
 case 'close-timeline':timelineOpen=false;renderAll();break;
 case 'previous':setScene(sceneIndex-1);break;case 'next':setScene(sceneIndex+1);break;
 case 'choose-scene':setScene(Number(el.dataset.index));break;
 case 'toggle-play':playing=!playing;transportUI();break;
 case 'play-journey':journeyPlaying=!journeyPlaying;if(journeyPlaying){playing=true;editing=false;inspectorOpen=false;timelineOpen=false;selected=[];tool='interact';shapePickerOpen=false;placementStep=false;}renderAll();break;
 case 'present':presenting=true;selected=[];shapePickerOpen=false;renderAll();break;
 case 'exit-present':presenting=false;renderAll();break;
 case 'library':case 'preset-browser':case 'keep':openLibrary();break;
 case 'capture-options':readCapture();openKeep();break;case 'about':openAbout();break;
 case 'close-library':closeLibrary();break;
 case 'library-section':librarySection=el.dataset.section as 'collection'|'about';renderLibrary();$('library-page').scrollTop=0;break;
 case 'modes':modesOpen=!modesOpen;captureOpen=false;pointer.active=false;if(modesOpen)$('modes-panel').innerHTML=modesHTML(starters);renderAll();break;
 case 'start-mode':{const item=starters.find(p=>p.id===el.dataset.id);if(item)loadJourney(forkExpression(item.expression));break;}
 case 'open-featured':{const item=featured.find(j=>j.id===el.dataset.id);if(item)loadJourney(forkExpression(item));break;}
 case 'fork-saved':{const item=store.document.id===el.dataset.id?store.document:sessionExpressions.get(el.dataset.id!)??readLibrary().find(j=>j.id===el.dataset.id);if(item){const copy=forkExpression(item);copy.name+=' / variation';loadJourney(copy);}break;}
 case 'close-dialog':el.closest('dialog')?.close();break;
 case 'confirm':$('confirm-dialog').closest('dialog')?.close();confirmCallback?.();confirmCallback=null;break;
 case 'load-built-in':{const j=preset(el.dataset.value!);j.id=uid('journey');loadJourney(j);break;}
 case 'add-built-in':{const added=clone(preset(el.dataset.value!).scenes[0].entities);ensureCapacity(added);for(const x of added)x.id=uid('entity');changed(()=>{s.entities.push(...added);selected=added.map(x=>x.id);});closeDialogs();edit(true,'objects');break;}
 case 'import-legacy':{const raw=localStorage.getItem('typographic_pointcloud_saved_states');if(raw){const result=importDocuments(JSON.parse(raw));collectImported(result.journeys);toast(`${result.journeys.length} previous native scenes imported. Original browser key unchanged. ${result.errors.map(e=>e.message).join(' · ')}`,9000);openLibrary();}break;}
 case 'load-saved':{const j=store.document.id===el.dataset.id?store.document:sessionExpressions.get(el.dataset.id!)??readLibrary().find(j=>j.id===el.dataset.id);if(j)loadJourney(j);break;}
 case 'new-journey':loadJourney(blankJourney());edit(true,'scene');break;
 case 'new-scene':changed(()=>{store.document.scenes.splice(sceneIndex+1,0,blankScene());sceneIndex++;selected=[];textId=scene().text[0]?.id??null;sceneElapsed=0;journeyPlaying=false;});edit(true,'scene');timelineOpen=true;renderAll();break;
 case 'duplicate-scene':{const idx=Number(el.dataset.index??sceneIndex);changed(()=>{const n=clone(store.document.scenes[idx]);n.id=uid('scene');n.name+=' / variation';store.document.scenes.splice(idx+1,0,n);sceneIndex=idx+1;sceneElapsed=0;journeyPlaying=false;});break;}
 case 'delete-scene':{if(store.document.scenes.length===1){toast('Keep at least one scene in the expression.');break;}const idx=Number(el.dataset.index);confirmChange('Remove this scene?',`“${store.document.scenes[idx].name}” will be removed from this expression. Undo can restore it.`,()=>changed(()=>{store.document.scenes.splice(idx,1);if(sceneIndex>=idx)sceneIndex=Math.max(0,sceneIndex-1);sceneElapsed=0;}));break;}
 case 'move-scene-left':reorderScene(Number(el.dataset.index),Number(el.dataset.index)-1);break;
 case 'move-scene-right':reorderScene(Number(el.dataset.index),Number(el.dataset.index)+1);break;
 case 'journey-settings':openLibrary();break;
 case 'material':changed(()=>{s.field.material=el.dataset.value as Scene['field']['material'];});break;
 case 'select-entity':selectEntity(el.dataset.id!,event instanceof MouseEvent&&event.shiftKey);break;
 case 'select-all':selected=s.entities.filter(e=>!e.locked).map(e=>e.id);renderAll();break;
 case 'repeat-pins':pinRepeat=!pinRepeat;setHint();break;
 case 'choose-shape':shapeChoice=el.dataset.value as Shape;glyphChoice=el.dataset.glyph??glyphChoice;renderShapePicker();break;
 case 'set-glyph':if(e&&!e.locked)changed(()=>{e.shape='text';e.text=el.dataset.value!;if(!e.sequence.enabled&&e.sequence.steps.length===1)e.sequence.steps[0].text=e.text;});break;
 case 'force-kind':if(e&&!e.locked)changed(()=>{e.force.kind=el.dataset.value as Entity['force']['kind'];if(e.kind==='pin')e.name=e.force.kind==='attract'?'Attractor':e.force.kind==='repel'?'Repeller':e.force.kind==='vortex'?'Vortex':'Pin';});break;
 case 'duplicate-entity':duplicateEntity();break;case 'delete-entity':deleteEntities();break;
 case 'arrange':{const targets=s.entities.filter(e=>!e.locked&&selected.includes(e.id));if(!targets.length){toast('Select at least one unlocked centre.');break;}changed(()=>{arrange(targets,el.dataset.value!,s.composition.plane);s.composition.layout=el.dataset.value!;});break;}
 case 'chakra-add':{const added=nativeChakras().map(e=>({...e,id:uid('entity')}));ensureCapacity(added);changed(()=>{s.entities.push(...added);selected=added.map(e=>e.id);});toast('Seven ordinary native yantra formations added to the same field.');break;}
 case 'add-palette':if(s.field.palette.length<8)changed(()=>{s.engine.paletteSource='custom';s.field.palette.push('#a4876c');});break;
 case 'remove-palette':if(s.field.palette.length>2)changed(()=>{s.engine.paletteSource='custom';s.field.palette.pop();});break;
 case 'source-image':if(e&&!e.locked){sourceUploadEntityId=e.id;$<HTMLInputElement>('source-file').click();}break;
 case 'select-text':textId=el.dataset.id!;tool='text';renderAll();break;
 case 'move-text':tool='text';renderAll();break;
 case 'add-text':changed(()=>{const t:TextLayer={id:uid('text'),visible:true,kicker:'A MOMENT IN THE FIELD',title:'Your words,',italic:'in this space.',body:'',x:.07,y:.24,width:240,size:38,align:'left'};s.text.push(t);textId=t.id;tool='text';});break;
 case 'delete-text':if(currentText())changed(()=>{s.text=s.text.filter(t=>t.id!==currentText().id);textId=s.text[0]?.id??null;});break;
 case 'entity-sequence':tab='motion';motionTab='sequence';stepIndex=0;renderAll();break;
 case 'motion-tab':motionTab=el.dataset.value as InspectorContext['motionTab'];if(motionTab==='sequence'&&!selectedEntity()){const f=s.entities.find(e=>e.kind==='formation');if(f)selected=[f.id];}renderAll();break;
 case 'select-step':stepIndex=Number(el.dataset.index);placementStep=false;renderAll();break;
 case 'add-step':if(e&&!e.locked&&e.sequence.steps.length<32)changed(()=>{e.sequence.steps.push({id:uid('step'),text:e.sequence.steps.length%2?'&':'O',shape:'text',hold:3,transition:1,position:null});stepIndex=e.sequence.steps.length-1;e.sequence.enabled=true;});break;
 case 'delete-step':if(e&&!e.locked){if(e.sequence.steps.length<=1){toast('Keep at least one sequence link.');break;}changed(()=>{e.sequence.steps.splice(stepIndex,1);stepIndex=Math.max(0,stepIndex-1);});}break;
 case 'place-keyframe':if(e&&!e.locked){placementStep=true;tool='select';inspectorOpen=false;camera.grid=true;renderAll();}break;
 case 'clear-keyframe':if(e&&!e.locked&&e.sequence.steps[stepIndex])changed(()=>{e.sequence.steps[stepIndex].position=null;});break;
 case 'cancel-placement':placementStep=false;shapePickerOpen=false;tool='select';inspectorOpen=true;renderAll();break;
 case 'route-up':case 'route-down':changed(()=>{reorderFocus(s.entities,el.dataset.id!,name==='route-up'?-1:1);});break;
 case 'automate':addLane(el.dataset.target??el.dataset.key);break;case 'add-lane':addLane(automationTargets(s).find(p=>!s.automation.some(a=>a.target===p.target))?.target??'field.dispersion');break;
 case 'delete-lane':changed(()=>{s.automation=s.automation.filter(a=>a.id!==el.dataset.id);});break;
 case 'fire-lane':{const lane=s.automation.find(a=>a.id===el.dataset.id);if(lane)changed(()=>{lane.firedAt=(lane.firedAt??0)+1;});if(!playing)toast('Ramp armed. Resume motion to run it.');break;}
 case 'reveal-param':{const p=parameter(el.dataset.key!);if(p){search='';$<HTMLInputElement>('control-search').value='';tab=p.group==='morph'||p.group==='composition'?'motion':'field';motionTab=p.group==='composition'?'focus':'morph';renderAll();const control=Array.from($('inspector-content').querySelectorAll<HTMLElement>('[data-bind]')).find(e=>e.dataset.bind===p.bind);let parent=control?.parentElement;while(parent&&parent!==$('inspector-content')){if(parent instanceof HTMLDetailsElement){parent.open=true;if(parent.dataset.detail)detailState.set(parent.dataset.detail,true);}parent=parent.parentElement;}control?.scrollIntoView({block:'center'});}break;}
 case 'favourite':{const key=el.dataset.key!;changed(()=>{const f=s.favourites??[];s.favourites=f.includes(key)?f.filter(k=>k!==key):[...f,key].slice(-8);});break;}
 case 'take-manual':{const target=el.dataset.target!;changed(()=>{s.automation.filter(l=>l.target===target).forEach(l=>l.enabled=false);if(target==='field.frequency'){s.composition.frequencyDriver='manual';s.engine.autoSweep=false;}});break;}
 case 'tune-station':{const station=engine.stations?.().find(x=>x.index===Number(el.dataset.index));if(station)changed(()=>{s.field.params.frequency=station.frequencyHz;s.composition.frequencyDriver='manual';s.engine.autoSweep=false;s.automation.filter(l=>l.target==='field.frequency').forEach(l=>l.enabled=false);});break;}
 case 'lane-up':case 'lane-down':{const index=s.automation.findIndex(l=>l.id===el.dataset.id),next=index+(name==='lane-up'?-1:1);if(index>=0&&next>=0&&next<s.automation.length)changed(()=>{[s.automation[index],s.automation[next]]=[s.automation[next],s.automation[index]];});break;}
 case 'step-earlier':case 'step-later':{const next=stepIndex+(name==='step-earlier'?-1:1);if(e&&next>=0&&next<e.sequence.steps.length&&!e.locked)changed(()=>{[e.sequence.steps[stepIndex],e.sequence.steps[next]]=[e.sequence.steps[next],e.sequence.steps[stepIndex]];stepIndex=next;});break;}
 case 'duplicate-step':if(e&&!e.locked&&e.sequence.steps.length<32)changed(()=>{const k=clone(e.sequence.steps[stepIndex]);k.id=uid('step');e.sequence.steps.splice(++stepIndex,0,k);});break;
 case 'undo':if(store.undo()){markSaved();renderAll();toast('Edit undone. Simulation time has not been rewound.',2200);}break;
 case 'redo':if(store.redo()){markSaved();renderAll();}break;
 case 'save-browser':deletedLibraryIds.delete(store.document.id);saveToLibrary(store.document);if(libraryOpen)renderLibrary();toast('Saved in this browser.');break;
 case 'export-json':download(new Blob([JSON.stringify(store.document,null,2)],{type:'application/json'}),slug(store.document.name)+'.expression.json');toast('Expression configuration exported.');break;
 case 'export-native':download(new Blob([JSON.stringify(nativeExport(s),null,2)],{type:'application/json'}),slug(s.name)+'.native-scene.json');break;
 case 'export-artifact':await exportArtifact();break;
 case 'import':$<HTMLInputElement>('import-file').click();break;
 case 'capture-image':await captureImage();break;
 case 'record-video':startRecording();break;
 case 'stop-record':recorder.stop();break;
 case 'save-video':if(currentVideo){const video=currentVideo,name=slug(video.source.expression.name)+'-performance.'+(video.mime.includes('mp4')?'mp4':'webm');if(await saveDesktopCapture(video.blob,name,video.source,video.settings))toast('Video saved to the Physis library and screensaver.');else download(video.blob,name);}break;
 }}
document.addEventListener('click',ev=>{const target=(ev.target as Element).closest<HTMLElement>('[data-action]');if(!target||target instanceof HTMLSelectElement||target instanceof HTMLButtonElement&&target.disabled)return;const name=target.dataset.action!;void action(name,target,ev).catch(error);});
document.addEventListener('pointerover',ev=>{if(!(ev.target as Element).closest('#stage'))pointer.active=false;});
document.addEventListener('pointerdown',ev=>{const target=ev.target as Element;if(modesOpen&&!target.closest('#modes-panel,[data-action="modes"]')){modesOpen=false;$('modes-panel').hidden=true;document.querySelector('[data-action="modes"]')?.setAttribute('aria-expanded','false');}if(captureOpen&&!target.closest('#capture-panel,[data-action="capture-options"]')){readCapture();captureOpen=false;$('capture-panel').hidden=true;document.querySelector('[data-action="capture-options"]')?.setAttribute('aria-expanded','false');}const el=ev.target as HTMLInputElement;if(!el.closest('#stage'))pointer.active=false;if(el instanceof HTMLInputElement&&el.type==='range'&&el.dataset.bind)store.begin();});
document.addEventListener('input',ev=>{const el=ev.target as HTMLInputElement;if(el.id==='mode-search'||el.id==='library-search'){
 const query=el.value.trim().toLowerCase(),selector=el.id==='mode-search'?'[data-mode-choice]':'[data-starting-card]';let count=0;
 document.querySelectorAll<HTMLElement>(selector).forEach(item=>{item.hidden=!item.dataset.search?.includes(query);if(!item.hidden)count++;});
 if(el.id==='library-search')$('library-empty').hidden=count>0;return;
 }if(el.id==='control-search'){search=el.value;renderInspector();return;}if(el instanceof HTMLInputElement&&el.type==='range'&&el.dataset.bind)applyBinding(el,true);});
document.addEventListener('change',ev=>{const el=ev.target as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement;if(el.dataset.bind){applyBinding(el);return;}if(el.id.startsWith('capture-'))readCapture();
 if(el.dataset.palette){const i=Number(el.dataset.palette);changed(()=>{scene().engine.paletteSource='custom';scene().field.palette[i]=el.value;});}
 if(el.id==='placement-glyph')glyphChoice=el.value.trim()||'O';
 if(el.id==='keep-placing')keepPlacing=(el as HTMLInputElement).checked;
 if(el.id==='working-depth'){const v=Number(el.value);if(Number.isFinite(v))camera.depth=clamp(v,-10,10);renderAll();}
 if(el.id==='working-plane'){camera.plane=el.value as Camera['plane'];if(camera.mode==='2d')facePlane(camera);renderAll();}
 if(el.dataset.action==='source-kind'){const e=selectedEntity();if(e&&!e.locked)changed(()=>{e.source=el.value==='ascii'?{kind:'ascii',ascii:{text:'O  :  I',fontFamily:'monospace',fontSize:32}}:el.value==='image'?{kind:'image',image:{mode:'luminance',threshold:.2,invert:false,scale:1}}:undefined;});}
 if(el.dataset.action==='sequence-entity'){selected=[el.value];stepIndex=0;renderAll();}
});
document.addEventListener('keydown',ev=>{const el=ev.target as HTMLElement;const typing=el.closest('input,textarea,select,[contenteditable="true"]');if(typing){if(ev.key==='Escape'){el.blur();return;}if(ev.key==='Enter'&&!(el instanceof HTMLTextAreaElement)){ev.preventDefault();el.blur();}return;}if(document.querySelector('dialog[open]'))return;if(libraryOpen){if(ev.key==='Escape'){ev.preventDefault();closeLibrary();}return;}if(ev.key==='Escape'&&(modesOpen||captureOpen)){ev.preventDefault();readCapture();modesOpen=false;captureOpen=false;renderAll();return;}
 if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();void action(ev.shiftKey?'redo':'undo',el);return;}
 if(ev.key==='Escape'){if(presenting){presenting=false;renderAll();}else if(placementStep||shapePickerOpen){placementStep=false;shapePickerOpen=false;tool='select';renderAll();}else if(timelineOpen){timelineOpen=false;renderAll();}else if(inspectorOpen){inspectorOpen=false;railExpanded=false;renderAll();}else if(editing)edit(false);return;}
 if(ev.key===' '){ev.preventDefault();playing=!playing;transportUI();return;}
 const shortcuts:Record<string,string>={e:'edit',p:'tool-pin',v:'tool-select',i:'tool-interact',a:'tool-formation',t:'tool-text',o:'tool-orbit',g:'grid',f:presenting?'exit-present':'present'};
 if(shortcuts[ev.key.toLowerCase()]){ev.preventDefault();void action(shortcuts[ev.key.toLowerCase()],el);return;}
 if(ev.key.startsWith('Arrow')){ev.preventDefault();if(editing&&selected.length){const amount=ev.shiftKey?.1:.01;changed(()=>scene().entities.filter(e=>selected.includes(e.id)&&!e.locked).forEach(e=>{if(ev.key==='ArrowLeft')e.position.x-=amount;if(ev.key==='ArrowRight')e.position.x+=amount;if(ev.key==='ArrowUp')e.position.y+=amount;if(ev.key==='ArrowDown')e.position.y-=amount;e.position.x=clamp(e.position.x,-50,50);e.position.y=clamp(e.position.y,-50,50);}));}else if(ev.key==='ArrowLeft')setScene(sceneIndex-1);else if(ev.key==='ArrowRight')setScene(sceneIndex+1);}
 if((ev.key==='Delete'||ev.key==='Backspace')&&editing&&selected.length){ev.preventDefault();deleteEntities();}
});
$<HTMLInputElement>('source-file').addEventListener('change',async ev=>{const input=ev.target as HTMLInputElement,file=input.files?.[0],id=sourceUploadEntityId;if(!file||!id)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8_000_000)throw new Error('Use a PNG, JPEG or WebP smaller than 8 MB.');const url=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Image file could not be read'));r.readAsDataURL(file);});const e=scene().entities.find(e=>e.id===id);if(e&&!e.locked)changed(()=>{e.source={kind:'image',image:{mode:'luminance',threshold:.2,invert:false,scale:1,dataUrl:url,name:file.name}};});}catch(err){error(err);}finally{input.value='';sourceUploadEntityId=null;}});
$<HTMLInputElement>('import-file').addEventListener('change',async ev=>{const input=ev.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>32_000_000)throw new Error('Choose a configuration smaller than 32 MB.');const result=importDocuments(JSON.parse(await file.text()));collectImported(result.journeys);if(!libraryOpen)openLibrary();else renderLibrary();toast(`${result.journeys.length} document(s) imported. ${result.errors.length?result.errors.map(e=>`Entry ${e.index+1}: ${e.message}`).join(' · '):'All accepted; original input is unchanged.'}`,10000);}catch(err){error(err);}finally{input.value='';}});
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(d=>d.addEventListener('click',ev=>{if(ev.target!==d)return;const r=d.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)d.close();}));
let sceneDragIndex=-1;
$('timeline-panel').addEventListener('dragstart',ev=>{const card=(ev.target as Element).closest<HTMLElement>('[data-scene-index]');if(!editing||!card)return;sceneDragIndex=Number(card.dataset.sceneIndex);ev.dataTransfer?.setData('text/plain',String(sceneDragIndex));if(ev.dataTransfer)ev.dataTransfer.effectAllowed='move';});
$('timeline-panel').addEventListener('dragover',ev=>{if(editing&&(ev.target as Element).closest('[data-scene-index]'))ev.preventDefault();});
$('timeline-panel').addEventListener('drop',ev=>{const card=(ev.target as Element).closest<HTMLElement>('[data-scene-index]');if(card&&sceneDragIndex>=0){ev.preventDefault();reorderScene(sceneDragIndex,Number(card.dataset.sceneIndex));sceneDragIndex=-1;}});
function hitEntity(x:number,y:number){let winner:Entity|undefined,best=25;for(const e of [...scene().entities].reverse()){const p=project(e.position,camera,width,height),d=Math.hypot(x-p.x,y-p.y);if(d<best){best=d;winner=e;}}return winner;}
function positionAt(ev:PointerEvent,plane=camera.plane,depth=camera.depth){return unproject(ev.clientX,ev.clientY,camera,width,height,plane,depth);}
function showCoordinates(v:Vec3){const number=(n:number)=>(Math.abs(n)<.0005?0:n).toLocaleString('en-US',{minimumFractionDigits:3,maximumFractionDigits:3,signDisplay:'always',useGrouping:false});
 $('coordinates').innerHTML=`<span>X <b>${number(v.x)}</b></span><span>Y <b>${number(v.y)}</b></span><span>Z <b>${number(v.z)}</b></span>`;
}
$('stage').addEventListener('pointerdown',ev=>{if((ev.target as HTMLElement).closest('button'))return;
 if(libraryOpen)return;
 if(ev.button!==0&&ev.button!==2)return;
 if(!presenting&&(ev.button===2||tool==='orbit')){pointer.active=false;drag={kind:'camera',id:'',startX:ev.clientX,startY:ev.clientY,startWorld:{x:0,y:0,z:0},positions:new Map(),initialRadius:0,cam:{...camera},layer:null,pan:ev.button===2||ev.shiftKey};$('stage').setPointerCapture(ev.pointerId);ev.preventDefault();return;}
 if(presenting||!editing){if(ev.button===0&&tool==='interact'){try{pointer={active:true,world:positionAt(ev)};}catch{}}return;}
 try{
  if(placementStep){const e=selectedEntity();if(e&&!e.locked){const p=positionAt(ev);changed(()=>{e.sequence.steps[stepIndex].position={x:p.x-e.position.x,y:p.y-e.position.y,z:p.z-e.position.z};});placementStep=false;inspectorOpen=true;renderAll();}return;}
  if(tool==='interact'){pointer={active:true,world:positionAt(ev)};return;}
  if(tool==='pin'||tool==='formation'){
   if(scene().entities.filter(e=>e.kind===(tool==='pin'?'pin':'formation')).length>=(tool==='pin'?8:10)){toast(tool==='pin'?'The native field supports eight force-only pins.':'The native field supports ten formations.');return;}
   const p=positionAt(ev),newEntity=tool==='pin'?pin(p):entity(glyphChoice==='O'?'New formation':glyphChoice,glyphChoice,p);if(tool==='formation'){newEntity.shape=shapeChoice;newEntity.sequence.steps[0].shape=shapeChoice;}
   changed(()=>{scene().entities.push(newEntity);selected=[newEntity.id];},false);if(!(tool==='pin'?pinRepeat:keepPlacing)){tool='select';shapePickerOpen=false;inspectorOpen=true;tab='objects';}renderAll();showCoordinates(p);return;
  }
  if(tool==='text'){const layerEl=(ev.target as HTMLElement).closest<HTMLElement>('[data-text-id]');const t=scene().text.find(t=>t.id===layerEl?.dataset.textId);if(t){textId=t.id;tab='scene';inspectorOpen=true;store.begin();drag={kind:'text',id:t.id,startX:ev.clientX,startY:ev.clientY,startWorld:{x:0,y:0,z:0},positions:new Map(),initialRadius:0,cam:{...camera},layer:clone(t),pan:false};$('stage').setPointerCapture(ev.pointerId);renderInspector();ev.preventDefault();}return;}
  const e=selectedEntity();if(e&&!e.locked&&(e.kind==='pin'||e.force.strength>0)){const handle=project({x:e.position.x+e.force.radius,y:e.position.y,z:e.position.z},camera,width,height);if(Math.hypot(handle.x-ev.clientX,handle.y-ev.clientY)<12){store.begin();drag={kind:'radius',id:e.id,startX:ev.clientX,startY:ev.clientY,startWorld:positionAt(ev,'XY',e.position.z),positions:new Map(),initialRadius:e.force.radius,cam:{...camera},layer:null,pan:false};$('stage').setPointerCapture(ev.pointerId);ev.preventDefault();return;}}
  const hit=hitEntity(ev.clientX,ev.clientY);if(hit){if(!selected.includes(hit.id)||ev.shiftKey)selectEntity(hit.id,ev.shiftKey);if(hit.locked){toast('This centre is locked. Its sequence is still running.');return;}store.begin();drag={kind:'entity',id:hit.id,startX:ev.clientX,startY:ev.clientY,startWorld:positionAt(ev,'XY',hit.position.z),positions:new Map(scene().entities.filter(e=>selected.includes(e.id)&&!e.locked).map(e=>[e.id,{...e.position}])),initialRadius:0,cam:{...camera},layer:null,pan:false};$('stage').setPointerCapture(ev.pointerId);ev.preventDefault();}
  else{selected=[];overlayDirty=true;needsFrame=true;renderInspector();}
 }catch(err){toast(err instanceof Error?err.message:String(err));}
});
$('stage').addEventListener('pointermove',ev=>{
 try{if(drag){if(drag.kind==='camera'){const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;if(drag.pan){camera.panX=drag.cam.panX+dx;camera.panY=drag.cam.panY+dy;}else{camera.mode='3d';camera.yaw=drag.cam.yaw+dx*.006;camera.pitch=clamp(drag.cam.pitch+dy*.006,-1.5,1.5);}overlayDirty=true;needsFrame=true;return;}
 if(drag.kind==='text'){const t=scene().text.find(t=>t.id===drag!.id);if(t&&drag.layer){t.x=clamp(drag.layer.x+(ev.clientX-drag.startX)/width,-.1,.95);t.y=clamp(drag.layer.y+(ev.clientY-drag.startY)/height,-.1,.95);const article=$('text-layers').querySelector<HTMLElement>(`[data-text-id="${t.id}"]`);if(article){article.style.left=t.x*100+'%';article.style.top=t.y*100+'%';}}return;}
 const e=scene().entities.find(e=>e.id===drag!.id);if(!e)return;const p=positionAt(ev,'XY',e.position.z);showCoordinates(p);if(drag.kind==='radius')e.force.radius=clamp(Math.hypot(p.x-e.position.x,p.y-e.position.y),.0125,50);else for(const [id,initial]of drag.positions){const item=scene().entities.find(e=>e.id===id);if(item){item.position.x=clamp(initial.x+p.x-drag.startWorld.x,-50,50);item.position.y=clamp(initial.y+p.y-drag.startWorld.y,-50,50);}}overlayDirty=true;needsFrame=true;return;
 }
 const p=positionAt(ev);pointer={active:tool==='interact',world:p};showCoordinates(p);overlayDirty=true;needsFrame=true;
 }catch{pointer.active=false;$('coordinates').textContent='X — · Y — · Z — · plane edge-on';}
});
function endDrag(ev:PointerEvent){if(drag){if(drag.kind!=='camera'){store.finish();markSaved();}drag=null;if($('stage').hasPointerCapture(ev.pointerId))$('stage').releasePointerCapture(ev.pointerId);renderAll();}}
$('stage').addEventListener('pointerup',endDrag);$('stage').addEventListener('pointercancel',endDrag);$('stage').addEventListener('pointerleave',()=>{if(!drag){pointer.active=false;needsFrame=true;}});$('stage').addEventListener('contextmenu',ev=>{if(!presenting)ev.preventDefault();});
$('stage').addEventListener('wheel',ev=>{if(!editing||ev.ctrlKey||ev.metaKey)return;ev.preventDefault();pointer.active=false;camera.zoom=clamp(camera.zoom*Math.exp(-ev.deltaY*.001),.2,4);overlayDirty=true;needsFrame=true;},{passive:false});
function poly(points:{x:number;y:number}[]){return points.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');}
function drawGuides(){const svg=$('guides');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);if(!editing||presenting||!guidesVisible){svg.innerHTML='';return;}let markup='';
 if(camera.grid){for(let i=-15;i<=15;i++){const v=i/10;const mk=(a:number,b:number):Vec3=>camera.plane==='XY'?{x:a,y:b,z:camera.depth}:camera.plane==='XZ'?{x:a,y:camera.depth,z:b}:{x:camera.depth,y:a,z:b};const a=project(mk(v,-1.5),camera,width,height),b=project(mk(v,1.5),camera,width,height),c=project(mk(-1.5,v),camera,width,height),d=project(mk(1.5,v),camera,width,height);markup+=`<path d="M${a.x},${a.y}L${b.x},${b.y}M${c.x},${c.y}L${d.x},${d.y}" fill="none" stroke="var(--ink)" opacity="${i===0?.25:.075}" stroke-width="${i===0?1:.6}"/>`;}}
 const forms=scene().entities.filter(e=>e.kind==='formation');if(tab==='motion'&&motionTab==='focus'&&scene().composition.focus==='travelling'){const ps=forms.map(e=>project(e.position,camera,width,height));markup+=`<polyline points="${poly(ps)}" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 5" opacity=".6"/>`;}
 for(const e of scene().entities){const p=project(e.position,camera,width,height),isSelected=selected.includes(e.id),r=e.kind==='pin'?7:5,color=isSelected?'var(--accent)':'var(--muted)';
 if(isSelected&&(e.kind==='pin'||e.force.strength>0)){const points=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return project({x:e.position.x+Math.cos(a)*e.force.radius,y:e.position.y+Math.sin(a)*e.force.radius,z:e.position.z},camera,width,height);});const handle=points[0];markup+=`<polyline points="${poly(points)}" fill="none" stroke="var(--accent)" stroke-width=".8" stroke-dasharray="3 5" opacity=".65"/><circle cx="${handle.x}" cy="${handle.y}" r="4" fill="var(--paper)" stroke="var(--accent)"/><text x="${handle.x+9}" y="${handle.y-7}" fill="var(--muted)" font-family="Arial" font-size="8">falloff</text>`;}
 if(isSelected&&e.kind==='formation'){const co=Math.cos(e.rotation*Math.PI/180),si=Math.sin(e.rotation*Math.PI/180);const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5],[-.5,-.5]].map(([x,y])=>{const a=x*e.size.x,b=y*e.size.y;return project({x:e.position.x+a*co-b*si,y:e.position.y+a*si+b*co,z:e.position.z},camera,width,height);});markup+=`<polyline points="${poly(corners)}" fill="none" stroke="var(--accent)" stroke-width=".65" opacity=".3" stroke-dasharray="2 4"/>`;}
 if(isSelected&&e.sequence.enabled){const path=e.sequence.steps.map(k=>k.position?project({x:e.position.x+k.position.x,y:e.position.y+k.position.y,z:e.position.z+k.position.z},camera,width,height):p);markup+=`<polyline points="${poly(path)}" fill="none" stroke="var(--accent)" stroke-dasharray="2 6" stroke-width=".8"/>`;path.forEach((pt,i)=>{if(e.sequence.steps[i].position)markup+=`<rect x="${pt.x-3}" y="${pt.y-3}" width="6" height="6" fill="var(--paper)" stroke="var(--accent)"/><text x="${pt.x+7}" y="${pt.y-6}" fill="var(--accent)" font-size="8" font-family="Arial">${i+1}</text>`;});}
 markup+=`<g data-world-marker="${e.id}" data-screen-x="${p.x.toFixed(2)}" data-screen-y="${p.y.toFixed(2)}" transform="translate(${p.x},${p.y})"><circle r="${r+5}" fill="var(--paper)" opacity=".75"/><path d="M-12 0H-5M5 0H12M0-12V-5M0 5V12" fill="none" stroke="${color}" stroke-width=".9"/><circle r="${r}" fill="none" stroke="${color}" stroke-width=".9"/>${e.kind==='pin'?`<text y="3" text-anchor="middle" font-size="9" fill="${color}">${e.force.kind==='repel'?'+':e.force.kind==='vortex'?'↻':'−'}</text>`:''}${isSelected?`<text x="17" y="-13" fill="${color}" font-size="9" font-family="Arial">${esc(e.name)}${e.locked?' · locked':''}</text>`:''}</g>`;
 }
 svg.innerHTML=markup;overlayDirty=false;
}
function resize(){width=innerWidth;height=innerHeight;engine.resize(width,height,devicePixelRatio||1);renderText();overlayDirty=true;needsFrame=true;}
function frameData(delta:number):EngineFrame{return {scene:scene(),scaffold:editing&&!presenting&&guidesVisible?scene().view.nativeScaffold??'off':'off',simTime,delta,params:engine.capabilities.kind==='production'?scene().field.params:evaluateParameters(scene(),simTime),camera,pointer,selectedIds:editing&&!presenting&&guidesVisible?selected:[]};}
let frames=0,lastFpsTime=performance.now(),fps=0,rafId=0;
function tick(now:number){const rawDelta=Math.max(0,Math.min((now-lastTime)/1000,.25));lastTime=now;let delta=playing&&!document.hidden&&!libraryOpen?Math.min(rawDelta,.05):0;const previousTime=simTime;if(engine.capabilities.kind!=='production'){delta*=scene().field.params.timeScale;simTime+=delta;}
 if(recovery.hidden&&!libraryOpen&&(playing||needsFrame||engine.needsRender?.()||pointer.active||recorder.active||transitionDuration>0)){try{engine.render(frameData(delta));needsFrame=false;}catch(err){playing=false;needsFrame=false;if(String(err).toLowerCase().includes('context'))recovery.hidden=false;else error(err);transportUI();}}
 const native=engine.telemetry?.();if(native){simTime=native.simTime;delta=simTime-previousTime;document.documentElement.style.setProperty('--paper',native.background);document.documentElement.style.setProperty('--ink',native.palette[0]);$('text-layers').style.opacity=String(.25+.75*native.transition);}
 if(journeyPlaying&&playing&&!editing&&!libraryOpen){sceneElapsed+=delta;if(sceneElapsed>=scene().duration){if(sceneIndex===store.document.scenes.length-1&&!store.document.loop){journeyPlaying=false;sceneElapsed=scene().duration;transportUI();}else setScene((sceneIndex+1)%store.document.scenes.length,true);}}
 if(transitionDuration>0){const f=clamp((simTime-transitionStart)/Math.max(.01,transitionDuration),0,1);$<HTMLCanvasElement>('transition-canvas').style.opacity=String(1-f);if(f>=1){transitionDuration=0;$('transition-canvas').hidden=true;}}
 orbitControl.render();if(overlayDirty&&!libraryOpen)drawGuides();if(recorder.active){const paperScene={...scene(),field:{...scene().field,background:native?.background??scene().field.background,palette:native?.palette??scene().field.palette,params:{...scene().field.params,...native?.params}}};const copy=()=>recorder.frame(engine.canvas,paperScene,width,height,captureTransition());try{if(engine.withCleanFrame)engine.withCleanFrame(copy);else copy();}catch(err){recorder.stop();error(err);}}frames++;
 if(now-lastFpsTime>1000){fps=Math.round(frames*1000/(now-lastFpsTime));frames=0;lastFpsTime=now;}
 if(now-lastUI>90){const s=scene(),fraction=clamp(sceneElapsed/s.duration,0,1);$('journey-progress').style.width=fraction*100+'%';document.querySelectorAll<HTMLElement>('[data-scene-progress]').forEach(e=>e.style.width=(Number(e.dataset.sceneProgress)===sceneIndex?fraction*100:0)+'%');
 const nd=engine.telemetry?.()?.drive;const ph=nd?{theta:nd.theta,phi:nd.phi,drive:nd.progress}:phases(s,simTime);document.querySelectorAll<SVGLineElement>('[data-phase]').forEach(e=>e.setAttribute('transform',`rotate(${(e.dataset.phase==='theta'?ph.theta:ph.phi)*180/Math.PI} 50 50)`));if($('drive-value'))$('drive-value').style.width=ph.drive*100+'%';
 const telemetry=engine.telemetry?.();const effectivePaper={...s,field:{...s.field,background:telemetry?.background??s.field.background,palette:telemetry?.palette??s.field.palette,params:{...s.field.params,...telemetry?.params}}};paintLivePaper(effectivePaper);const params=telemetry?.params??evaluateParameters(s,simTime);document.querySelectorAll<HTMLElement>('[data-source-status]').forEach(el=>el.textContent=telemetry?.sourceStatus?.[el.dataset.sourceStatus!]??'');const contribution=document.querySelector<HTMLElement>('[data-focus-contribution]');if(contribution){const col=telemetry?.config?.composition;contribution.textContent=`Palette → stored entity tint (${Math.round((selectedEntity()?.tintWeight??0)*(col?.entityTintWeight??1)*100)}%) → ${telemetry?.focus?'travelling focus ('+Math.round((col?.orchestration?.focusTintWeight??0)*100)+'%)':'no focus tint'}. Selection does not retune the field.`;}document.querySelectorAll<HTMLElement>('[data-live-target]').forEach(el=>{const target=automationTarget(s,el.dataset.liveTarget!);if(!target)return;const value=target.target.startsWith('field.')?params[target.key]:readPath(telemetry?.config,target.path);el.textContent=typeof value==='number'?(target.target.startsWith('field.')?value:value/target.factor).toFixed(3):target.value.toFixed(3);});document.querySelectorAll<HTMLElement>('[data-live-param]').forEach(e=>e.textContent=(params[e.dataset.liveParam!]??0).toFixed(2));const ent=selectedEntity();if(ent){const nt=engine.telemetry?.()?.sequences.find((v:any)=>v.entityId===ent.id);const seq=nt?{from:nt.linkIndex}:sequenceAt(ent,s,simTime);document.querySelectorAll<HTMLElement>('[data-step-live]').forEach(e=>e.classList.toggle('is-playing',ent.sequence.enabled&&Number(e.dataset.stepLive)===seq.from));}
 const nf=engine.telemetry?.()?.focus;const focus=nf?{entity:{id:nf.entityId}}:engine.capabilities.kind==='production'?null:focusAt(s,simTime);document.querySelectorAll<HTMLElement>('[data-focus-entity]').forEach(e=>e.classList.toggle('is-playing',e.dataset.focusEntity===focus?.entity.id));if(recorder.active){const t=Math.floor(recorder.elapsed);$('record-time').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('record-size').textContent=`${captureSettings.width}px · ${fps} render fps`;if(t>=4&&fps>0&&fps<20&&!recordPerformanceWarned){recordPerformanceWarned=true;toast('Recording is below its 30 fps target. Reduce particle allocation or output size for this device.',7000);}}lastUI=now;
 }
 rafId=requestAnimationFrame(tick);
}
window.addEventListener('resize',()=>{if(recorder.active){recorder.stop();toast('Recording stopped to preserve its established frame after a window resize.');}resize();});document.addEventListener('visibilitychange',()=>{lastTime=performance.now();if(document.hidden&&recorder.active){recorder.stop();toast('Recording stopped because this tab became hidden.');}});
window.addEventListener('pagehide',()=>{recorder.stop();try{if(!deletedLibraryIds.has(store.document.id))saveToLibrary(store.document);localStorage.setItem('oi.field-studies.last',store.document.id);}catch{}});
window.__FIELD_STUDIES__={getDocument:()=>clone(store.document),getState:()=>({needsFrame,libraryOpen,librarySection,modesOpen,captureOpen,railKey,railExpanded,sceneIndex,selected:[...selected],textId,editing,inspectorOpen,timelineOpen,tool,simTime,sceneElapsed,playing,journeyPlaying,camera:{...camera},fps,recording:recorder.active,pointerActive:pointer.active,engine:engine.capabilities.name}),project:(v:Vec3)=>project(v,camera,width,height),unproject:(x:number,y:number)=>unproject(x,y,camera,width,height),selectEntity:(id:string)=>selectEntity(id),setScene:(i:number)=>setScene(i),openEditor:(t:InspectorContext['tab'])=>edit(true,t),pause:()=>{playing=false;transportUI();},play:()=>{playing=true;transportUI();},dispose:()=>{cancelAnimationFrame(rafId);coverObserver?.disconnect();orbitControl.dispose();engine.dispose();},command:(cmd:any)=>{engine.command?.(cmd);needsFrame=true;},capabilities:engine.capabilities,inspect:(read=false)=>engine.inspect?.(read),telemetry:()=>engine.telemetry?.(),nativeProject:(v:Vec3)=>engine.projectNative?.(v),capture:(w:number,h:number)=>engine.capture?.(w,h)};
const qs=new URLSearchParams(location.search);if(qs.get('journey')==='seven')store.document=nativeSeven();if(qs.get('scene')){const index=store.document.scenes.findIndex(s=>s.name.toLowerCase()===qs.get('scene')!.toLowerCase());if(index>=0)sceneIndex=index;}if(qs.has('still'))playing=false;
if(window.__START_PRESENTATION__||qs.has('present')){presenting=true;journeyPlaying=playing&&store.document.scenes.length>1;}
applySceneView();
resize();renderAll();if(location.hash.startsWith('#library'))openLibrary(location.hash.includes('about')?'about':'collection',false);rafId=requestAnimationFrame(tick);
if(startupError)toast(startupError,7000);
if(!playing&&!qs.has('still'))toast('A still field, following your reduced-motion preference. Play is available when you choose.',6000);
if(qs.has('edit'))edit(true,(['scene','objects','field','motion'].includes(qs.get('edit')!)?qs.get('edit'):'scene')as InspectorContext['tab']);

function desktopSource():DesktopScene{return {expression:clone(store.document),sceneIndex,camera:{...camera},viewport:{width,height},name:scene().name+' · '+store.document.name};}
installPhysis(desktopSource,source=>{loadJourney(validateJourney(source.expression));setScene(source.sceneIndex??0);camera={...defaultCamera(),...source.camera};if(source.viewport){camera.panX*=width/source.viewport.width;camera.panY*=height/source.viewport.height;}overlayDirty=true;needsFrame=true;renderAll();},toast);
