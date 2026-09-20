import assert from 'node:assert/strict';
import {test} from './harness';
import {entity,type SequenceStep,type Shape} from '../field-studies-journeys/src/model';
import {captureObjectState,transformObjectStates} from '../field-studies-journeys/src/sourceState';
import {refitStepForText,refitEntityForText,refitFormationForFont,refitFormationToGlyphs} from '../field-studies-journeys/src/stateSizing';
import {inkAspect,measureInkBox} from '../src/engine/glyphMetrics';

const step=(id:string,text:string,shape:Shape='text'):SequenceStep=>({id,text,shape,hold:1,transition:1,position:null});
const inBounds=(b:{x:number;y:number})=>{assert.ok(b.x>=.01-1e-9&&b.x<=4+1e-9&&b.y>=.01-1e-9&&b.y<=4+1e-9,JSON.stringify(b));};

test('refitStepForText creates an objectState with base appearance and a glyph-true fitted box',()=>{
 const e=entity('Glyph','O');e.size={x:.5,y:.5};
 refitStepForText(e,0,'O','OPEN',{});
 const st=e.sequence.steps[0].objectState;
 assert.ok(st,'a stateless text step gains an objectState');
 assert.equal(st.rotation,e.rotation);assert.equal(st.scale,1);assert.equal(st.tint,e.tint);assert.equal(st.tintWeight,e.tintWeight);assert.deepEqual(st.force,e.force);
 // Square box (stretch 1): the new box aspect is exactly next/prev glyph aspect, at constant area.
 const prevA=inkAspect(measureInkBox('O')),nextA=inkAspect(measureInkBox('OPEN'));
 assert.ok(Math.abs(st.size.x/st.size.y-nextA/prevA)<1e-9,`aspect ${st.size.x/st.size.y} vs ${nextA/prevA}`);
 assert.ok(Math.abs(st.size.x*st.size.y-.25)<1e-9,'area preserved vs the effective box before');
 // A step that already owns a state keeps its identity fields; only the size box is refit.
 const e2=entity('Glyph','O');e2.size={x:.5,y:.5};
 e2.sequence.steps[0].objectState={...captureObjectState(e2).objectState!,rotation:42,tint:'#101010'};
 refitStepForText(e2,0,'O','OPEN',{});
 assert.equal(e2.sequence.steps[0].objectState!.rotation,42);assert.equal(e2.sequence.steps[0].objectState!.tint,'#101010');
 assert.ok(Math.abs(e2.sequence.steps[0].objectState!.size.x*e2.sequence.steps[0].objectState!.size.y-.25)<1e-9);
});

test('a new state snapshots the nearest earlier objectState, not the entity base, without aliasing it',()=>{
 const e=entity('Glyph','O');
 e.sequence.steps[0].objectState={...captureObjectState(e).objectState!,tint:'#112233',rotation:30};
 e.sequence.steps.push({...step('second','I')});
 refitStepForText(e,1,'I','IN',{});
 const st=e.sequence.steps[1].objectState!;
 assert.equal(st.tint,'#112233');assert.equal(st.rotation,30);
 st.rotation=77;
 assert.equal(e.sequence.steps[0].objectState!.rotation,30,'the snapshot is a clone');
});

test('refitEntityForText refits the held-entity base box',()=>{
 const e=entity('Glyph','O');e.size={x:1,y:1};
 refitEntityForText(e,'O','OPEN',{});
 const prevA=inkAspect(measureInkBox('O')),nextA=inkAspect(measureInkBox('OPEN'));
 assert.ok(Math.abs(e.size.x/e.size.y-nextA/prevA)<1e-9,`aspect ${e.size.x/e.size.y}`);
 assert.ok(Math.abs(e.size.x*e.size.y-1)<1e-9);
 const r=entity('Ring','O');r.shape='ring';const before={...r.size};
 refitEntityForText(r,'O','OPEN',{});
 assert.deepEqual(r.size,before,'non-text entities are untouched');
});

