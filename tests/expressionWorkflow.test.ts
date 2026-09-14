import assert from 'node:assert/strict';
import {test} from './harness';
import {fieldStudies,clone,validateJourney,entity,blankScene} from '../field-studies-journeys/src/model';
import {initialiseShared,effectiveScene,toggleShared,writeShared,useLocalPointer} from '../field-studies-journeys/src/sharedSettings';
import {initialiseSceneSaves,saveScene,restoreScene,nextSceneFrom} from '../field-studies-journeys/src/sceneWorkflow';
import {foldObjectState} from '../field-studies-journeys/src/foldState';
import {stateSource,stateLabel,initialiseSources,setStateSource} from '../field-studies-journeys/src/sourceState';
import {toNativeConfig,nativeSnapshotToJourney} from '../field-studies-journeys/src/nativeBridge';
import {asciiLayout} from '../src/engine/asciiLayout';
import {sourceStudies} from '../field-studies-journeys/src/sourceExamples';
import {validateSession} from '../field-studies-journeys/src/recovery';
import {defaultCamera} from '../field-studies-journeys/src/camera';
import {validateTransport} from '../src/engine/transportState';

test('twelve masks are twelve real named source states and cutout includes O and I',()=>{
 const studies=sourceStudies(),j=studies.find(s=>s.id==='source-twelve-faces')!.expression;
 assert.equal(j.scenes.length,12);const sources=j.scenes.map(s=>stateSource(s.entities[0],0));assert.equal(new Set(sources.map(s=>s?.kind==='image'?s.image.dataUrl:'')).size,12);
 for(const s of j.scenes){const e=s.entities[0];assert.ok(stateLabel(e.sequence.steps[0]).startsWith('face-'));assert.deepEqual(e.sequence.steps[0].source,e.source);}
 assert.doesNotThrow(()=>validateJourney(j));const cutout=studies.find(s=>s.id==='source-mask-cutout')!.expression.scenes[0].entities[0];assert.equal(cutout.sequence.steps.length,3);assert.equal(cutout.sequence.steps[1].text,'O');assert.equal(stateSource(cutout,1),undefined);
});
test('expression values and toolbelt survive scene save/restore and local pointer remains independent',()=>{
 const j=initialiseShared(initialiseSceneSaves(fieldStudies())),[a,b]=j.scenes;const saved=clone(j.savedScenes);
 toggleShared(j,a,'field.params.recovery');writeShared(j,a,'field.params.recovery',2.4);
 j.shared!.toolbelt.push({id:'extra',scope:'field',key:'pointerClickStrength'});writeShared(j,a,'engine.pointerClickStrength',3.1);
 useLocalPointer(j,b,true);b.engine.pointerClickStrength=.8;
 assert.equal(effectiveScene(j,a).engine.pointerClickStrength,3.1);assert.equal(effectiveScene(j,b).engine.pointerClickStrength,.8);
 restoreScene(j,a.id);assert.equal(effectiveScene(j,j.scenes[0]).field.params.recovery,2.4);assert.equal(j.shared!.toolbelt.at(-1)!.key,'pointerClickStrength');assert.deepEqual(j.savedScenes,saved);
 useLocalPointer(j,b,false);assert.equal(effectiveScene(j,b).engine.pointerClickStrength,3.1);const restored=validateJourney(JSON.parse(JSON.stringify(j)));assert.equal(effectiveScene(restored,restored.scenes[1]).field.params.recovery,2.4);
 toggleShared(j,j.scenes[0],'field.params.native_fluid__viscosity');assert.equal(typeof j.shared!.values['field.params.native_fluid__viscosity'],'number');
});
test('folding a refined source captures geometry, force and offset while preserving named snapshots',()=>{
 const j=initialiseShared(initialiseSceneSaves(fieldStudies())),first=j.scenes[0],base=first.entities[0];base.sequence.enabled=false;base.sequence.steps=base.sequence.steps.slice(0,1);
 saveScene(j,first,'Original');const next=nextSceneFrom(j,first),obj=next.entities[0];obj.size={x:1.7,y:.9};obj.rotation=52;obj.position.x+=.3;obj.force.spin=2;
 setStateSource(obj,0,{kind:'ascii',ascii:{text:' /\\\n/__\\',fontFamily:'monospace',fontSize:32}});
 const snapshot=clone(j.savedScenes![first.id]),result=foldObjectState(j,next.id,obj.id,0,first.id,base.id,'morph',true);
 assert.equal(j.scenes.some(s=>s.id===next.id),false);const step=base.sequence.steps[result.stepIndex];assert.equal(step.source?.kind,'ascii');assert.deepEqual(step.objectState!.size,obj.size);assert.equal(step.objectState!.force.spin,2);assert.ok(Math.abs(step.position!.x-.3)<1e-10);assert.deepEqual(j.savedScenes![first.id],snapshot);
 const native=toNativeConfig(first),link=native.entities![0].sequence.links.at(-1)!;assert.equal(link.source?.kind,'ascii');assert.equal(link.state!.extent!.width,680);assert.equal(link.state!.forces.spin,2);
 const round=nativeSnapshotToJourney({schemaVersion:4,config:native});assert.equal(round.scenes[0].entities[0].sequence.steps.at(-1)!.source?.kind,'ascii');assert.doesNotThrow(()=>validateJourney(j));
});
test('source states do not alias across copies or overwrite later states',()=>{
 const j=initialiseSources(fieldStudies()),e=j.scenes[0].entities[0];setStateSource(e,0,{kind:'ascii',ascii:{text:'ABC'}});e.sequence.steps.push({...clone(e.sequence.steps[0]),id:'copy'});setStateSource(e,0,undefined);assert.equal(stateSource(e,0),undefined);assert.equal(stateSource(e,1)?.kind,'ascii');assert.equal(e.sequence.steps[1].source?.kind==='ascii'?e.sequence.steps[1].source.ascii.text:'','ABC');
});
test('large ASCII layouts keep every row and column inside the sampling canvas',()=>{
 for(const [cols,rows] of [[150,90],[4,220],[480,3]]){const drawing=Array.from({length:rows},()=>'*'.repeat(cols)).join('\r\n'),fit=asciiLayout(drawing,1024,1024,72);assert.equal(fit.lines.length,rows);assert.ok(fit.charWidth*cols<=1024*.82+.001);assert.ok(fit.lineHeight*rows<=1024*.82+.001);assert.ok(fit.fontSize>0);}
 const tabs=asciiLayout('A\tB',200,200,32);assert.equal(tabs.lines[0],'A    B');
});
test('recovery validates scene identity, clock and camera with no GPU checkpoint claim',()=>{
 const j=fieldStudies(),transport={version:1 as const,simTime:15,theta:7.2,phi:4,lanes:[['lfo',{cycle:4,lastTime:15,phaseOffset:1,rateHz:.2,startTime:0,token:0,randSeed:23,lastStep:4,lastValue:.2,nextValue:.8}]] as any};
 const input={version:1,journeyId:j.id,sceneId:j.scenes[3].id,selected:[],stepIndex:0,sceneElapsed:5,simTime:15,playing:true,journeyPlaying:false,camera:{...defaultCamera(),zoom:1.3},transport};const result=validateSession(input,j);assert.equal(result!.sceneId,j.scenes[3].id);assert.equal(result!.transport!.lanes[0][1].cycle,4);assert.equal(validateSession({...input,sceneId:'missing'},j),undefined);assert.throws(()=>validateTransport({...transport,simTime:NaN}));
});
test('invalid source state envelopes and unsafe shared paths cannot enter a document',()=>{
 const j=initialiseShared(fieldStudies());j.shared!.values['engine.__proto__']=1;assert.throws(()=>validateJourney(j),/shared/);delete j.shared!.values['engine.__proto__'];j.scenes[0].entities[0].sequence.steps[0].source={kind:'ascii',ascii:{text:'ok',fontSize:-5}};assert.throws(()=>validateJourney(j),/ASCII/);
});

