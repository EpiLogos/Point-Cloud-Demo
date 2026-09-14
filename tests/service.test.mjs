import {test,before,after} from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
let child, dir;
const base='http://127.0.0.1:47833';
const post=(route,body,extra={})=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json','X-Physis-Client':'1',...extra},body:JSON.stringify(body)});
before(async()=>{
 dir=await mkdtemp(path.join(os.tmpdir(),'physis-service-test-'));
 child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PHYSIS_PORT:'47833',PHYSIS_DATA_DIR:dir,PHYSIS_TEST_MODE:'1'},stdio:'pipe'});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}
 assert.ok(ready,'isolated service starts');
});
after(async()=>{if(child){child.kill();await new Promise(r=>child.once('exit',r));}await rm(dir,{recursive:true,force:true});});
test('reject foreign origins, rebinding hosts, and unauthenticated writes',async()=>{
 assert.equal((await post('/api/scenes',{config:{glyph:'O'}},{Origin:'https://foreign.example'})).status,403);
 assert.equal(await new Promise((resolve,reject)=>{const request=http.get(base+'/api/state',{headers:{Host:'foreign.example'}},res=>{res.resume();resolve(res.statusCode);});request.on('error',reject);}),403);
 assert.equal((await fetch(base+'/api/scenes',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
});
test('scene IDs cannot escape the library',async()=>{
 assert.equal((await post('/api/overlay',{sceneId:'../../etc/passwd'})).status,400);
 assert.deepEqual(await readdir(path.join(dir,'scenes')),[]);
});
test('invalid settings do not partially change state',async()=>{
 const prior=await (await fetch(base+'/api/state')).json();
 assert.equal((await post('/api/overlay',{opacity:.2,fps:200})).status,400);
 assert.equal((await (await fetch(base+'/api/state')).json()).opacity,prior.opacity);
});
test('completed PNG has scene provenance and invalid media is never published',async()=>{
 const sceneResponse=await post('/api/scenes',{name:'A scene',config:{glyph:['O','I'],particleCount:1000}});
 assert.equal(sceneResponse.status,201);const scene=await sceneResponse.json();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=','base64');
 const send=body=>fetch(base+`/api/media/images?sceneId=${scene.id}`,{method:'POST',headers:{'Content-Type':'image/png','X-Physis-Client':'1'},body});
 assert.equal((await send(Buffer.from('not an image'))).status,400);
 assert.deepEqual(await readdir(path.join(dir,'images')),[]);
 const uploaded=await send(png);assert.equal(uploaded.status,201);
 const item=await uploaded.json();assert.equal(item.sceneId,scene.id);
 assert.deepEqual(Buffer.from(await (await fetch(base+item.url)).arrayBuffer()),png);
 assert.equal((await (await fetch(base+'/api/media')).json()).length,1);
 assert.ok((await readdir(path.join(dir,'images'))).every(name=>!name.includes('partial')));
});

test('current master expressions retain all scenes, camera and viewport; status stays lightweight',async()=>{
 const {fieldStudies}=await import('../field-studies-journeys/build/model.js');
 const expression=fieldStudies(),camera={mode:'3d',yaw:.3,pitch:.2,zoom:1.4,panX:80,panY:-30,plane:'XY',depth:0,grid:false,snap:false};
 const response=await post('/api/scenes',{expression,sceneIndex:2,camera,viewport:{width:1280,height:800},name:'Master expression'});
 assert.equal(response.status,201);const saved=await response.json();assert.equal(saved.version,2);assert.deepEqual(saved.expression,expression);assert.deepEqual(saved.camera,camera);
 assert.equal((await post('/api/overlay',{sceneId:saved.id})).status,200);
 const state=await (await fetch(base+'/api/state')).json();assert.equal(state.scene.id,saved.id);assert.equal(state.scene.expression,undefined);
 const events=await fetch(base+'/api/events?renderer=1');const reader=events.body.getReader();const {value}=await reader.read();await reader.cancel();
 const full=JSON.parse(new TextDecoder().decode(value).split('data: ')[1].trim());assert.deepEqual(full.scene.expression,expression);assert.equal(full.scene.sceneIndex,2);
 const invalid=structuredClone(expression);invalid.scenes[0].entities[0].position.x=null;
 assert.equal((await post('/api/scenes',{expression:invalid})).status,400);
 assert.equal((await post('/api/scenes',{expression,sceneIndex:999})).status,400);
});
