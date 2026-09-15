async () => {
 const T=window.NATIVE_TEST;const results=[];
 const assert=(condition,message)=>{if(!condition)throw new Error(message);};
 const near=(a,b,epsilon=1e-7)=>Math.abs(a-b)<epsilon;
 const test=async(name,fn)=>{try{results.push({name,ok:true,evidence:await fn()});}catch(error){results.push({name,ok:false,error:error.stack});}};
 const canvas=()=>document.body.appendChild(Object.assign(document.createElement('canvas'),{width:480,height:360}));
 const bare=()=>{const s=T.blankScene('GPU test');s.field.params.count=1024;s.entities=[];const cfg=T.toNativeConfig(s);Object.assign(cfg.fluid,{returnSpeed:0,turbulence:0,vortexStrength:0,thermalJitter:0,gravityX:0,gravityY:0,gravityZ:0,quadraticDrag:0,viscosity:1,zConfinement:0});cfg.cymatics.enabled=false;cfg.relational.enabled=false;cfg.toroidalMorph.enabled=false;return cfg;};
 await test('Terminal adapter disposal releases held contexts and preserves same-canvas recovery',async()=>{
  const scene=T.fieldStudies().scenes[0];scene.field.params.count=1024;scene.engine.resonanceEnabled=false;
  const frame={scene,simTime:0,delta:0,params:scene.field.params,camera:T.defaultCamera(),pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]};
  const event=(target,name)=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{target.removeEventListener(name,done);reject(new Error('Missing real '+name));},5000);const done=()=>{clearTimeout(timeout);resolve();};target.addEventListener(name,done,{once:true});});
  const create=()=>{const c=canvas(),adapter=new T.ProductionAdapter(c);adapter.resize(480,360,1);adapter.render(frame);const gl=c.getContext('webgl2');assert(gl&&!gl.isContextLost(),'fresh canvas must own a real live WebGL context');return {c,adapter,gl};};
  const rendered=adapter=>{const state=adapter.inspect(true);assert(state.particleCount===1024&&state.positions.every(Number.isFinite),'recovered native field must retain its allocation and finite state');const image=adapter.capture(480,360),data=image.getContext('2d').getImageData(0,0,480,360).data,colours=new Set();for(let i=0;i<data.length;i+=64)colours.add(data.slice(i,i+4).join(','));assert(colours.size>1,'native renderer must produce actual marks after recovery');};
  const first=create();rendered(first.adapter);
  first.adapter.command({type:'reset-field'});assert(!first.gl.isContextLost(),'reset must preserve the current canvas context');
  first.adapter.command({type:'recover-context'});assert(!first.gl.isContextLost(),'recovery preparation must preserve the reusable context');
  first.adapter.render(frame);assert(first.c.getContext('webgl2')===first.gl,'recovery must reuse the same canvas context');rendered(first.adapter);
  const terminal=event(first.c,'webglcontextlost');first.adapter.dispose();first.adapter.dispose();await terminal;
  assert(first.gl.isContextLost(),'terminal disposal must lose the strongly held real context');assert(!first.adapter.inspect(),'disposed adapter must have no live engine');
  const second=create();rendered(second.adapter);
  second.adapter.command({type:'recover-context'});
  // Recovery may be cancelled before the next render creates a replacement.
  const cancelled=event(second.c,'webglcontextlost');second.adapter.dispose();second.adapter.dispose();await cancelled;
  assert(second.gl.isContextLost(),'dispose between recovery and redraw must release the retained context owner');
  const third=create();rendered(third.adapter);assert(first.gl.isContextLost()&&second.gl.isContextLost(),'fresh canvas creation must not revive disposed contexts');
  const extension=third.gl.getExtension('WEBGL_lose_context');assert(extension,'real context-loss extension is required for this regression');
  const lost=event(third.c,'webglcontextlost');extension.loseContext();await lost;
  let refused=false;try{third.adapter.render(frame);}catch(error){refused=String(error).includes('context was lost');}assert(refused,'a real lost context must refuse rendering until explicit recovery');
  // Leave the loss event's dispatch before requesting its real restoration.
  await new Promise(resolve=>setTimeout(resolve,0));
  const restored=event(third.c,'webglcontextrestored');extension.restoreContext();await restored;
  third.adapter.command({type:'recover-context'});third.adapter.render(frame);rendered(third.adapter);
  const last=event(third.c,'webglcontextlost');third.adapter.dispose();await last;assert(third.gl.isContextLost(),'fresh replacement must also release on terminal disposal');
  return {heldContexts:3,terminalContextsLost:3,sameCanvasRecovery:true,realLossAndRestore:true,cancelledRecoveryDisposed:true,repeatedDispose:true};
 });
 await test('Sparse native glyph allocations cover both complete sequence shapes in each plane',()=>{
  const sampler=new T.GlyphSampler(),font='sans-serif',weight=900;
  const bounds=points=>points.reduce((b,p)=>({x0:Math.min(b.x0,p.x),x1:Math.max(b.x1,p.x),y0:Math.min(b.y0,p.y),y1:Math.max(b.y1,p.y)}),{x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity});
  const shapes=['O','●'].map(text=>({kind:'glyph',text}));
  const pools=shapes.map(shape=>sampler.rasterizeSpatialNode({id:'coverage',shape:'glyph',glyphText:shape.text,name:'Coverage',sanskrit:'',seedSyllable:shape.text,symbol:shape.text,frequencyHz:396,x:0,y:0,scale:1,color:'#ffffff',attractorStrength:0,active:true},'symbol',font,weight).candidates);
  const evidence=[],failures=[],sourceTargets=new Map();
  for(const plane of ['vertical','horizontal'])for(const mode of ['ordinary','explicit-unnormalized','normalized'])for(const count of [1024,8192]){
   // Equal shares give each actual partition fewer particles than either raster.
   const entities=[0,1].map(i=>T.makeFormation({id:'coverage-'+i,sequence:{...T.makeFormation().sequence,links:shapes.map(shape=>T.makeLink(shape))},...(mode==='ordinary'?{}:{extent:{width:400,height:400,rotation:0,normalized:mode==='normalized'}})}));
   const runtime=new T.EntityRuntime(sampler);runtime.allocate(count,128,Math.ceil(count/128));runtime.layout(entities);
   try{
    runtime.update(entities,{...T.DEFAULT_COMPOSITION,plane},0,0,0,0,font,weight);
    const firstA=Array.from(runtime.textureA.image.data),firstB=Array.from(runtime.textureB.image.data);
    const generation=runtime.bakeGeneration;
    const repeat=runtime.update(entities,{...T.DEFAULT_COMPOSITION,plane},0,0,0,0,font,weight);
    assert(!repeat.rebaked&&runtime.bakeGeneration===generation,'unchanged allocations must not rebake');
    for(const part of runtime.getPartitions())for(const [link,data] of [[0,firstA],[1,firstB]]){
     assert(part.end-part.start<pools[link].length,'regression must exercise fewer particles than raster candidates');
     const points=[];
     for(let i=part.start;i<part.end;i++){
      assert(data[i*4+3]>0&&Number.isFinite(data[i*4]),'every allocated target must be a finite sampled glyph point');
      points.push({x:data[i*4],y:plane==='horizontal'?-data[i*4+2]:data[i*4+1]});
     }
     const actual=bounds(points),source=bounds(pools[link]),normalized=mode==='normalized';
     const expected=normalized?{x0:-200,x1:200,y0:-200,y1:200}:Object.fromEntries(Object.entries(source).map(([key,value])=>[key,value*.56]));
     const coverageX=(actual.x1-actual.x0)/(expected.x1-expected.x0),coverageY=(actual.y1-actual.y0)/(expected.y1-expected.y0);
     const center={x:(expected.x0+expected.x1)/2,y:(expected.y0+expected.y1)/2},quadrants=new Set(points.map(p=>(p.x>=center.x?1:0)+(p.y>=center.y?2:0))).size;
     const result={plane,mode,count,entity:part.entityId,link,candidates:pools[link].length,allocated:points.length,coverageX,coverageY,quadrants};evidence.push(result);
     if(coverageY<.97||quadrants!==4)failures.push(result);
     // Font-dependent extreme columns may have fewer candidates than one sparse
     // allocation can visit. Compare actual sampled source points with the native
     // normalized path instead of imposing a font-specific width percentage.
     const core=bounds(pools[link].filter(p=>p.density>.25));
     const sourcePoints=points.map(p=>normalized?{x:p.x*(core.x1-core.x0)/400+(core.x0+core.x1)/2,y:p.y*(core.y1-core.y0)/400+(core.y0+core.y1)/2}:{x:p.x/.56,y:p.y/.56});
     const key=[plane,count,part.entityId,link].join('|');
     if(normalized){
      for(const otherMode of ['ordinary','explicit-unnormalized']){
       const other=sourceTargets.get(key+'|'+otherMode);
       assert(other.every((p,i)=>near(p.x,sourcePoints[i].x,.001)&&near(p.y,sourcePoints[i].y,.001)),'normalization must change geometry only, not which source points represent the shape: '+key+'|'+otherMode);
      }
     }else sourceTargets.set(key+'|'+mode,sourcePoints);
    }
    // Reallocation may renew jitter but must retain deterministic shape targets.
    runtime.allocate(count,128,Math.ceil(count/128));runtime.layout(entities);runtime.update(entities,{...T.DEFAULT_COMPOSITION,plane},0,0,0,0,font,weight);
    assert(firstA.every((value,i)=>value===runtime.textureA.image.data[i])&&firstB.every((value,i)=>value===runtime.textureB.image.data[i]),'same glyph allocation must preserve A/B target ordering');
   }finally{runtime.dispose();}
  }
  window.__glyphCoverage=evidence;
  assert(!failures.length,'raster prefix cropped glyph allocations: '+JSON.stringify(failures));
  return evidence;
 });
 function seededEngine(config){const old=Math.random;let seed=1337;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;try{return new T.PointCloudField(canvas(),config,true);}finally{Math.random=old;}}
 function force(mode,spin=0,radius=120,second=false){const cfg=bare();const p=T.pin({x:.05,y:-.08,z:.1});p.force={kind:mode,strength:2,radius:radius/400,spin};const s=T.blankScene();s.entities=[p];cfg.entities=T.toNativeConfig(s).entities;if(second)cfg.entities.push({...structuredClone(cfg.entities[0]),id:'second'});const engine=seededEngine(cfg);const before=engine.inspectState(true);engine.advance(1/60);const after=engine.inspectState(true);const centre=cfg.entities[0];let radial=0,tangent=0,outside=0,finite=true;for(let i=0;i<after.velocities.length;i+=4){const d=[before.positions[i]-centre.x,before.positions[i+1]-centre.y,before.positions[i+2]-centre.z],v=after.velocities.slice(i,i+3),length=Math.hypot(...d);radial+=d.reduce((n,x,j)=>n+x*v[j],0)/(length||1);tangent+=(-d[1]*v[0]+d[0]*v[1])/(Math.hypot(d[0],d[1])||1);if(length>radius*1.05&&length<radius*1.8)outside+=Math.hypot(...v);finite&&=v.every(Number.isFinite);}const evidence={radial:radial/1024,tangent:tangent/1024,outside,finite,steps:after.steps,seeds:after.seeds};engine.destroy();return evidence;}
 await test('GPU pins attract / repel / vortex, independent spin, Gaussian exterior and shared summation',()=>{const a=force('attract'),r=force('repel'),v=force('vortex'),spin=force('none',2),two=force('attract',0,120,true);assert(a.radial<-.01,'attraction must move inward');assert(r.radial>.01,'repulsion must move outward');assert(v.tangent>.01&&spin.tangent>.01,'vortex and independent spin must rotate');assert(a.outside>.001,'Gaussian influence must continue outside displayed radius');assert(near(two.radial/a.radial,2,.0005),'overlapping pins must sum');assert([a,r,v,spin,two].every(x=>x.finite),'no nonfinite velocity');return {attract:a,repel:r,vortex:v,spin,overlap:two};});
 await test('Native external clock, zero-step inspection, uniform-only movement and count-only reseed',()=>{const s=T.fieldStudies().scenes[0];s.field.params.count=1024;s.engine.resonanceEnabled=false;const e=new T.ProductionAdapter(canvas());e.resize(480,360,1);const f={scene:s,simTime:0,delta:0,params:s.field.params,camera:T.defaultCamera(),pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]};e.render(f);const a=e.inspect(true);e.render({...f,selectedIds:[s.entities[0].id]});let b=e.inspect(true);assert(JSON.stringify(a.positions)===JSON.stringify(b.positions)&&a.simTime===b.simTime&&a.steps===b.steps,'selection at zero delta must not integrate');s.entities[0].position.x+=.2;s.entities[0].size.x*=1.3;s.entities[0].rotation=40;e.render(f);b=e.inspect(true);assert(a.seeds===b.seeds&&a.bakes===b.bakes,'transforms must not reseed or rebake');assert(JSON.stringify(a.positions)===JSON.stringify(b.positions),'editing transform must not teleport particles');e.render({...f,delta:1/30});b=e.inspect();assert(near(b.simTime,1/30)&&b.steps-a.steps===2,'one external 1/30 command must do two 1/60 substeps');s.field.params.count=2048;e.render(f);const c=e.inspect();assert(c.seeds===a.seeds+1&&c.particleCount===2048,'count change is an explicit reseed');e.dispose();return {before:{time:a.simTime,steps:a.steps,seeds:a.seeds,bakes:a.bakes},after:{time:b.simTime,steps:b.steps,seeds:b.seeds,bakes:b.bakes},countChange:{seeds:c.seeds,count:c.particleCount}};});
 await test('Two independent sequences, overlapping pins, focus and continuous resonator share one clock',()=>{const s=T.fieldStudies().scenes[0];s.field.params.count=2048;s.field.params.dominance=.7;s.engine.resonanceEnabled=true;s.composition.focus='travelling';s.composition.frequencyDriver='focus';s.composition.carryStation=true;s.composition.focusDuration=.3;s.composition.focusDwell=.1;s.entities.forEach((e,i)=>{e.station=i*4;e.sequence.enabled=true;e.sequence.hold=.1;e.sequence.transition=.3;e.sequence.rateMul=i+1;e.sequence.steps.push({...structuredClone(e.sequence.steps[0]),id:'extra'+i,text:i?'&':'I'});});s.entities.push(T.pin({x:0,y:0,z:0}),T.pin({x:.1,y:.1,z:.05}));s.entities.at(-1).force.kind='repel';const e=new T.ProductionAdapter(canvas());e.resize(480,360,1);const f={scene:s,simTime:0,delta:1/60,params:s.field.params,camera:T.defaultCamera(),pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]};e.render({...f,delta:0});const a=e.inspect();let frequencies=[],independent=false;for(let i=0;i<45;i++){e.render(f);const t=e.telemetry();frequencies.push(t.cymatic.frequencyHz);independent||=t.sequences[0].linkIndex!==t.sequences[1].linkIndex;}const b=e.inspect(true);assert(independent,'independent sequences must diverge');assert(new Set(frequencies.map(x=>x.toFixed(3))).size>8,'focus must continuously change shared frequency');assert(b.seeds===a.seeds,'combined dynamics must not reseed');assert(b.positions.every(Number.isFinite),'combined GPU state must be finite');const oldFreq=e.telemetry().cymatic.frequencyHz;e.render({...f,delta:0,selectedIds:[s.entities[1].id]});assert(near(oldFreq,e.telemetry().cymatic.frequencyHz),'selection must not retune');const out={clock:b.simTime,seeds:b.seeds,steps:b.steps,frequencyRange:[Math.min(...frequencies),Math.max(...frequencies)],distinctFrequencies:new Set(frequencies).size,sequenceStates:e.telemetry().sequences};e.dispose();return out;});
 await test('Native image capture re-renders clean state at output resolution without stepping',()=>{const s=T.fieldStudies().scenes[0];s.field.params.count=2048;const c=canvas(),e=new T.ProductionAdapter(c);e.resize(480,360,1);const f={scene:s,simTime:0,delta:0,params:s.field.params,camera:T.defaultCamera(),pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]};e.render(f);const before=e.inspect(true);const plain=e.capture(800,600);const data=plain.getContext('2d').getImageData(0,0,800,600).data;let marked=0;for(let i=3;i<data.length;i+=4)if(data[i]>16)marked++;assert(marked>50,'native capture must contain actual GPU marks');e.render({...f,selectedIds:[s.entities[0].id]});const selected=e.capture(800,600);assert(selected.toDataURL()===plain.toDataURL(),'PNG must exclude selection shading');const after=e.inspect(true);assert(JSON.stringify(before.positions)===JSON.stringify(after.positions)&&before.simTime===after.simTime&&before.steps===after.steps,'capture must not change particle state');window.__gpuCapture=plain.toDataURL();e.dispose();return {width:800,height:600,markedPixels:marked,steps:after.steps,seeds:after.seeds};});
 await test('Native ortho projection matches editor in 3D, resized and high-DPR views',()=>{const s=T.fieldStudies().scenes[0];s.field.params.count=1024;const e=new T.ProductionAdapter(canvas());const cams=[T.defaultCamera(),{...T.defaultCamera(),mode:'3d',yaw:.65,pitch:.4,zoom:1.8,panX:20,panY:-8}];let maxError=0;for(const camera of cams)for(const [w,h,dpr]of [[640,440,1],[880,600,2]]){e.resize(w,h,dpr);e.render({scene:s,simTime:0,delta:0,params:s.field.params,camera,pointer:{active:false,world:{x:0,y:0,z:0}},selectedIds:[]});for(const point of [{x:.2,y:.3,z:.4},{x:-.7,y:-.2,z:.15}]){const a=T.project(point,camera,w,h),b=e.projectNative(point);maxError=Math.max(maxError,Math.hypot(a.x-b.x,a.y-b.y));}}assert(maxError<.001,'editor/native projection mismatch '+maxError);e.dispose();return {maxPixelError:maxError};});
 return results;
}
