/** Reversible registry projection. Factors convert authored stage units to native units. */
import {PARAM_REGISTRY,entityParamDefs} from '../../src/engine/paramRegistry';
import {DEFAULT_CONFIG} from '../../src/engine/PointCloudField';
import {readPath} from '../../src/engine/automation';
import type {Scene} from './model';
export const WORLD_SCALE = 400;
export interface NativeBinding {path:string;key:string;bind:string;factor:number;label:string;group:string;min:number;max:number;hardMin:number;hardMax:number;step:number;unit?:string;note?:string;defaultValue:number;scale?:'linear'|'log'}
const aliases:Record<string,[string,number?,string?]>={
 ...Object.fromEntries(['sizeBias','opacity','roundness','softness','irregularity','elongation','orientation','contrast','densityScale','densityPhase','edgeWeight','halo'].map(k=>['material.'+k,[k]])), paperGrain:['grain'],
 particleCount:['count'], 'particleSize.max':['size'],
 'fluid.returnSpeed':['recovery'],'fluid.vortexStrength':['circulation'],'fluid.curlScale':['turbulenceScale'],
 'fluid.curlSpeed':['speed'],'fluid.turbulence':['turbulence'],'fluid.dispersion':['dispersion'],
 'fluid.snapRigidity':['snapRigidity'],'fluid.densityTether':['densityTether'],'fluid.curlDepth':['curlDepth'],
 'fluid.vortexRadius':['vortexRadius',400],'fluid.gravityX':['gravityX'],'fluid.gravityY':['gravityY'],'fluid.gravityZ':['gravityZ'],
 'fluid.quadraticDrag':['quadraticDrag'],'fluid.thermalJitter':['thermalJitter'],'fluid.maxSpeed':['speedLimit',400],
 'fluid.zConfinement':['zConfinement'],'fluid.timeScale':['timeScale'],
 'interaction.radius':['pointerRadius',400],'interaction.strength':['pointerStrength'],'interaction.falloffPower':['pointerFalloff'],
 'relational.gravitySoftening':['gravitySoftening',400],'relational.gravityFalloff':['gravityFalloff'],'relational.swirlRadius':['swirlRadius',400],
 'cymatics.frequencyHz':['frequency'],'cymatics.dominance':['dominance'],'cymatics.driveStrength':['excitation'],
 'toroidalMorph.volumetricDepthScale':['depth'],
 'toroidalMorph.oscillationSpeed':['thetaRate',1,'morph.thetaRate'],
 'toroidalMorph.poloidalRate':['phiRate',1,'morph.phiRate'],
 'toroidalMorph.toroidalPhase':['thetaOffset',Math.PI*2,'morph.thetaOffset'],
 'toroidalMorph.poloidalPhase':['phiOffset',Math.PI*2,'morph.phiOffset'],
 'toroidalMorph.driveDepth':['morphDepth',1,'morph.depth'],
 'toroidalMorph.holdRatio':['morphDwell',1,'morph.dwell'],
 'composition.orchestration.dwell':['focusDwell',1,'composition.focusDwell'],
 'composition.orchestration.glide':['focusGlide',1,'composition.focusDuration'],
};
const groups:Record<string,string>={Fluid:'motion','Physics+':'physics',Particles:'material',Morph:'morph',Interaction:'pointer',Relational:'relational',Color:'color',Cymatics:'resonance',Composition:'composition',Material:'material',Paper:'color'};
const defaults:Record<string,number>={'color.cycleSpeed':0,'color.turbulenceModulation':0,'color.speedReactiveIntensity':0,'color.densityWeight':0,'composition.entityTintWeight':1,'composition.orchestration.dwell':0};
export const NATIVE_BINDINGS:NativeBinding[]=PARAM_REGISTRY.map(p=>{
 const a=aliases[p.path], key=a?.[0]??'native_'+p.path.replaceAll('.','__'),factor=a?.[1]??1;
 const value=defaults[p.path]??readPath(DEFAULT_CONFIG,p.path);
 return {...p,key,bind:a?.[2]??'field.params.'+key,factor,group:groups[p.group]??'physics',min:p.min/factor,max:p.max/factor,hardMin:p.hardMin/factor,hardMax:p.hardMax/factor,step:p.step/factor,
  unit:factor===400?'stage units':factor===Math.PI*2?'turns':p.unit,
  defaultValue:typeof value==='number'?value/factor:p.min/factor,note:p.hint};
});
export const nativeBinding=(key:string)=>NATIVE_BINDINGS.find(b=>b.key===key);
export function baseValue(scene:Scene,key:string):number {
 const b=nativeBinding(key), value=b?readPath(scene,b.bind):scene.field.params[key];
 return typeof value==='number'&&Number.isFinite(value)?value:b?.defaultValue??0;
}
export function bindValue(scene:Scene,path:string,value:unknown){
 const keys=path.split('.');if(keys.some(k=>['__proto__','prototype','constructor'].includes(k)))throw new Error('Unsafe document path');
 let o:any=scene;for(const k of keys.slice(0,-1))o=o[k]??(o[k]={});o[keys.at(-1)!]=value;
}

export interface AutomationTarget extends NativeBinding {target:string;entityId?:string;value:number}
/** Entity automation is addressed by stable ID in documents, resolved to an index only at the native boundary. */
export function entityTargets(scene:Scene):AutomationTarget[]{
 return scene.entities.flatMap((e,index)=>entityParamDefs(index,e).filter(p=>e.kind==='formation'||!p.path.endsWith('.scale')&&!p.path.includes('.sequence.')&&!p.path.endsWith('.tintWeight')).map(p=>{
  const suffix=p.path.replace(/^entities\.\d+\./,''),factor=['x','y','z','forces.radius'].includes(suffix)?WORLD_SCALE:1;
  const local=['x','y','z'].includes(suffix)?'position.'+suffix:suffix.replace(/^forces\./,'force.');
  let value=readPath(e,local);if(typeof value!=='number'){value=readPath(e.native,suffix);if(typeof value==='number')value/=factor;}
  if(typeof value!=='number')value=suffix==='scale'||suffix==='sequence.rateMul'?1:suffix==='sequence.hold'?e.sequence.steps[0]?.hold??3:suffix==='sequence.transition'?e.sequence.steps[0]?.transition??1:0;

  return {...p,key:suffix,bind:'entity.'+local,factor,group:'entity',target:'entity:'+encodeURIComponent(e.id)+':'+suffix,entityId:e.id,min:p.min/factor,max:p.max/factor,hardMin:p.hardMin/factor,hardMax:p.hardMax/factor,step:p.step/factor,defaultValue:Number(value),value:Number(value)};
 }));
}
export function automationTarget(scene:Scene,target:string):AutomationTarget|undefined{
 if(target.startsWith('field.')){const b=nativeBinding(target.slice(6));return b?{...b,target,value:baseValue(scene,b.key)}:undefined;}
 return entityTargets(scene).find(b=>b.target===target);
}
export function automationTargets(scene:Scene):AutomationTarget[]{return [...NATIVE_BINDINGS.map(b=>({...b,target:'field.'+b.key,value:baseValue(scene,b.key)})),...entityTargets(scene)];}