test('refitFormationForFont touches only text steps without a source and leaves an enabled base extent alone',()=>{
 const e=entity('Mix','O');e.sequence.enabled=true;
 e.sequence.steps=[{...step('t','O')},{...step('r','I','ring')},{...step('s','I'),source:{kind:'ascii',ascii:{text:'::',fontFamily:'monospace',fontSize:32}}},{...step('w','OPEN')}];
 const base={...e.size};
 refitFormationForFont(e,{},{fontFamily:'Georgia',fontWeight:400});
 assert.ok(e.sequence.steps[0].objectState,'stateless text step gains a state');
 assert.ok(e.sequence.steps[3].objectState);
 assert.ok(!e.sequence.steps[1].objectState,'ring steps are untouched');
 assert.ok(!e.sequence.steps[2].objectState,'sourced text steps are untouched');
 assert.deepEqual(e.size,base,'an enabled sequence keeps its base extent');
 for(const i of [0,3]){const s=e.sequence.steps[i].objectState!.size;
  assert.ok(Math.abs(s.x*s.y-base.x*base.y)<1e-9,'area preserved against the effective box');
  assert.ok(Math.abs(s.x/s.y-base.x/base.y)<1e-9,'node heuristic is font-neutral, so the box aspect survives');
 }
});

test('refitFormationToGlyphs normalizes a stretched box to its glyph aspect at constant area',()=>{
 const e=entity('S','OPEN');
 e.sequence.steps[0].objectState={...captureObjectState(e).objectState!,size:{x:2,y:.5}};
 refitFormationToGlyphs(e,{});
 const s=e.sequence.steps[0].objectState!.size,a=inkAspect(measureInkBox('OPEN'));
 assert.ok(Math.abs(s.x/s.y-a)<1e-9,`aspect ${s.x/s.y} vs glyph ${a}`);
 assert.ok(Math.abs(s.x*s.y-1)<1e-9);
 // The held base is normalized too; an enabled or manual sequence keeps its base extent.
 const b=entity('B','I');b.size={x:3,y:.3};
 refitFormationToGlyphs(b,{});
 assert.ok(Math.abs(b.size.x/b.size.y-inkAspect(measureInkBox('I')))<1e-9);
 assert.ok(Math.abs(b.size.x*b.size.y-.9)<1e-9);
 const p=entity('P','I');p.sequence.enabled=true;p.size={x:3,y:.3};
 refitFormationToGlyphs(p,{});
 assert.deepEqual(p.size,{x:3,y:.3});
 // A stateless text step gains a state box derived from its own glyph.
 const q=entity('Q','O');q.sequence.steps=[{...step('n','OPEN')}];
 refitFormationToGlyphs(q,{});
 const qs=q.sequence.steps[0].objectState!.size;
 assert.ok(Math.abs(qs.x/qs.y-inkAspect(measureInkBox('OPEN')))<1e-9);
 assert.ok(Math.abs(qs.x*qs.y-q.size.x*q.size.y)<1e-9);
});

test('global entity-size resizes multiply every refitted state box (transformObjectStates contract)',()=>{
 const e=entity('T','O');e.size={x:.65,y:.86};
 refitStepForText(e,0,'O','OPEN',{});
 const fitted={...e.sequence.steps[0].objectState!.size};
 transformObjectStates(e,'entity.size.x',e.size.x,e.size.x*2);
 transformObjectStates(e,'entity.size.y',e.size.y,e.size.y*2);
 const scaled=e.sequence.steps[0].objectState!.size;
 assert.ok(Math.abs(scaled.x-fitted.x*2)<1e-9);assert.ok(Math.abs(scaled.y-fitted.y*2)<1e-9);
 assert.ok(Math.abs(scaled.x/scaled.y-fitted.x/fitted.y)<1e-9,'the glyph-true aspect survives a global resize');
});

test('refit results always land inside the [0.01, 4] clamp window',()=>{
 const texts=['','O','I','OPEN','WWWWWWWWWW'];
 for(const prev of texts)for(const next of texts){
  const e=entity('G','O');e.size={x:4,y:.01};
  refitEntityForText(e,prev,next,{});
  inBounds(e.size);
  const s=entity('S','O');s.size={x:4,y:.01};
  refitStepForText(s,0,prev,next,{});
  inBounds(s.sequence.steps[0].objectState!.size);
 }
 for(const t of texts){
  const e=entity('R',t);e.size={x:4,y:.01};
  refitFormationToGlyphs(e,{});
  inBounds(e.size);inBounds(e.sequence.steps[0].objectState!.size);
 }
});
