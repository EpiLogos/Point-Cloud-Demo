import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ambientScene} from '../src/physis/ambient';
import {fieldStudies,validateJourney} from '../field-studies-journeys/src/model';
import {toNativeConfig} from '../field-studies-journeys/src/nativeBridge';
test('ambient motion remains runtime-only, bounded, and preserves authored lanes',()=>{
 const doc=fieldStudies(),source=doc.scenes[0],before=JSON.stringify(source);
 const ambient=ambientScene(source);
 assert.equal(JSON.stringify(source),before);
 assert.ok(ambient.field.params.count<=16000);
 assert.equal(ambient.automation.length,source.automation.length+3);
 for(const lane of ambient.automation){assert.ok(lane.min<=lane.max);assert.ok(lane.rate>0&&lane.rate<.03);}
 doc.scenes[0]=ambient;validateJourney(doc);
 const twice=ambientScene(ambient);assert.deepEqual(twice.automation,ambient.automation);
 const native=toNativeConfig(ambient);assert.ok(native.automations?.some(l=>l.id==='physis-ambient-dispersion'));
});
