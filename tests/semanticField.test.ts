import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from './harness.ts';
import { CymaticResonator } from '../src/engine/cymaticResonator.ts';
import { SemanticFieldRuntime } from '../src/engine/semantics/semanticFieldRuntime.ts';
import { mapChakrasToAnchors, CHAKRA_PROFILE_ID } from '../src/engine/semantics/chakraProfile.ts';
import { makeFormation, makePin, DEFAULT_SEQUENCE, makeLink } from '../src/engine/fieldModel.ts';
import { resolveEntityPose } from '../src/engine/entityPose.ts';
import { compileEntityForceEmitters } from '../src/engine/forceRuntime.ts';
import { semanticFocusTarget } from '../src/engine/resonanceDrive.ts';
import type { SemanticFieldConfig } from '../src/engine/semantics/semanticTypes.ts';

const semanticConfig=(entityId='heart'):SemanticFieldConfig=>({
  enabled:true,profile:{kind:'chakra',profileId:CHAKRA_PROFILE_ID},affinity:{method:'modalProjection',bandwidth:.12},globalColorGain:1,
  bindings:[{id:'heart-binding',semanticNodeId:'anahata',enabled:true,resonance:{gain:1},carriers:[{kind:'entity',id:entityId}],color:{enabled:true,colorSource:'canonical',gain:1,radius:{source:'force'},falloff:'gaussian',metric:'compositionPlane',blend:'weighted',activation:'resonanceAffinity'}}],
});

test('semantic architecture: physical resonator source does not import chakra semantics',()=>{
  const source=readFileSync(new URL('../src/engine/cymaticResonator.ts',import.meta.url),'utf8');
  assert.equal(source.includes('chakraSystem'),false);
  assert.equal(source.includes('chakraSemantics'),false);
});

test('semantic architecture: physical anchors contain no chakra name or colour',()=>{
  const resonator=new CymaticResonator();
  const anchors=resonator.getAnchors();
  assert.equal(anchors.length,7);
  for(const anchor of anchors){assert.ok(anchor.id.startsWith('mode:'));assert.equal('name' in anchor,false);assert.equal('color' in anchor,false);}
});

test('semantic affinity follows live modal energy rather than merely the nearest drive frequency',()=>{
  const resonator=new CymaticResonator({dampingQ:8});const anchors=resonator.getAnchors();const heart=mapChakrasToAnchors(anchors)[3].anchor!;
  for(let i=0;i<360;i++)resonator.step(1/60,heart.frequencyHz);
  const pose={entityId:'heart',x:10,y:20,z:0,sequence:{linkIndex:0,nextIndex:0,progress:0,phase:'hold' as const,step:0,linkCount:1}};
  const runtime=new SemanticFieldRuntime();const state=runtime.evaluate({config:semanticConfig(),resonance:resonator.getState(),poses:[pose],entityTints:new Map([['heart','#123456']]),forceEmitters:[],focus:null,delta:1/60});
  const heartState=state.nodes.find(n=>n.semanticNodeId==='anahata')!;
  assert.ok(heartState.directResonantEnergy>0);
  assert.equal(heartState.frequencyProximity,1,'the authored drive is exactly on the Heart physical anchor');
  const maxEnergy=state.nodes.reduce((a,b)=>b.directResonantEnergy>a.directResonantEnergy?b:a);
  const maxAffinity=state.nodes.reduce((a,b)=>b.affinity>a.affinity?b:a);
  assert.equal(maxAffinity.semanticNodeId,maxEnergy.semanticNodeId,'affinity is led by the actually energetic anchor, not nearest-frequency naming');
  assert.ok(heartState.affinity>.2,`expected meaningful Heart modal affinity, got ${heartState.affinity}`);
});

test('semantic carrier follows the shared evaluated sequence pose rather than base entity position',()=>{
  const e=makeFormation({id:'heart',x:5,y:6,z:7,sequence:{...DEFAULT_SEQUENCE,advance:'off',links:[makeLink({kind:'glyph',text:'A'},{x:0,y:0,z:0}),makeLink({kind:'glyph',text:'B'},{x:100,y:-50,z:20})]}});
  const pose=resolveEntityPose(e,0,0,.5,0);assert.equal(pose.x,55);assert.equal(pose.y,-19);assert.equal(pose.z,17);
  const force=compileEntityForceEmitters([e],[pose]);const runtime=new SemanticFieldRuntime();const cfg=semanticConfig(e.id);cfg.bindings[0].color!.activation='constant';
  const state=runtime.evaluate({config:cfg,resonance:null,poses:[pose],entityTints:new Map(),forceEmitters:force,focus:null,delta:1/60});
  assert.deepEqual(state.colorFields[0].center,{x:55,y:-19,z:17});
});

