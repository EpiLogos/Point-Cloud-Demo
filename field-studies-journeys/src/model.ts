/** Authoring schema. Deliberately NOT the production engine's schema-4 snapshot. */
export type Vec3 = {x:number;y:number;z:number};
export type Plane = 'XY'|'XZ'|'YZ';
export type Tool = 'select'|'interact'|'pin'|'formation'|'text'|'orbit';
export type Shape = 'text'|'ring'|'disc'|'square'|'triangle';
export type Material = 'ink'|'print'|'round';
export interface SequenceStep {id:string;text:string;shape:Shape;hold:number;transition:number;position:Vec3|null}
export interface Entity {
 id:string;name:string;kind:'formation'|'pin';position:Vec3;size:{x:number;y:number};rotation:number;
 shape:Shape;text:string;share:number;tint:string;tintWeight:number;locked:boolean;
 force:{kind:'attract'|'repel'|'vortex';strength:number;radius:number;spin:number};station:number|null;
 sequence:{enabled:boolean;clock:'seconds'|'morph';steps:SequenceStep[]};
}
export interface TextLayer {id:string;visible:boolean;kicker:string;title:string;italic:string;body:string;x:number;y:number;width:number;size:number;align:'left'|'center'|'right'}
export interface AutomationLane {id:string;enabled:boolean;target:string;type:'lfo'|'ramp';wave:'sine'|'triangle'|'square'|'saw'|'steps'|'smooth';min:number;max:number;rate:number;phase:number;blend:'replace'|'add'|'multiply';duration:number;delay:number;loop:'once'|'loop'|'pingpong';firedAt:number|null}
export interface Scene {
 id:string;name:string;character:string;duration:number;transition:number;
 view:{mode:'2d'|'3d';yaw:number;pitch:number;zoom:number;panX:number;panY:number};
 field:{background:string;palette:string[];material:Material;params:Record<string,number>};
 entities:Entity[];text:TextLayer[];
 composition:{layout:string;plane:Plane;focus:'parallel'|'travelling';focusDuration:number;carryTint:boolean;carryStation:boolean;frequencyDriver:'manual'|'focus'|'automation'};
 morph:{thetaRate:number;phiRate:number;thetaOffset:number;phiOffset:number;law:'theta'|'product'|'sum'|'beat';depth:number;dwell:number};
 automation:AutomationLane[];
}
export interface Journey {schema:'oi.journey';version:1;id:string;name:string;description:string;loop:boolean;scenes:Scene[];updatedAt:string}
export const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
export const uid=(prefix='id')=>prefix+'-'+(globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2,12));
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const DEFAULT_PARAMS:Record<string,number>={
 count:62000,size:.95,sizeBias:1.6,opacity:.92,roundness:.95,softness:.15,irregularity:.35,elongation:.04,orientation:0,jitter:.8,
 contrast:.93,densityScale:1,densityPhase:.3,edgeWeight:0,halo:.13,thickness:.035,warp:.4,
 speed:.7,circulation:1,turbulence:.22,turbulenceScale:1.2,damping:1.4,recovery:1.1,flow:1,dispersion:.09,
 pointerStrength:.8,pointerRadius:.23,pointerFalloff:2,depth:.12,grain:.035,
 snapRigidity:1,densityTether:1,curlDepth:.2,vortexRadius:.4,gravityX:0,gravityY:0,gravityZ:0,quadraticDrag:.2,thermalJitter:0,speedLimit:3,zConfinement:1,timeScale:1,gravitySoftening:.1,gravityFalloff:2,swirlRadius:.4,
 frequency:220,dominance:0,resonanceDamping:.04,excitation:.6,
};
export function entity(name:string,text='O',position:Vec3={x:0,y:0,z:0}):Entity{return {
 id:uid('entity'),name,kind:'formation',position:{...position},size:{x:.65,y:.86},rotation:0,shape:'text',text,share:1,tint:'#252720',tintWeight:0,locked:false,
 force:{kind:'attract',strength:0,radius:.45,spin:0},station:null,sequence:{enabled:false,clock:'seconds',steps:[{id:uid('step'),text,shape:'text',hold:3,transition:1,position:null}]}
};}
export function pin(position:Vec3):Entity{const e=entity('Attractor','',position);e.kind='pin';e.share=0;e.force.strength=1;e.size={x:.1,y:.1};return e;}
export function blankScene(name='Untitled scene'):Scene{return{
 id:uid('scene'),name,character:'An arrangement, waiting to happen.',duration:12,transition:1.5,
 view:{mode:'2d',yaw:0,pitch:0,zoom:1,panX:0,panY:0},
 field:{background:'#f4f2eb',palette:['#252720','#252720'],material:'ink',params:{...DEFAULT_PARAMS}},entities:[],
 text:[{id:uid('text'),visible:true,kicker:'A FIELD STUDY',title:'A place for',italic:'something new.',body:'Start with a centre. Let the rest follow.',x:.033,y:.595,width:240,size:44,align:'left'}],
 composition:{layout:'free',plane:'XY',focus:'parallel',focusDuration:4,carryTint:true,carryStation:false,frequencyDriver:'manual'},
 morph:{thetaRate:.08,phiRate:.13,thetaOffset:0,phiOffset:0,law:'theta',depth:1,dwell:.3},automation:[]
};}
const descriptions=[
 ['Ink','Between','form & field.','Fine, irregular stippling.\nForm on the edge of dissolution.'],
 ['Print','The print','comes undone.','An imperfect lattice.\nA surface beginning to move.'],
 ['Gather','Gathering','a current.','Rounded grains find\na shared current.'],
 ['Between','Neither one.','Nor two.','Two characters, one material.\nAn unsettled identity.'],
 ['Language','A language','of particles.','A different character.\nThe same living field.'],
 ['Weather','A change','in the weather.','No centre, no logo.\nOnly changing concentrations.'],
 ['Quiet','Room for','something else.','A little less certainty.\nA little more space.'],
 ['Nocturne','What the','dark holds.','Light collected in the dark.\nSomething quietly taking form.']
];
export function fieldStudies():Journey {
 const scenes=descriptions.map((d,i)=>{const s=blankScene(d[0]);s.id='study-'+i;s.character=d[3].replace('\n',' ');s.duration=14;s.text[0]={...s.text[0],id:'editorial',kicker:'STUDY '+String(i+1).padStart(2,'0')+' / LIVE MATTER',title:d[1],italic:d[2],body:d[3]};
 const o=entity('O — opening','O',{x:-.22,y:.03,z:0});o.id='opening-o';o.size={x:1.43,y:1.63};o.rotation=-5;
 o.share=4;const ii=entity('I — interval','I',{x:.66,y:.015,z:0});ii.id='opening-i';ii.size={x:.28,y:1.62};ii.share=1;s.entities=[o,ii];
 if(i===1){s.field.material='print';Object.assign(s.field.params,{count:24000,size:1.55,contrast:.7,warp:.12,jitter:.08,roundness:.15,dispersion:.025,speed:.4});}
 if(i===2){const e=entity('Gathering ring','O');e.id='opening-o';e.shape='ring';e.size={x:1.6,y:1.64};s.entities=[e];s.field.material='round';Object.assign(s.field.params,{count:28000,size:1.7,contrast:.75,warp:.4,densityPhase:2});}
 if(i===3){o.position.x=-.14;o.rotation=-17;ii.position.x=.40;ii.rotation=10;Object.assign(s.field.params,{warp:.8,dispersion:.16,contrast:.86});}
 if(i===4){o.text='&';o.name='Ampersand';o.size={x:1.25,y:1.5};o.position.x=.1;o.rotation=0;s.entities=[o];Object.assign(s.field.params,{warp:.12,contrast:.6});}
 if(i===5){o.shape='square';o.name='Atmosphere';o.position.x=0;o.size={x:3.6,y:2.5};s.entities=[o];Object.assign(s.field.params,{count:52000,size:.7,contrast:.98,densityScale:1.8,warp:.25,opacity:.5,dispersion:.4});}
 if(i===6){o.position.x=.2;o.size={x:1.15,y:1.55};ii.position.x=.84;s.field.palette=['#8b8576','#c5bba3'];Object.assign(s.field.params,{count:29000,opacity:.5,size:.65,contrast:.7,warp:.14});}
 if(i===7){s.field.background='#1d231f';s.field.palette=['#eee9d9','#a9b399'];Object.assign(s.field.params,{opacity:.9,densityPhase:1.9});}
 return s;});
 return {schema:'oi.journey',version:1,id:'field-studies',name:'Field studies',description:'Eight states of a living material. A journey from ink to atmosphere.',loop:true,scenes,updatedAt:new Date().toISOString()};
}
export function chakraEntities():Entity[]{return ['Root','Sacral','Solar','Heart','Throat','Brow','Crown'].map((name,i)=>{const e=entity(name,['△','◯','△','✧','◯','∞','✧'][i],{x:.18,y:-.82+i*.274,z:0});e.size={x:.235,y:.235};e.tint=['#a94138','#c67c46','#c2a852','#638c69','#5898a4','#737599','#a590b0'][i];e.tintWeight=1;e.station=i;e.force={kind:'vortex',strength:.3,radius:.27,spin:.12};return e;});}
export function sevenCentres():Journey{const s=blankScene('Seven centres');s.entities=chakraEntities();s.field.params.count=42000;s.field.params.contrast=.5;s.field.params.warp=.12;s.text[0]={...s.text[0],kicker:'SEVEN CENTRES / ONE FIELD',title:'A body of',italic:'relationships.',body:'Seven places to gather.\nOne continuous medium.'};s.composition.layout='column';const t=clone(s);t.id=uid('scene');t.name='A rising attention';t.composition.focus='travelling';t.text[0].title='Attention';t.text[0].italic='travels.';return {schema:'oi.journey',version:1,id:'seven-centres',name:'Seven centres',description:'A spatial composition; not seven isolated simulations.',loop:true,scenes:[s,t],updatedAt:new Date().toISOString()};}
export function smallLanguage():Journey {const j=fieldStudies();j.id='small-language';j.name='A small language';j.description='Three characters, and the intervals between them.';j.scenes=[j.scenes[0],j.scenes[4],j.scenes[6]].map((s,i)=>{s.id=uid('scene');s.name=['A beginning','And','An opening'][i];s.text[0].kicker='A SMALL LANGUAGE / '+String(i+1).padStart(2,'0');return s;});return j;}
export function blankJourney():Journey{return {schema:'oi.journey',version:1,id:uid('journey'),name:'Untitled journey',description:'',loop:true,scenes:[blankScene()],updatedAt:new Date().toISOString()};}
/** Validate before use. Reject malformed documents; never silently claim schema-4 migration. */
export function validateJourney(value:unknown):Journey {
 if(!value||typeof value!=='object')throw new Error('Choose a Field Studies journey JSON file.');
 const j=value as Journey;
 if(j.schema!=='oi.journey'||j.version!==1)throw new Error('This is not a journey-schema 1 document. Production schema-4 snapshots need the engine integration adapter; they are not silently converted.');
 const finite=(n:unknown,a:number,b:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
 const str=(s:unknown,max=5000)=>typeof s==='string'&&s.length<=max;
 const safeId=(s:unknown)=>typeof s==='string'&&/^[a-zA-Z0-9_.:-]{1,160}$/.test(s);
 const color=(s:unknown)=>typeof s==='string'&&/^#[\da-f]{6}$/i.test(s);
 if(!str(j.name,160)||!safeId(j.id)||!str(j.description)||typeof j.loop!=='boolean'||!Array.isArray(j.scenes)||!j.scenes.length||j.scenes.length>64)throw new Error('Journey metadata or scene count is invalid (1–64 scenes).');
 const ids=new Set<string>();
 for(const s of j.scenes){if(!safeId(s.id)||ids.has(s.id)||!str(s.name,160)||!str(s.character)||!finite(s.duration,1,3600)||!finite(s.transition,0,30))throw new Error('Invalid or duplicate scene.');ids.add(s.id);
  if(!s.view)s.view={mode:'2d',yaw:0,pitch:0,zoom:1,panX:0,panY:0};
  if(!['2d','3d'].includes(s.view.mode)||!finite(s.view.yaw,-1000,1000)||!finite(s.view.pitch,-1000,1000)||!finite(s.view.zoom,.2,4)||!finite(s.view.panX,-10,10)||!finite(s.view.panY,-10,10))throw new Error('Invalid scene framing.');
  if(!s.field||!color(s.field.background)||!['ink','print','round'].includes(s.field.material)||!Array.isArray(s.field.palette)||s.field.palette.length<2||s.field.palette.length>8||!s.field.palette.every(color)||!s.field.params)throw new Error('Scene material or palette is invalid.');
  for(const [key,defaultValue] of Object.entries(DEFAULT_PARAMS)){if(!(key in s.field.params))s.field.params[key]=defaultValue;if(!finite(s.field.params[key],-1000000,1000000))throw new Error('Invalid numeric field parameter: '+key);}
  if(!Array.isArray(s.entities)||s.entities.length>32||!Array.isArray(s.text)||s.text.length>16||!Array.isArray(s.automation)||s.automation.length>64)throw new Error('Scene exceeds safe authoring limits.');
  const eids=new Set<string>();for(const e of s.entities){if(!safeId(e.id)||eids.has(e.id)||!str(e.name,160)||!str(e.text,120)||!['formation','pin'].includes(e.kind)||!['text','ring','disc','square','triangle'].includes(e.shape))throw new Error('Invalid entity.');eids.add(e.id);
   if(!e.position||!Object.values(e.position).every(n=>finite(n,-100,100))||!['x','y','z'].every(k=>finite(e.position[k as keyof Vec3],-100,100))||!e.size||!finite(e.size.x,.01,20)||!finite(e.size.y,.01,20)||!finite(e.rotation,-36000,36000)||!finite(e.share,0,100)||!color(e.tint)||!finite(e.tintWeight,0,1)||typeof e.locked!=='boolean')throw new Error('Invalid entity transform or appearance.');
   if(!e.force||!['attract','repel','vortex'].includes(e.force.kind)||!finite(e.force.strength,0,20)||!finite(e.force.radius,.01,20)||!finite(e.force.spin,-20,20)||!(e.station===null||Number.isInteger(e.station)&&e.station>=0&&e.station<7))throw new Error('Invalid entity influence.');
   if(!e.sequence||typeof e.sequence.enabled!=='boolean'||!['seconds','morph'].includes(e.sequence.clock)||!Array.isArray(e.sequence.steps)||e.sequence.steps.length>32)throw new Error('Invalid sequence.');
   for(const step of e.sequence.steps){if(!safeId(step.id)||!str(step.text,120)||!['text','ring','disc','square','triangle'].includes(step.shape)||!finite(step.hold,0,120)||!finite(step.transition,.05,120)||step.position!==null&&(!step.position||!['x','y','z'].every(k=>finite(step.position![k as keyof Vec3],-100,100))))throw new Error('Invalid sequence step.');}
  }
  for(const t of s.text){if(!safeId(t.id)||!str(t.kicker,300)||!str(t.title,300)||!str(t.italic,300)||!str(t.body)||!finite(t.x,-.5,1.5)||!finite(t.y,-.5,1.5)||!finite(t.width,60,1000)||!finite(t.size,14,150)||!['left','center','right'].includes(t.align)||typeof t.visible!=='boolean')throw new Error('Invalid page text.');}
  if(!s.composition||!['XY','XZ','YZ'].includes(s.composition.plane)||!['parallel','travelling'].includes(s.composition.focus)||!finite(s.composition.focusDuration,.2,120)||!['manual','focus','automation'].includes(s.composition.frequencyDriver))throw new Error('Invalid composition.');
  if(!s.morph||!['theta','product','sum','beat'].includes(s.morph.law)||!finite(s.morph.thetaRate,0,20)||!finite(s.morph.phiRate,0,20)||!finite(s.morph.thetaOffset,-100,100)||!finite(s.morph.phiOffset,-100,100)||!finite(s.morph.depth,0,2)||!finite(s.morph.dwell,0,.95))throw new Error('Invalid morph clock.');
  for(const a of s.automation){if(!safeId(a.id)||!str(a.target,250)||!['lfo','ramp'].includes(a.type)||!['sine','triangle','square','saw','steps','smooth'].includes(a.wave)||!['replace','add','multiply'].includes(a.blend)||!['once','loop','pingpong'].includes(a.loop)||![a.min,a.max,a.rate,a.phase,a.duration,a.delay].every(n=>finite(n,-100000,100000))||a.rate<0||a.duration<=0||a.delay<0||!(a.firedAt===null||finite(a.firedAt,0,1e10)))throw new Error('Invalid automation lane.');}
 }
 return clone(j);
}
