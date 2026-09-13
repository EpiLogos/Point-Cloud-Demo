import {applyNativeDelta} from './nativeDelta';
/** Document → existing production engine. No renderer, scheduler, DOM or storage writes. */
import type {PointCloudConfig,AutomationLane as NativeLane} from '../../src/engine/types';
import {DEFAULT_CONFIG,DEFAULT_COLOR_CONFIG,DEFAULT_TOROIDAL_CONFIG} from '../../src/engine/PointCloudField';
import {DEFAULT_SEQUENCE,DEFAULT_FORCES,DEFAULT_COMPOSITION,DEFAULT_CYMATIC_MEDIUM,makeChakraEntities,MAX_FORMATIONS,MAX_PINS,type Entity as NativeEntity,type Shape as NativeShape} from '../../src/engine/fieldModel';
import {migrateSnapshot,CONFIG_SCHEMA_VERSION} from '../../src/engine/configMigration';
import {writePath,readPath} from '../../src/engine/automation';
import {NATIVE_BINDINGS,WORLD_SCALE,baseValue,bindValue,nativeBinding,automationTarget,entityTargets,stableNativeTarget} from './nativeParameters';
import {clone,blankJourney,blankScene,entity,validateJourney,DEFAULT_ENGINE_SETTINGS,type Scene,type Entity,type Journey,type SequenceStep,type Shape} from './model';