test('formation and pin forces compile through one stable-ID emitter contract with preserved metrics',()=>{
  const formation=makeFormation({id:'f',forces:{mode:'repel',strength:2,radius:123,spin:.4}});
  const pin=makePin({id:'p',x:3,y:4,z:5,forces:{mode:'vortex',strength:7,radius:222,spin:-.2}});
  const poses=[resolveEntityPose(formation,0,0,0,0),resolveEntityPose(pin,0,0,0,0)];const emitters=compileEntityForceEmitters([formation,pin],poses);
  assert.equal(emitters.length,2);assert.equal(emitters.find(e=>e.id==='entity:f')!.metric,'compositionPlane');assert.equal(emitters.find(e=>e.id==='entity:p')!.metric,'world3d');
  assert.deepEqual(emitters.find(e=>e.id==='entity:p')!.position,{x:3,y:4,z:5});
});

test('semantic colour radius follows force radius only when explicitly configured',()=>{
  const pose={entityId:'heart',x:0,y:0,z:0,sequence:{linkIndex:0,nextIndex:0,progress:0,phase:'hold' as const,step:0,linkCount:1}};
  const force=[{id:'entity:heart',sourceEntityId:'heart',position:{x:0,y:0,z:0},law:'radial' as const,polarity:'attract' as const,strength:2,radius:345,spin:0,metric:'compositionPlane' as const,enabled:true}];
  const runtime=new SemanticFieldRuntime();const follow=semanticConfig();follow.bindings[0].color!.activation='constant';
  let state=runtime.evaluate({config:follow,resonance:null,poses:[pose],entityTints:new Map(),forceEmitters:force,focus:null,delta:1/60});assert.equal(state.colorFields[0].radius,345);
  const independent=structuredClone(follow);independent.bindings[0].color!.radius={source:'independent',value:77};
  state=runtime.evaluate({config:independent,resonance:null,poses:[pose],entityTints:new Map(),forceEmitters:force,focus:null,delta:1/60});assert.equal(state.colorFields[0].radius,77);
});

test('semantic focus resolves by stable entity binding and an unbound focus cannot invent an anchor',()=>{
  const resonator=new CymaticResonator();const anchors=resonator.getAnchors();const cfg=semanticConfig('heart');
  const bound=semanticFocusTarget({currentHz:123,focus:{entityId:'heart',nextEntityId:'heart',blend:0},semanticField:cfg,anchors});assert.equal(bound.bound,true);assert.equal(bound.semanticNodeId,'anahata');
  const mapped=mapChakrasToAnchors(anchors).find(m=>m.node.id==='anahata')!.anchor!;assert.equal(bound.targetHz,mapped.frequencyHz);
  const unbound=semanticFocusTarget({currentHz:123,focus:{entityId:'other',nextEntityId:'other',blend:0},semanticField:cfg,anchors});assert.deepEqual(unbound,{kind:'semanticFocus',targetHz:123,bound:false});
});

test('semantic field evaluation is stable under entity reorder because bindings use IDs',()=>{
  const a=makeFormation({id:'other',x:-100});const heart=makeFormation({id:'heart',x:250,forces:{mode:'attract',strength:1,radius:80,spin:0}});const cfg=semanticConfig('heart');cfg.bindings[0].color!.activation='constant';
  const evaluate=(entities:typeof a[])=>{const poses=entities.map(e=>resolveEntityPose(e,0,0,0,0));return new SemanticFieldRuntime().evaluate({config:cfg,resonance:null,poses,entityTints:new Map(),forceEmitters:compileEntityForceEmitters(entities,poses),focus:null,delta:0}).colorFields[0];};
  assert.deepEqual(evaluate([a,heart]).center,evaluate([heart,a]).center);assert.equal(evaluate([a,heart]).radius,80);
});


test('first-class pin identity shadows legacy placed-point input even when the pin is disabled',()=>{
  const pin=makePin({id:'same-pin',enabled:false,forces:{mode:'attract',strength:4,radius:100,spin:0}});const pose=resolveEntityPose(pin,0,0,0,0);
  const emitters=compileEntityForceEmitters([pin],[pose],[{id:'same-pin',x:0,y:0,z:0,radius:100,strength:4,mode:'attract',active:true}]);
  assert.deepEqual(emitters,[],'legacy migration data must not resurrect a disabled first-class pin');
});
