/** Independent contract tests: expectations are produced by the immutable native
 * checkout, never by the bridge under test. No browser mocks or network access. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import * as Ref from '../../.parity-reference/master/src/engine/fieldModel';
import * as RefAuto from '../../.parity-reference/master/src/engine/automation';
import {computeMorphDrive as refDrive,DEFAULT_CONFIG as referenceDefault} from '../../.parity-reference/master/src/engine/PointCloudField';
import {migrateConfig as refMigrate} from '../../.parity-reference/master/src/engine/configMigration';
import {PARAM_REGISTRY as referenceRegistry} from '../../.parity-reference/master/src/engine/paramRegistry';
import {FACTORY_PRESETS as referencePresets} from '../../.parity-reference/master/src/engine/factoryPresets';
import {CHAIN_PRESETS as referenceChains,GLYPH_CATEGORIES as referenceGlyphs} from '../../.parity-reference/master/src/engine/glyphLibrary';
import {COLOR_PALETTES as referencePalettes,BACKGROUND_THEMES as referencePapers} from '../../.parity-reference/master/src/engine/colorPalettes';
import {CANONICAL_CHAKRAS} from '../../.parity-reference/master/src/engine/chakraSystem';
import * as Native from '../../src/engine/fieldModel';
import * as Auto from '../../src/engine/automation';
import {computeMorphDrive} from '../../src/engine/PointCloudField';
import {CymaticResonator} from '../../src/engine/cymaticResonator';
import {nativeSnapshotToJourney,toNativeConfig,nativeExport,importDocuments,fromNativeEntity} from '../../field-studies-journeys/src/nativeBridge';
import {NATIVE_BINDINGS,bindValue,automationTarget} from '../../field-studies-journeys/src/nativeParameters';
import {applyPalette,applyBackground,applyChain,applyKundaliniSequence,NATIVE_LAYOUTS,COLOR_PALETTES,BACKGROUND_THEMES,CHAIN_PRESETS,GLYPH_CATEGORIES} from '../../field-studies-journeys/src/nativeFeatures';
import {blankScene,validateJourney,clone} from '../../field-studies-journeys/src/model';

const results:any[]=[];
const clean=(x:any)=>JSON.parse(JSON.stringify(x));
const eq=(a:any,b:any,message?:string)=>assert.deepStrictEqual(clean(a),clean(b),message);
function check(id:string,fn:()=>any){try{const detail=fn();results.push({id,ok:true,...(detail===undefined?{}:{detail})});console.log('PASS',id);}catch(error){results.push({id,ok:false,error:error instanceof Error?error.message:String(error)});console.error('FAIL',id,(error as Error).message.slice(0,900));}}
function seeded<T>(fn:()=>T){const old=Math.random;let seed=727;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;try{return fn();}finally{Math.random=old;}}
const fixtures=seeded(()=>[
 ...referencePresets.map(p=>({id:'factory-'+p.id,config:clean(refMigrate(p.config))})),
 ...Ref.COMPOSITION_PRESETS.map(p=>({id:'composition-'+p.id,config:clean(refMigrate(p.build() as any))})),
 {id:'zero-values',config:clean(RefAuto.writePath(RefAuto.writePath(refMigrate(referenceDefault),'fluid.viscosity',0),'relational.orbitSpeed',0))},
 {id:'unknown-and-inactive-assets',config:{...clean(refMigrate(referenceDefault)),extension:{source:'retain',values:[0,false,'']},customImage:{mode:'edgeSobel',threshold:.4,invert:true,scale:.7,dataUrl:'data:image/png;base64,AA=='},asciiGlyph:{text:'retained',fontSize:17},sourceType:'composition'}},
 {id:'non-default-native',config:{...clean(refMigrate(referenceDefault)),particleCount:12873,material:undefined,automations:[{id:'native-lfo',path:'entities.0.x',enabled:true,type:'lfo',waveform:'triangle',min:-71,max:83,rateHz:.37,phase:.13,blend:'add'}]}}
]);
for(const f of fixtures)check('PAR-CONFIG:'+f.id,()=>{
 const before=clean(f.config),j=nativeSnapshotToJourney({schemaVersion:4,name:f.id,config:before});
 eq(toNativeConfig(j.scenes[0]),before,'direct native round trip');
 eq(nativeExport(validateJourney(clean(j)).scenes[0]).config,before,'saved expression round trip');
 eq(f.config,before,'original input untouched');return{particleCount:before.particleCount};
});
check('PAR-EDIT',()=>{
 const cfg=clean(refMigrate(referenceDefault));cfg.extension={retained:true};
 const s=nativeSnapshotToJourney({schemaVersion:4,config:cfg}).scenes[0];s.entities[0].position.x+=.25;
 const expected=clean(cfg);expected.entities[0].x+=100;eq(toNativeConfig(s),expected);
});
check('PAR-LEGACY-EXPRESSION-ENVELOPE',()=>{
 const cfg=clean(refMigrate(referenceDefault)),j=nativeSnapshotToJourney({schemaVersion:4,config:cfg});
 delete j.scenes[0].native!.projection;j.scenes[0].field.params.recovery=7.25;
 const expected=RefAuto.writePath(cfg,'fluid.returnSpeed',7.25);eq(toNativeConfig(validateJourney(clean(j)).scenes[0]),expected);
});
for(const p of referenceRegistry){
 const binding=NATIVE_BINDINGS.find(b=>b.path===p.path);
 check('PAR-NUMERIC:'+p.path,()=>{
  assert.ok(binding,'native registry owner missing');
  for(const value of [...new Set([p.hardMin,p.min,p.max,p.hardMax])]){
   const cfg=RefAuto.writePath(clean(refMigrate(referenceDefault)),p.path,value);
   const s=nativeSnapshotToJourney({schemaVersion:4,config:cfg}).scenes[0];
   eq(toNativeConfig(s),cfg,'unchanged endpoint must retain complete native input');
   const edit=(p.min+p.max)/2;
   bindValue(s,binding!.bind,edit/binding!.factor);
   const actual=toNativeConfig(s);assert.ok(Math.abs(Number(RefAuto.readPath(actual,p.path))-edit)<=1e-9*Math.max(1,Math.abs(edit)),p.path+' edited units');
   const expected=RefAuto.writePath(cfg,p.path,RefAuto.readPath(actual,p.path));eq(actual,expected,'isolated numeric edit must not change neighbours');
  }
  return{path:p.path,hardMin:p.hardMin,hardMax:p.hardMax};
 });
}
check('PAR-PHASE',()=>{let cases=0;for(const trajectory of ['linear','toroidalHopf','vortexSpiral','quantumInterference'])for(const driveShape of ['sine','triangle','smooth','pulse'])for(const interference of ['toroidalOnly','product','sum','beat'])for(const t of [-12.1,0,.3,Math.PI,8.7]){const cfg={...referenceDefault.toroidalMorph!,trajectory,driveShape,interference,holdRatio:.4,driveDepth:1.4} as any;eq(computeMorphDrive(cfg,t,t*.37),refDrive(cfg,t,t*.37));cases++;}return{cases};});
check('PAR-SEQUENCE',()=>{let cases=0;for(const advance of ['off','time','morphCycle'])for(const order of ['loop','pingpong','random'])for(const easing of ['linear','smoothstep','kineticSnap','whip'])for(const jitter of [0,.31])for(const t of [0,.35,1.7,9.4,18]){const e=Ref.makeFormation({id:'independent-formation',sequence:{...Ref.DEFAULT_SEQUENCE,links:['O','I','&'].map((text,i)=>({id:'link-'+i,shape:{kind:'glyph',text}})),advance,order,easing,jitter,hold:.3,transition:1.2,phaseOffset:.13,rateMul:1.7}} as any);eq(Native.resolveSequence(e as any,t,t*.73,.23,.4),Ref.resolveSequence(e,t,t*.73,.23,.4));cases++;}return{cases};});
check('PAR-FOCUS',()=>{let cases=0;for(const mode of ['parallel','focus'])for(const order of ['listed','reverse','pingpong'])for(const n of [0,1,2,7,10])for(const t of [0,.3,2.8,9,100]){const cfg={...Ref.DEFAULT_COMPOSITION,orchestration:{...Ref.DEFAULT_COMPOSITION.orchestration,mode,order,dwell:.4,glide:1.7}} as any;eq(Native.resolveFocus(n,cfg,t),Ref.resolveFocus(n,cfg,t));cases++;}return{cases};});
check('PAR-AUTOMATION',()=>{let cases=0;for(const waveform of ['sine','triangle','square','saw','randomStep','smoothRandom'])for(const blend of ['replace','add','multiply']){
 const lane={id:'exact-lane',enabled:true,type:'lfo',path:'fluid.turbulence',waveform,blend,min:-.3,max:1.7,rateHz:.31,phase:.27} as any;
 const ar=RefAuto.createAutomationRuntime(),br=Auto.createAutomationRuntime();
 for(const t of [0,.2,1.9,6.3,15]){const a=seeded(()=>RefAuto.applyAutomations(referenceDefault,[lane],t,ar));const b=seeded(()=>Auto.applyAutomations(referenceDefault,[lane],t,br));eq(b,a);cases++;}
 }for(const easing of ['linear','smooth','easeIn','easeOut','elastic','bounce'])for(const loop of ['none','restart','pingpong']){
 const lane={id:'ramp',enabled:true,type:'oneShot',path:'fluid.turbulence',from:.2,to:1.6,delayS:.2,durationS:1.7,easing,loop,blend:'add',fireToken:1} as any;
 const ar=RefAuto.createAutomationRuntime(),br=Auto.createAutomationRuntime();for(const t of [0,.1,.5,1.2,2.2,8]){eq(seeded(()=>Auto.applyAutomations(referenceDefault,[lane],t,br)),seeded(()=>RefAuto.applyAutomations(referenceDefault,[lane],t,ar)));cases++;}}
 const cfg=clean(referenceDefault),lanes=[{id:'a',path:'fluid.turbulence',enabled:true,type:'lfo',min:2,max:2,blend:'add'},{id:'b',path:'fluid.turbulence',enabled:true,type:'lfo',min:3,max:3,blend:'multiply'}] as any;
 eq(Auto.applyAutomations(cfg,lanes,0,Auto.createAutomationRuntime()).config.fluid.turbulence,3*cfg.fluid.turbulence);return{cases};
});
check('PAR-UNREGISTERED-LANES-REORDER',()=>{
 const cfg=clean(refMigrate(referenceDefault));cfg.entities.push({...clean(cfg.entities[0]),id:'second'});
 cfg.automations=[{id:'unknown-entity',path:'entities.0.sequence.impulse',enabled:true,type:'lfo',min:0,max:2},{id:'unknown-link',path:'entities.0.sequence.links.0.frequency',enabled:true,type:'lfo',min:0,max:1}];cfg.entities[0].sequence.links[0].frequency=.5;
 const s=nativeSnapshotToJourney({schemaVersion:4,config:cfg}).scenes[0];s.entities.reverse();s.entities[1].sequence.steps.reverse();const out=toNativeConfig(s);
 assert.equal(out.automations![0].path,'entities.1.sequence.impulse');assert.equal(out.automations![1].path,'entities.1.sequence.links.1.frequency');assert.ok(out.automations!.every(l=>l.enabled));
 assert.ok(s.automation.every(l=>automationTarget(s,l.target)));
});
check('PAR-NATIVE-LAYOUTS',()=>{
 const source=fs.readFileSync('.parity-reference/master/src/components/CompositionPanel.tsx','utf8');
 const ast=ts.createSourceFile('reference.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let literal='';for(const statement of ast.statements)if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations)if(d.name.getText(ast)==='LAYOUTS')literal=d.initializer!.getText(ast);
 assert.ok(literal);const code=ts.transpileModule('const value = '+literal+'; value;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const expected=vm.runInNewContext(code);assert.deepEqual(Object.keys(NATIVE_LAYOUTS),Object.keys(expected));for(const key of Object.keys(expected))for(const n of [1,2,3,7,10])eq(NATIVE_LAYOUTS[key](n),expected[key](n));return{layouts:Object.keys(expected),sizes:5};
});
check('PAR-CATALOGUES',()=>{eq(COLOR_PALETTES,referencePalettes);eq(BACKGROUND_THEMES,referencePapers);eq(CHAIN_PRESETS,referenceChains);eq(GLYPH_CATEGORIES,referenceGlyphs);return{palettes:referencePalettes.length,papers:referencePapers.length,chains:referenceChains.length,glyphs:referenceGlyphs.reduce((n,c)=>n+c.items.length,0)};});
check('PAR-PALETTES-PAPERS',()=>{
 for(const p of referencePalettes){const s=blankScene();applyPalette(s,p.id);const cfg=toNativeConfig(s);assert.equal(cfg.color!.mode,p.recommendedMode);eq([cfg.color!.primaryColor,cfg.color!.accentColor,cfg.color!.secondaryColor],[p.primary,p.accent,p.secondary]);assert.equal(cfg.color!.customPaletteColors,undefined);}
 for(const p of referencePapers){const s=blankScene();applyBackground(s,p.id);assert.equal(toNativeConfig(s).backgroundColor,p.color);}return{palettes:referencePalettes.length,papers:referencePapers.length};
});
check('PAR-CHAIN-CATALOGUE',()=>{for(const p of referenceChains){const s=fromNativeEntity(Ref.makeFormation() as any);applyChain(s,p.id);eq(s.sequence.steps.map(l=>l.text),p.chain);if(p.recommendedHold!==undefined)assert.equal(s.sequence.hold,p.recommendedHold);if(p.recommendedTransition!==undefined)assert.equal(s.sequence.transition,p.recommendedTransition);}return{chains:referenceChains.length};});
check('PAR-NATIVE-KUNDALINI-LINKS',()=>{const e=fromNativeEntity(Ref.makeFormation() as any);applyKundaliniSequence(e);eq(e.sequence.steps.map(l=>l.text),[...CANONICAL_CHAKRAS].reverse().map(c=>c.seedSyllable));assert.ok(e.sequence.steps.every(l=>l.position));});
check('FIX-PAUSED-RESONATOR',()=>{const r=new CymaticResonator({modeCount:64});for(let i=0;i<8;i++)r.step(1/60,396);r.configure({modeCount:1});const re=Array.from(r.re),im=Array.from(r.im);r.step(0,800);eq(Array.from(r.re),re);eq(Array.from(r.im),im);});
check('PAR-WIDE-SIGNED-AUTOMATION',()=>{
 const cfg=clean(refMigrate(referenceDefault));
 cfg.automations=[{id:'signed',path:'fluid.maxSpeed',enabled:true,type:'lfo',waveform:'sine',min:1e6,max:1e7,rateHz:-.25,phase:-37,blend:'replace'},
 {id:'immediate',path:'fluid.turbulence',enabled:true,type:'oneShot',from:0,to:1,durationS:0,delayS:-.1,fireToken:-1}];
 const j=nativeSnapshotToJourney({schemaVersion:4,config:cfg});eq(toNativeConfig(validateJourney(clean(j)).scenes[0]),cfg);
 eq(Auto.applyAutomations(cfg,cfg.automations,1,Auto.createAutomationRuntime()),RefAuto.applyAutomations(cfg,cfg.automations,1,RefAuto.createAutomationRuntime()));
});
check('PAR-PUBLIC-API-SURFACE',()=>{
 const methods=(path:string)=>{const text=fs.readFileSync(path,'utf8'),ast=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);const c=ast.statements.find(s=>ts.isClassDeclaration(s)&&s.name?.text==='PointCloudField') as ts.ClassDeclaration;return c.members.filter(m=>ts.isMethodDeclaration(m)&&!m.modifiers?.some(x=>x.kind===ts.SyntaxKind.PrivateKeyword)).map(m=>m.name!.getText(ast));};
 const reference=methods('.parity-reference/master/src/engine/PointCloudField.ts'),actual=methods('src/engine/PointCloudField.ts');
 assert.ok(reference.every(k=>actual.includes(k)),'Native public API removed');
 const wrapper='src/components/PointCloudComponent.tsx';assert.equal(fs.readFileSync(wrapper,'utf8'),fs.readFileSync('.parity-reference/master/'+wrapper,'utf8'),'Embeddable React wrapper changed');return {publicMethods:reference,unchangedReactWrapper:true};
});
check('PAR-SAFE-IMPORT',()=>{const raw=[{schemaVersion:99,config:fixtures[0].config},{schemaVersion:4,config:fixtures[1].config}];const before=clean(raw),result=importDocuments(raw);assert.equal(result.journeys.length,1);assert.equal(result.errors.length,1);eq(raw,before);assert.throws(()=>Auto.writePath({},'__proto__.polluted',true));});
fs.mkdirSync('field-studies-journeys/evidence-native',{recursive:true});
fs.writeFileSync('field-studies-journeys/evidence-native/parity-independent.json',JSON.stringify({reference:'63e650d26a04447b973f73dded6b5046a0829e84',fixtureCount:fixtures.length,results,passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length},null,2));
console.log(`${results.filter(r=>r.ok).length}/${results.length} independent cases passed`);
if(results.some(r=>!r.ok))process.exitCode=1;
