import assert from 'node:assert/strict';
import {test} from './harness';
import {FONT_OPTIONS,CUSTOM_SENTINEL,ENGINE_FALLBACK_STACK,resolveFontOption} from '../field-studies-journeys/src/fontCatalog';
import {DEFAULT_ENGINE_SETTINGS} from '../field-studies-journeys/src/model';

/** The engine's long cross-platform fallback stack, copied from src/engine/GlyphSampler.ts (FALLBACK_FONT_STACK). */
const GLYPH_SAMPLER_FALLBACK='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

test('font catalog entries are valid CSS family lists with unique ids',()=>{
 const ids=new Set<string>();
 for(const o of FONT_OPTIONS){
  assert.ok(!ids.has(o.id),'duplicate id: '+o.id);ids.add(o.id);
  assert.ok(o.stack.length>0,'empty stack: '+o.id);
  assert.ok(/,\s*(sans-serif|serif|monospace)$/.test(o.stack),'no generic-family tail: '+o.stack);
  for(const family of o.stack.split(',').map(f=>f.trim())){
   assert.ok(family.length>0,'empty family in: '+o.stack);
   const quoted=family.startsWith('"')&&family.endsWith('"')&&family.length>=3;
   if(quoted)assert.ok(!family.slice(1,-1).includes('"'),'nested quote in: '+o.stack);
   else assert.ok(!/\s/.test(family),'unquoted multi-word family in: '+o.stack);
  }
  // Every curated stack must round-trip through the resolver as its own selection.
  assert.equal(resolveFontOption(o.stack).optionId,o.id,'round-trip failed for '+o.id);
  assert.equal(resolveFontOption(o.stack).stack,o.stack);
 }
});

test('the first option is System Sans and byte-matches the engine default stack',()=>{
 const system=FONT_OPTIONS[0];
 assert.equal(system.id,'system-sans');
 assert.equal(system.stack,'system-ui, -apple-system, sans-serif');
 assert.equal(system.stack,DEFAULT_ENGINE_SETTINGS.fontFamily);
});

test('resolveFontOption maps the default, the engine fallback and undefined to System Sans',()=>{
 const systemId=FONT_OPTIONS[0].id;
 assert.equal(resolveFontOption(DEFAULT_ENGINE_SETTINGS.fontFamily!).optionId,systemId);
 assert.equal(resolveFontOption(GLYPH_SAMPLER_FALLBACK).optionId,systemId,'the long GlyphSampler fallback must alias System Sans');
 assert.equal(resolveFontOption(GLYPH_SAMPLER_FALLBACK).stack,DEFAULT_ENGINE_SETTINGS.fontFamily);
 assert.equal(ENGINE_FALLBACK_STACK,GLYPH_SAMPLER_FALLBACK,'the catalog alias drifted from src/engine/GlyphSampler.ts');
 assert.equal(resolveFontOption(undefined).optionId,systemId);
 assert.equal(resolveFontOption(undefined).stack,DEFAULT_ENGINE_SETTINGS.fontFamily);
 assert.equal(resolveFontOption('').optionId,systemId,'an empty stack falls back to System Sans');
 assert.equal(resolveFontOption('   ').optionId,systemId);
});

test('unknown stacks resolve to the custom sentinel with the value passed through',()=>{
 const weird='"Iowan Old Style", Palatino, serif';
 const r=resolveFontOption(weird);
 assert.equal(r.optionId,CUSTOM_SENTINEL);
 assert.equal(r.stack,weird);
 // Surrounding whitespace is trimmed for matching but never rewritten on passthrough.
 const padded='  '+weird+'  ';
 const p=resolveFontOption(padded);
 assert.equal(p.optionId,CUSTOM_SENTINEL);
 assert.equal(p.stack,padded);
});