export const UNSUPPORTED_PREVIEW:Record<string,string>={
 damping:'Preview damping has no defined native unit. Use Viscosity Damp in Physics.',
 flow:'The preview fluid-coupling macro has no reversible native law. Use native curl, spring and viscosity controls.',
 resonanceDamping:'Use the native resonator Q factor. Q is not the preview damping scalar.',
 thickness:'Preview stroke dilation is not a native target parameter; source geometry is retained unchanged.',
 warp:'Preview form warping is not a native force law. Use the native Hopf trajectory and flow controls.',
 jitter:'Preview lattice jitter is not the native target sampler. This value is retained, not applied.',
};
export const MATERIAL_KEYS=['sizeBias','opacity','roundness','softness','irregularity','elongation','orientation','contrast','densityScale','densityPhase','edgeWeight','halo'] as const;
export function assertSafe(value:unknown,depth=0):void{
 if(depth>30)throw new Error('Document nesting exceeds the safe limit');
 if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Non-finite document value');
 if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){
  if(['__proto__','prototype','constructor'].includes(k))throw new Error('Unsafe document key: '+k);
  if((k==='path'||k==='nativePath')&&typeof v==='string'&&v.split('.').some(p=>['__proto__','constructor','prototype'].includes(p)))throw new Error('Unsafe automation path');
  assertSafe(v,depth+1);
 }
}
export function checkNativeLimits(s:Scene){
 if(s.entities.filter(e=>e.kind==='formation').length>MAX_FORMATIONS)throw new Error(`The native field supports ${MAX_FORMATIONS} formations per scene. Nothing was imported or discarded.`);
 if(s.entities.filter(e=>e.kind==='pin').length>MAX_PINS)throw new Error(`The native field supports ${MAX_PINS} pins per scene. Nothing was imported or discarded.`);
 for(const b of NATIVE_BINDINGS){const value=baseValue(s,b.key);if(!Number.isFinite(value)||value<b.hardMin||value>b.hardMax)throw new Error(`${b.label} is outside its native validated bounds (${b.hardMin}–${b.hardMax}).`);}
}
function shapeOf(e:Pick<Entity,'shape'|'text'|'yantraId'|'templateFrequency'|'templateGeometry'|'templateDimension'>,native?:NativeShape):NativeShape{
 if(e.shape==='yantra')return {...native,kind:'yantra',yantraId:e.yantraId??native?.yantraId??'anahata'};
 if(e.shape==='cymatic')return {...native,kind:'cymatic',frequencyHz:e.templateFrequency??native?.frequencyHz??396,plateGeometry:e.templateGeometry,dimension:e.templateDimension};
 if(e.shape==='text')return {...native,kind:'glyph',text:e.text.trim()||'O'};
 return {kind:'primitive',primitive:e.shape};
}
export function toNativeEntity(e:Entity):NativeEntity{
 const original=e.native;
 const {enabled,clock,steps,manual,...nativeSequence}=e.sequence;
 const sequence={...DEFAULT_SEQUENCE,...original?.sequence,...nativeSequence,links:[]};
 const hold=(e.sequence as any).hold??e.sequence.steps[0]?.hold??sequence.hold;
 const transition=(e.sequence as any).transition??e.sequence.steps[0]?.transition??sequence.transition;
 return {...original,id:e.id,name:e.name,kind:e.kind,enabled:e.enabled!==false,x:e.position.x*WORLD_SCALE,y:e.position.y*WORLD_SCALE,z:e.position.z*WORLD_SCALE,
  scale:e.scale??1,extent:{width:e.size.x*WORLD_SCALE,height:e.size.y*WORLD_SCALE,rotation:e.rotation*Math.PI/180,normalized:original?original.extent?.normalized??!!original.extent:true},
  share:e.kind==='pin'?0:e.share,shape:shapeOf(e,original?.shape),
  sequence:{...sequence,hold,transition,advance:e.sequence.enabled?(e.sequence.clock==='morph'?'morphCycle':'time'):'off',
   links:e.kind==='pin'?[]:e.sequence.enabled||e.sequence.manual?e.sequence.steps.map(k=>({...k.native,id:k.id,shape:shapeOf(k,k.native?.shape),
    hold:k.holdOverride?k.hold:e.sequence.hold===undefined&&k.hold!==hold?k.hold:undefined,transition:k.transitionOverride?k.transition:e.sequence.transition===undefined&&k.transition!==transition?k.transition:undefined,
    x:k.position?k.position.x*WORLD_SCALE:undefined,y:k.position?k.position.y*WORLD_SCALE:undefined,z:k.position?k.position.z*WORLD_SCALE:undefined})):[{id:e.id+'_base',shape:shapeOf(e,original?.shape)}]},
  forces:{...DEFAULT_FORCES,...original?.forces,mode:e.force.kind,strength:e.force.strength,radius:e.force.radius*WORLD_SCALE,spin:e.force.spin},
  authoringSource:e.source?clone(e.source):undefined,
  tint:e.tint,tintWeight:e.tintWeight,stationIndex:e.station??undefined,
 };
}
const waves:Record<string,NativeLane['waveform']>={sine:'sine',triangle:'triangle',square:'square',saw:'saw',steps:'randomStep',smooth:'smoothRandom'};
function projectNativeConfig(s:Scene):PointCloudConfig{
 checkNativeLimits(s);
 const original=s.native?.config;
 let cfg=clone(original??DEFAULT_CONFIG);
 cfg.color={...DEFAULT_COLOR_CONFIG,...cfg.color};
 cfg.toroidalMorph={...DEFAULT_TOROIDAL_CONFIG,...cfg.toroidalMorph};
 cfg.composition={...DEFAULT_COMPOSITION,...cfg.composition,orchestration:{...DEFAULT_COMPOSITION.orchestration,...cfg.composition?.orchestration}};
 cfg.cymatics={...DEFAULT_CYMATIC_MEDIUM,...cfg.cymatics};
 // Every native numeric registry entry has exactly one authored home, a reversible
 // unit conversion, its real soft range, and the original hard bounds.
 for(const b of NATIVE_BINDINGS)cfg=writePath(cfg,b.path,baseValue(s,b.key)*b.factor);
 cfg.particleCount=Math.floor(cfg.particleCount);
 cfg.backgroundColor=s.field.background;cfg.backgroundMode=s.engine.backgroundMode??'solid';cfg.fontFamily=s.engine.fontFamily??cfg.fontFamily;const authoredWeight=s.engine.fontWeight??cfg.fontWeight;cfg.fontWeight=typeof authoredWeight==='string'&&/^\d+$/.test(authoredWeight)?Number(authoredWeight):authoredWeight;
 cfg.color={...DEFAULT_COLOR_CONFIG,...cfg.color,enabled:s.engine.colorEnabled!==false,mode:s.engine.colorMode as any,primaryColor:s.field.palette[0],secondaryColor:s.field.palette.at(-1)!,accentColor:s.field.palette[Math.floor(s.field.palette.length/2)],customPaletteColors:s.engine.paletteSource==='legacy'?undefined:[...s.field.palette],backgroundColor:s.field.background,backgroundMode:s.engine.backgroundMode??'solid'};
 cfg.colorMode=s.engine.inkMode??cfg.colorMode;if(s.engine.paletteId)cfg.color.paletteId=s.engine.paletteId;
 cfg.style=s.field.material==='print'?'halftone':'stipple';cfg.dotShape=s.engine.dotShape??'circle';
 if(s.engine.grainProfile===false)cfg.material=undefined;
 cfg.entities=s.entities.map(toNativeEntity);
 const first=s.entities.find(e=>e.kind==='formation'&&e.enabled!==false);cfg.sourceType=first?.source?.kind==='image'?'image':first?.source?.kind==='ascii'?'ascii':'composition';cfg.customImage=first?.source?.kind==='image'?clone(first.source.image):undefined;cfg.asciiGlyph=first?.source?.kind==='ascii'?clone(first.source.ascii):undefined;
 cfg.toroidalMorph={...DEFAULT_TOROIDAL_CONFIG,...cfg.toroidalMorph,enabled:s.engine.morphEnabled,autoOscillate:s.engine.autoOscillate,trajectory:s.engine.trajectory,driveShape:s.engine.driveShape,interference:s.morph.law==='theta'?'toroidalOnly':s.morph.law};
 // The layout plane is NOT the physical medium plane.
 cfg.composition={...DEFAULT_COMPOSITION,...cfg.composition,plane:s.engine.mediumPlane,layoutName:s.composition.layout,orchestration:{...DEFAULT_COMPOSITION.orchestration,...cfg.composition?.orchestration,mode:s.composition.focus==='travelling'?'focus':'parallel',order:s.engine.focusOrder??'listed',followStation:s.composition.carryStation,
 focusTintWeight:s.composition.carryTint?(cfg.composition?.orchestration.focusTintWeight??0):0}};
 cfg.cymatics={...DEFAULT_CYMATIC_MEDIUM,...cfg.cymatics,plateGeometry:s.engine.templateGeometry??cfg.cymatics!.plateGeometry,dimension:s.engine.templateDimension??cfg.cymatics!.dimension,enabled:s.engine.resonanceEnabled,engine:s.engine.resonatorMode??'resonator',followFocus:s.composition.frequencyDriver==='focus',autoSweep:s.engine.autoSweep&&s.composition.frequencyDriver==='automation',sweep:{glideS:8,dwellS:2,...cfg.cymatics?.sweep,enabled:s.engine.autoSweep&&s.composition.frequencyDriver==='automation',direction:s.engine.sweepDirection}};
 cfg.relational={...cfg.relational!,enabled:s.engine.relationalEnabled,mode:s.engine.relationalMode as any};
 cfg.interaction={...cfg.interaction,mode:s.engine.pointerMode,placedPoints:[]};
 cfg.automations=s.automation.map(l=>{
  const b=automationTarget(s,l.target);if(!b)return l.nativePath?{...original?.automations?.find(a=>a.id===l.nativeId),id:l.nativeId??l.id,path:l.nativePath,enabled:false,type:l.type==='lfo'?'lfo':'oneShot'} as NativeLane:null;
  const factor=l.blend==='multiply'?1:b.factor;
  return {id:l.nativeId??l.id,path:b.path,enabled:l.enabled&&(b.path!=='cymatics.frequencyHz'||s.composition.frequencyDriver==='automation'),type:l.type==='lfo'?'lfo':'oneShot',waveform:waves[l.wave],min:l.min*factor,max:l.max*factor,rateHz:l.rate,phase:l.phase,blend:l.blend,
   from:l.min*factor,to:l.max*factor,durationS:l.duration,delayS:l.delay,easing:l.easing??'smooth',loop:l.loop==='once'?'none':l.loop==='loop'?'restart':'pingpong',fireToken:l.firedAt??0} as NativeLane;
 }).filter((l):l is NativeLane=>!!l);
 return cfg;
}
/** Lossless native documents: display defaults do not rewrite unedited native data. */
export function toNativeConfig(s:Scene):PointCloudConfig {
 const projected=projectNativeConfig(s);
 if(!s.native)return projected;
 // Earlier Expressions files have an original config but no projection baseline.
 // Recover that baseline without mutating the document or erasing authored edits.
 const baseline=s.native.projection??nativeSnapshotToJourney({schemaVersion:4,config:s.native.config}).scenes[0].native!.projection!;
 return applyNativeDelta(s.native.config,baseline,projected) as PointCloudConfig;
}
const shellShape=(s:NativeShape):Shape=>s.kind==='glyph'?'text':s.kind==='primitive'?s.primitive??'disc':s.kind;
export function fromNativeEntity(e:NativeEntity):Entity{
 const out=entity(e.name,e.shape.text??'',{x:e.x/WORLD_SCALE,y:e.y/WORLD_SCALE,z:e.z/WORLD_SCALE});
 out.id=e.id;out.kind=e.kind;out.enabled=e.enabled;out.native=clone(e);out.scale=e.scale;
 out.shape=shellShape(e.shape);out.yantraId=e.shape.yantraId;out.templateFrequency=e.shape.frequencyHz;out.templateGeometry=e.shape.plateGeometry;out.templateDimension=e.shape.dimension;
 out.size=e.extent?{x:e.extent.width/WORLD_SCALE,y:e.extent.height/WORLD_SCALE}:{x:1,y:1};
 out.rotation=(e.extent?.rotation??0)*180/Math.PI;out.share=e.kind==='pin'?0:e.share;out.tint=e.tint;out.tintWeight=e.tintWeight;
 out.force={kind:e.forces.mode,strength:e.forces.strength,radius:e.forces.radius/WORLD_SCALE,spin:e.forces.spin};out.station=e.stationIndex??null;
 out.sequence={...e.sequence,manual:e.sequence.advance==='off'&&e.sequence.links.length>1,enabled:e.sequence.advance!=='off',clock:e.sequence.advance==='morphCycle'?'morph':'seconds',steps:(e.sequence.links.length?e.sequence.links:[{id:e.id+'_base',shape:e.shape}]).map(k=>({id:k.id,native:clone(k),holdOverride:k.hold!==undefined,transitionOverride:k.transition!==undefined,text:k.shape.text??'',shape:shellShape(k.shape),yantraId:k.shape.yantraId,templateFrequency:k.shape.frequencyHz,templateGeometry:k.shape.plateGeometry,templateDimension:k.shape.dimension,hold:k.hold??e.sequence.hold,transition:k.transition??e.sequence.transition,
 position:k.x!==undefined||k.y!==undefined||k.z!==undefined?{x:(k.x??0)/WORLD_SCALE,y:(k.y??0)/WORLD_SCALE,z:(k.z??0)/WORLD_SCALE}:null}))};
 if(e.authoringSource)out.source=clone(e.authoringSource);return out;
}
export function nativeSnapshotToJourney(raw:unknown,index=0):Journey{
 assertSafe(raw);if(!raw||typeof raw!=='object')throw new Error('Not a native scene configuration');
 const value=raw as any;
 if(Number(value.schemaVersion??0)>CONFIG_SCHEMA_VERSION)throw new Error(`Native schema ${value.schemaVersion} is newer than ${CONFIG_SCHEMA_VERSION}; the original is unchanged.`);
 const source=value.config??value;
 if(!source||!['entities','fluid','glyph','spatialChakra','particleCount'].some(k=>k in source))throw new Error('Not a recognised native configuration');
 if(!source.entities&&Array.isArray(source.interaction?.placedPoints)&&source.interaction.placedPoints.length>8)throw new Error('Native pin capacity exceeded; original entries have not been truncated.');
 const rawEntities=source.entities;if(Array.isArray(rawEntities)&&(rawEntities.filter((e:any)=>e.kind==='formation').length>10||rawEntities.filter((e:any)=>e.kind==='pin').length>8))throw new Error('Native capacity exceeded; no entities were silently truncated.');
 const snapshot=migrateSnapshot(value,index);if(!snapshot)throw new Error('Native migration returned no scene');
 const cfg=snapshot.config,s=blankScene(snapshot.name),j=blankJourney();
 const completeV4=value.schemaVersion===4&&source.fluid&&source.interaction&&source.particleSize&&typeof source.particleCount==='number'&&Array.isArray(source.entities);
 s.native={config:clone(completeV4?source:cfg),original:clone(raw)};s.text=[];
 s.engine={...DEFAULT_ENGINE_SETTINGS,inkMode:cfg.colorMode,templateGeometry:cfg.cymatics?.plateGeometry,templateDimension:cfg.cymatics?.dimension,resonanceEnabled:cfg.cymatics?.enabled??false,morphEnabled:cfg.toroidalMorph?.enabled??false,autoOscillate:cfg.toroidalMorph?.autoOscillate??true,trajectory:cfg.toroidalMorph?.trajectory??'linear',driveShape:cfg.toroidalMorph?.driveShape??'sine',relationalEnabled:cfg.relational?.enabled??false,relationalMode:cfg.relational?.mode as any??'orbital',pointerMode:cfg.interaction.mode,colorMode:cfg.color?.mode??'monochrome',colorEnabled:cfg.color?.enabled??false,mediumPlane:cfg.composition?.plane??'vertical',autoSweep:cfg.cymatics?.sweep?.enabled??cfg.cymatics?.autoSweep??false,sweepDirection:cfg.cymatics?.sweep?.direction??'ascent'};
 s.field.background=cfg.backgroundColor??cfg.color?.backgroundColor??'#f4f2eb';s.field.material=cfg.style==='halftone'?'print':'ink';
 s.field.palette=cfg.color?.customPaletteColors?.length?cfg.color.customPaletteColors.slice(0,8):[cfg.color?.primaryColor??'#252720',cfg.color?.accentColor??'#252720',cfg.color?.secondaryColor??'#252720'];
 for(const b of NATIVE_BINDINGS){const v=readPath(cfg,b.path);if(typeof v==='number')bindValue(s,b.bind,v/b.factor);}
 // An absent explicit glide is not a request to copy the legacy fallback into
 // a differently bounded parameter. Retain the native fallback verbatim and
 // keep an inactive, editable default for opting into explicit timing.
 if(cfg.cymatics?.sweep?.glideS===undefined)bindValue(s,'field.params.native_cymatics__sweep__glideS',nativeBinding('native_cymatics__sweep__glideS')!.defaultValue);
 s.engine.paletteId=cfg.color?.paletteId;s.engine.paletteSource=cfg.color?.customPaletteColors?.length?'custom':'legacy';if(cfg.paperGrain===undefined)s.field.params.grain=0;s.engine.grainProfile=!!cfg.material;s.engine.backgroundMode=cfg.backgroundMode??cfg.color?.backgroundMode??'solid';s.engine.dotShape=cfg.dotShape??'circle';
 s.engine.fontFamily=cfg.fontFamily;s.engine.fontWeight=cfg.fontWeight;s.engine.resonatorMode=cfg.cymatics?.engine??'resonator';s.engine.focusOrder=cfg.composition?.orchestration.order??'listed';
 s.entities=(cfg.entities??[]).map(fromNativeEntity);
 const first=s.entities.find(e=>e.kind==='formation'&&e.enabled!==false);
 if(first&&!first.source){if(cfg.sourceType==='image'&&cfg.customImage?.dataUrl)first.source={kind:'image',image:clone(cfg.customImage)};else if(cfg.sourceType==='ascii'&&cfg.asciiGlyph?.text)first.source={kind:'ascii',ascii:clone(cfg.asciiGlyph)};}
 if(value.authoringView)s.view=clone(value.authoringView);else if(snapshot.view?.camera)s.view.nativeCamera=clone(snapshot.view.camera);
 s.composition.layout=cfg.composition?.layoutName??'free';
 s.composition.focus=cfg.composition?.orchestration.mode==='focus'?'travelling':'parallel';
 s.composition.carryTint=(cfg.composition?.orchestration.focusTintWeight??0)>0;s.composition.carryStation=cfg.composition?.orchestration.followStation??false;
 s.composition.frequencyDriver=cfg.cymatics?.sweep?.enabled||cfg.cymatics?.autoSweep||cfg.automations?.some(l=>l.enabled&&l.path==='cymatics.frequencyHz')?'automation':cfg.cymatics?.followFocus?'focus':'manual';
 s.morph.law=cfg.toroidalMorph?.interference==='toroidalOnly'?'theta':cfg.toroidalMorph?.interference??'theta';
 s.automation=(cfg.automations??[]).map(l=>{
  const b=NATIVE_BINDINGS.find(b=>b.path===l.path),eb=entityTargets(s).find(b=>b.path===l.path);
  const factor=l.blend==='multiply'?1:b?.factor??eb?.factor??1;
  return{id:l.id,nativeId:l.id,nativePath:l.path,entityId:eb?.entityId,enabled:l.enabled,target:b?'field.'+b.key:eb?.target??stableNativeTarget(s,l.path),type:l.type==='lfo'?'lfo':'ramp',wave:l.waveform==='randomStep'?'steps':l.waveform==='smoothRandom'?'smooth':l.waveform??'sine',min:(l.type==='lfo'?l.min??0:l.from??0)/factor,max:(l.type==='lfo'?l.max??1:l.to??1)/factor,rate:l.rateHz??.25,phase:l.phase??0,blend:l.blend??'replace',duration:l.durationS??2,delay:l.delayS??0,loop:l.loop==='restart'?'loop':l.loop==='pingpong'?'pingpong':'once',firedAt:l.fireToken??null,easing:l.easing??'smooth'};
 });
 if(snapshot.view?.gridMode&&!s.view.nativeScaffold)s.view.nativeScaffold=snapshot.view.gridMode;
 j.name=snapshot.name;j.description='Native scene configuration imported through schema-4 migration. Original payload retained; this is not a runtime checkpoint.';j.scenes=[s];
 checkNativeLimits(s);s.native!.projection=clone(projectNativeConfig(s));return validateJourney(j);
}
export function importDocuments(raw:unknown):{journeys:Journey[];errors:{index:number;message:string}[]}{
 const journeys:Journey[]=[],errors:{index:number;message:string}[]=[];
 for(const [index,v]of (Array.isArray(raw)?raw:[raw]).entries())try{
  assertSafe(v);const j=(v as any)?.schema==='oi.journey'?validateJourney(v):nativeSnapshotToJourney(v,index);j.scenes.forEach(checkNativeLimits);journeys.push(j);
 }catch(e){errors.push({index,message:e instanceof Error?e.message:String(e)});}
 return{journeys,errors};
}
export function nativeExport(s:Scene){return{schemaVersion:4,id:s.id,name:s.name,timestamp:Date.now(),config:toNativeConfig(s),authoringView:clone(s.view),source:s.native?.original};}
export function nativeChakras():Entity[]{return makeChakraEntities('yantra').slice().reverse().map((e,i)=>{
 const out=fromNativeEntity(e);out.position={x:.18,y:-.82+i*.274,z:0};out.size={x:.235,y:.235};out.scale=1;out.native={...e,extent:{width:94,height:94,rotation:0}};out.force.radius=.27;return out;
});}