test('removing a migrated first image does not resurrect the old source on reload or export',()=>{
 const j=fieldStudies(),e=j.scenes[0].entities[0];e.source={kind:'ascii',ascii:{text:'MASK'}};initialiseSources(j);e.sequence.enabled=true;e.sequence.steps.push({...clone(e.sequence.steps[0]),id:'plain',source:undefined,name:undefined,text:'I'});e.sequence.steps.shift();initialiseSources(j);assert.equal(stateSource(e,0),undefined);const cfg=toNativeConfig(j.scenes[0]);assert.equal(cfg.entities![0].authoringSource,undefined);const round=initialiseSources(nativeSnapshotToJourney({schemaVersion:4,config:cfg}));assert.equal(stateSource(round.scenes[0].entities[0],0),undefined);
});

import {transformObjectStates,captureObjectState} from '../field-studies-journeys/src/sourceState';
test('formation transform edits preserve relative differences between captured object states',()=>{
 const e=entity('Shape');e.sequence.steps[0].objectState=captureObjectState(e).objectState;e.sequence.steps.push({...clone(e.sequence.steps[0]),id:'larger'});e.sequence.steps[1].objectState!.size.x*=2;
 const a=e.sequence.steps[0].objectState!,b=e.sequence.steps[1].objectState!;transformObjectStates(e,'entity.size.x',e.size.x,e.size.x*1.5);assert.ok(Math.abs(b.size.x/a.size.x-2)<1e-10);transformObjectStates(e,'entity.rotation',0,25);assert.equal(a.rotation,25);assert.equal(b.rotation,25);
});
