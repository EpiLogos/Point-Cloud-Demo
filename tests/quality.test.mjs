import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,TIERS,classifyGpu,resolveAuto} from '../server/quality.mjs';

test('every preset stays inside the overlay validation ranges',()=>{
 for(const [name,preset] of Object.entries(PRESETS)){
  assert.ok(preset.fps>=10&&preset.fps<=60,name);
  assert.ok(preset.particleLimit>=1000&&preset.particleLimit<=300000,name);
  assert.ok(preset.pixelRatio>=.5&&preset.pixelRatio<=2,name);
 }
 assert.deepEqual(Object.keys(PRESETS),TIERS);
});

test('GPU renderer strings classify into capability classes',()=>{
 assert.equal(classifyGpu('Mesa Intel(R) HD Graphics 4000 (0x0166)').gpuClass,'intel-legacy');
 assert.equal(classifyGpu('ANGLE (Intel, Intel(R) UHD Graphics 630 (0x3E9B) OpenGL 4.6)').gpuClass,'intel-legacy');
 assert.equal(classifyGpu('Mesa Intel(R) Iris Xe Graphics (TGL GT2)').gpuClass,'intel-modern');
 assert.equal(classifyGpu('Apple M2 Pro').gpuClass,'apple');
 assert.equal(classifyGpu('Mesa llvmpipe (LLVM 15.0.7, 256 bits)').gpuClass,'software');
 assert.equal(classifyGpu('NVIDIA GeForce RTX 3060/PCIe/SSE2').gpuClass,'discrete');
 assert.equal(classifyGpu('').gpuClass,'unknown');
});

test('auto resolution matches this old MacBook and degrades under pressure',()=>{
 // This machine: Ivy Bridge HD 4000, ~1.2 GiB free — must land on eco.
 const local=resolveAuto({rendererString:'Mesa Intel(R) HD Graphics 4000 (0x0166)',cores:4,memAvailableMiB:1150,psiMemorySomeAvg10:0},{});
 assert.equal(local.tier,'eco');
 assert.equal(local.fps,PRESETS.eco.fps);
 assert.equal(local.particleLimit,PRESETS.eco.particleLimit);
 assert.equal(local.pixelRatio,PRESETS.eco.pixelRatio);
 // A modern machine with memory headroom earns the top tier.
 const rich=resolveAuto({rendererString:'Apple M2 Pro',cores:10,deviceMemoryGiB:8,memAvailableMiB:9000,psiMemorySomeAvg10:0},{});
 assert.equal(rich.tier,'fluid');
 // System pressure and tight memory only ever lower the tier.
 const pressured=resolveAuto({rendererString:'Apple M2 Pro',cores:10,memAvailableMiB:9000,psiMemorySomeAvg10:60},{});
 assert.equal(pressured.tier,'eco');
 assert.ok(pressured.reason.includes('memory pressure'));
 const tight=resolveAuto({rendererString:'Apple M2 Pro',cores:10,memAvailableMiB:900,psiMemorySomeAvg10:0},{});
 assert.equal(tight.tier,'gentle');
 assert.ok(tight.reason.includes('low available memory'));
 const tiny=resolveAuto({rendererString:'Apple M2 Pro',cores:2,memAvailableMiB:9000},{});
 assert.equal(tiny.tier,'gentle');
 // Unknown hardware without signals defaults to the middle tier.
 assert.equal(resolveAuto({}).tier,'balanced');
});
