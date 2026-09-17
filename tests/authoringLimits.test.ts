/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authoring-limit contracts between the editor inputs and validateJourney.
 * The textareas in the studio/image suite carry maxlength attributes equal to
 * these bounds; a paste past the bound would otherwise apply to the document
 * and then refuse every persistence path (draft, library, reimport).
 */
import assert from 'node:assert/strict';
import {test} from './harness';
import {blankJourney,blankScene,entity,validateJourney} from '../field-studies-journeys/src/model';

test('authoring limits: ASCII source at the editor cap round-trips, one past it is refused',()=>{
 const atCap=Array.from({length:21},()=>'*'.repeat(2380)).join('\n');
 assert.equal(atCap.length,50000);
 const j=blankJourney(),s=blankScene(),e=entity('ASCII drawing','O');
 e.source={kind:'ascii',ascii:{text:atCap,fontFamily:'monospace'}};
 s.entities=[e];j.scenes=[s];
 const round=validateJourney(JSON.parse(JSON.stringify(j)));
 const back=round.scenes[0].entities[0].source;
 assert.equal(back?.kind==='ascii'?back.ascii.text.length:-1,50000);
 const over=blankJourney();over.scenes=[blankScene()];
 const e2=entity('ASCII drawing','O');e2.source={kind:'ascii',ascii:{text:atCap+'*'}};
 over.scenes[0].entities=[e2];
 assert.throws(()=>validateJourney(over),/ASCII/);
});

test('authoring limits: an upload-sized image dataUrl stays inside the document bound',()=>{
 // The upload path accepts files up to 8,000,000 bytes; base64 inflates to 4*ceil(8e6/3) characters,
 // which must stay under validateJourney's 12,000,000-character dataUrl ceiling.
 const prefix='data:image/png;base64,',dataUrl=prefix+'A'.repeat(Math.ceil(8_000_000/3)*4);
 assert.equal(dataUrl.length,10_666_690);
 const j=blankJourney(),s=blankScene(),e=entity('Photo','O');
 e.source={kind:'image',image:{mode:'luminance',threshold:.5,scale:1,invert:false,dataUrl}};
 s.entities=[e];j.scenes=[s];
 const round=validateJourney(JSON.parse(JSON.stringify(j)));
 const back=round.scenes[0].entities[0].source;
 assert.equal(back?.kind==='image'?back.image.dataUrl!.length:-1,dataUrl.length);
});

test('authoring limits: prose fields accept exactly the bound the editor enforces',()=>{
 const j=blankJourney();j.description='x'.repeat(5000);validateJourney(j);
 const over=blankJourney();over.description='x'.repeat(5001);
 assert.throws(()=>validateJourney(over),/metadata/);
});
