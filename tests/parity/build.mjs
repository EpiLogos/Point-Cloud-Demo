import {build} from 'esbuild';
import fs from 'node:fs';
if(!fs.existsSync('.parity-reference/master/src/engine/PointCloudField.ts'))throw new Error('Missing immutable native checkout. See docs/parity/PLAN.md and the parity acceptance workflow.');
await build({entryPoints:['tests/parity/gpuHarness.ts'],bundle:true,format:'iife',target:'es2022',outfile:'field-studies-journeys/build/parity-harness.js'});
