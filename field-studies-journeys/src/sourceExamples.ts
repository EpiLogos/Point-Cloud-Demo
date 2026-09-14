import {Journey,Scene,blankScene,entity,SequenceStep} from './model.js';
import {FACE_COLOUR_DATA_URL,FACE_MONO_DATA_URL,FACE_ASCII_ART} from './sourceExamplesData.generated.js';
import type {StartingPoint} from './expressions.js';

/** Source studies: the same mask carried through the whole pipeline —
 * mono line art, colour photograph, silhouette cutout and its ASCII
 * transcription. Each opens as an editable expression. */
function studyScene(name:string,character:string):Scene{
 const s=blankScene(name);
 s.id='scene-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 s.character=character;
 s.duration=14;
 const mask=entity('Wireframe mask','O');
 mask.id='mask';
 mask.size={x:1.5,y:1.5}; // square extent preserves the sampled subject's true aspect
 s.entities=[mask];
 s.text=[];
 return s;
}

function mono():Journey{
 const s=studyScene('Mono ink study','A wireframe mask, drawn in dark ink on light paper.');
 const mask=s.entities[0];
 mask.source={kind:'image',image:{mode:'luminance',threshold:.19,invert:false,scale:1,dataUrl:FACE_MONO_DATA_URL,name:'face-mono.png'}};
 s.field.palette=['#20261f','#5d6b60','#94a392'];
 Object.assign(s.field.params,{count:62000,size:2.3,contrast:.7,warp:.08,dispersion:.04,jitter:.45,speed:.4,turbulence:.12});
 const j:Journey={schema:'oi.journey' as const,version:1,id:'source-mask-mono',name:'Mask · mono ink study',description:'Line art sampled by detected ink polarity — the strokes, never the paper.',loop:true,scenes:[s],updatedAt:new Date().toISOString()};
 return j;
}

function neon():Journey{
 const s=studyScene('Neon colour study','The same mask as light: bright wire on a dark field.');
 const mask=s.entities[0];
 mask.source={kind:'image',image:{mode:'luminance',threshold:.28,invert:false,scale:1,dataUrl:FACE_COLOUR_DATA_URL,name:'face-colour.jpg'}};
 s.field.background='#0a0f1c';
 s.field.palette=['#e8fbff','#6fd8e8','#2e7fa8'];
 s.engine.inkMode='whiteOnBlack';
 s.engine.backgroundMode='ambientGlow';
 Object.assign(s.field.params,{count:62000,size:2.3,opacity:.95,contrast:.9,warp:.15,dispersion:.06,speed:.5});
 const j:Journey={schema:'oi.journey' as const,version:1,id:'source-mask-neon',name:'Mask · neon colour study',description:'Light ink on dark paper, auto-detected from the photograph itself.',loop:true,scenes:[s],updatedAt:new Date().toISOString()};
 return j;
}

function cutout():Journey{
 const s=studyScene('Cutout and dissolve','A true silhouette cutout, then the field remembers its letter.');
 const mask=s.entities[0];
 // The colour photograph is one coherent subject: the cutout fills it solid.
 mask.source={kind:'image',image:{mode:'silhouette',threshold:.24,invert:false,scale:1,dataUrl:FACE_COLOUR_DATA_URL,name:'face-colour.jpg'}};
 const step=(text:string,id:string):SequenceStep=>({id,text,shape:'text',hold:4,transition:3,position:null});
 mask.sequence={...mask.sequence,enabled:true,clock:'seconds',steps:[step('O','step-o'),step('I','step-i')]};
 s.field.background='#101418';
 s.field.palette=['#e6e2d8','#9fb0a8','#5d6b60'];
 s.engine.inkMode='whiteOnBlack';
 Object.assign(s.field.params,{count:62000,size:2.2,contrast:.85,warp:.12,dispersion:.05,speed:.45});
 const j:Journey={schema:'oi.journey' as const,version:1,id:'source-mask-cutout',name:'Mask · cutout and dissolve',description:'Enclosed regions stay with the subject. The sequence morphs cutout → O → I.',loop:true,scenes:[s],updatedAt:new Date().toISOString()};
 return j;
}

function ascii():Journey{
 const s=studyScene('ASCII transcription','The mask retyped — image to characters to particles.');
 const mask=s.entities[0];
 mask.source={kind:'ascii',ascii:{text:FACE_ASCII_ART,fontFamily:'monospace'}};
 s.field.palette=['#26251f','#5a584c','#8b8576'];
 Object.assign(s.field.params,{count:54000,size:2.2,contrast:.8,warp:.1,dispersion:.04,speed:.4});
 const j:Journey={schema:'oi.journey' as const,version:1,id:'source-mask-ascii',name:'Mask · ASCII transcription',description:'The same drawing transcribed into typed marks; the glyph field samples them like any source.',loop:true,scenes:[s],updatedAt:new Date().toISOString()};
 return j;
}

export function sourceStudies():StartingPoint[]{
 return [mono(),neon(),cutout(),ascii()].map(expression=>({id:expression.id,group:'Source studies' as const,expression}));
}
