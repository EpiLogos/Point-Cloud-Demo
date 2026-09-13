import {cataloguePalettes,catalogueGlyphs,catalogueSequences,runtimeControls} from './nativeCatalogueUI.js';
import {NATIVE_LAYOUTS} from './nativeFeatures.js';
import {esc} from './icons.js';

const refinementStyle=document.createElement('style');
refinementStyle.textContent='#inspector[data-pointer-live="true"]{display:flex!important}.pointer-live-badge{font-size:8px;letter-spacing:.06em;color:var(--accent);margin-right:auto}.pointer-editor-live #inspector{pointer-events:auto}@media(max-width:620px){#inspector[data-pointer-live="true"]{width:min(310px,calc(100vw - 54px))}}';
document.head.append(refinementStyle);

/**
 * Late-bound UI accommodations for native capabilities that do not belong in the
 * engine adapter. This deliberately decorates the approved inspector rather than
 * introducing another settings surface or another simulation owner.
 */
let preservePointerInspector=false;
let enhancing=false;

function html(parent:Element,markup:string){
 const template=document.createElement('template');template.innerHTML=markup.trim();
 parent.append(...Array.from(template.content.childNodes));
}
function detail(id:string){return document.querySelector<HTMLDetailsElement>(`#inspector-content details[data-detail="${id}"]`);}
function nativeLayouts(){
 return `<details class="control-group" data-detail="native-spacing"><summary>Native spacing</summary><div class="group-content"><p class="control-note">Original native world-unit spacing. Applies to selected unlocked formations on the composition plane.</p><div class="layout-grid">${Object.keys(NATIVE_LAYOUTS).map(id=>`<button data-action="native-layout" data-value="${esc(id)}">${esc(id.replaceAll('_',' '))}</button>`).join('')}</div></div></details>`;
}
function templateOptions(prefix:string){return `<div data-native-template-options><label class="control"><span>Template geometry</span><select data-bind="${prefix}.templateGeometry"><option value="">Inherit field template geometry</option><option value="square">Square plate</option><option value="circular">Circular plate</option><option value="volumetric3D">Volumetric template</option></select></label><label class="control"><span>Template sampling</span><select data-bind="${prefix}.templateDimension"><option value="">Inherit field template sampling</option><option value="2D">2D</option><option value="3D">3D</option></select></label><p class="control-note">A sampled target geometry, not an independent physical resonator.</p></div>`;}

function enhanceInspector(){
 if(enhancing)return;enhancing=true;
 try{
  const content=document.getElementById('inspector-content');if(!content)return;

  // Glyph catalogue belongs beside the glyph/word being authored.
  for(const input of content.querySelectorAll<HTMLInputElement>('input[data-bind="entity.text"],input[data-bind="step.text"]')){
   const prefix=input.dataset.bind!.startsWith('step.')?'step':'entity';
   const control=input.closest('.control');
   if(control&&!control.nextElementSibling?.matches('details[data-detail="glyph-catalogue"]'))control.insertAdjacentHTML('afterend',catalogueGlyphs(prefix));
  }

  // Image and ASCII are native target sources, not an obscure compatibility lane.
  const source=detail('source');
  if(source&&!source.dataset.parityEnhanced){
   source.dataset.parityEnhanced='true';source.open=true;
   const summary=source.querySelector('summary');if(summary&&summary.firstChild)summary.firstChild.textContent='Image / ASCII → formation';
   const select=source.querySelector<HTMLSelectElement>('select[data-action="source-kind"]');
   if(select){
    const labels:Record<string,string>={none:'Glyph / formation geometry',image:'Image → formation',ascii:'ASCII → formation'};
    for(const option of select.options)if(labels[option.value])option.textContent=labels[option.value];
   }
   const note=source.querySelector('.control-note');if(note)note.textContent='Use an embedded image or ASCII drawing as the sampled target for this formation. The source travels with the expression and portable artifact.';
  }

  // Native palette/paper catalogue remains contextual to appearance.
  const palette=detail('palette')?.querySelector('.group-content');
  if(palette&&!palette.querySelector('[data-detail="native-palettes"]'))html(palette,cataloguePalettes());

  // Native layout algorithms are distinct from fitted authoring layouts.
  const arrange=detail('arrange')?.querySelector('.group-content');
  if(arrange&&!arrange.querySelector('[data-detail="native-spacing"]'))html(arrange,nativeLayouts());

  // Native chain presets remain ordinary editable links after application.
  const motion=content.querySelector('.motion-content');
  const activeMotion=content.querySelector<HTMLButtonElement>('.motion-tabs button.active')?.dataset.value;
  if(activeMotion==='sequence'&&motion&&!motion.querySelector('[data-detail="sequence-presets"]')){
   const first=motion.querySelector('section');if(first)html(first,catalogueSequences());
  }
  if(activeMotion==='morph'&&motion&&!motion.querySelector('[data-action="native-reset-phases"]')){
   const first=motion.querySelector('section');if(first)html(first,'<button class="secondary" data-action="native-reset-phases">Reset running phases</button>');
  }

  // Runtime-only commands are clearly separated from undoable document edits.
  if(content.querySelector('[data-detail="physics"]')&&!content.querySelector('[data-detail="native-runtime"]'))html(content,runtimeControls());

  // Cymatic authored targets can override field template sampling without becoming resonators.
  for(const input of content.querySelectorAll<HTMLInputElement>('input[data-bind="entity.templateFrequency"],input[data-bind="step.templateFrequency"]')){
   if(input.closest('.number-field')?.parentElement?.querySelector('[data-native-template-options]'))continue;
   const prefix=input.dataset.bind!.startsWith('step.')?'step':'entity';
   input.closest('.number-field')?.insertAdjacentHTML('afterend',templateOptions(prefix));
  }

  if(preservePointerInspector){
   const inspector=document.getElementById('inspector');
   if(inspector){inspector.hidden=false;inspector.dataset.pointerLive='true';}
   const footer=document.querySelector('#inspector .inspector-footer');
   if(footer&&!footer.querySelector('.pointer-live-badge'))html(footer,'<span class="pointer-live-badge">● Interact live</span>');
  }
 } finally {enhancing=false;}
}

function retainPointerInspector(){
 if(!preservePointerInspector)return;
 const inspector=document.getElementById('inspector');if(!inspector)return;
 if(inspector.hidden)inspector.hidden=false;
 inspector.dataset.pointerLive='true';document.body.classList.add('pointer-editor-live');
 enhanceInspector();
}
function clearPointerInspector(){
 preservePointerInspector=false;document.body.classList.remove('pointer-editor-live');
 document.getElementById('inspector')?.removeAttribute('data-pointer-live');
}

// Capture phase records the panel before the controller switches into direct Interact.
document.addEventListener('click',event=>{
 const target=(event.target as Element).closest<HTMLElement>('[data-action],[data-rail]');if(!target)return;
 const action=target.dataset.action,rail=target.dataset.rail;
 if(action==='tool-interact'||rail==='interact'){
  const inspector=document.getElementById('inspector');
  preservePointerInspector=!!inspector&&!inspector.hidden;
  if(preservePointerInspector)queueMicrotask(retainPointerInspector);
  return;
 }
 if(action==='close-inspector'||action==='edit'||(rail&&rail!=='interact')||action==='tab')clearPointerInspector();
},true);

document.addEventListener('input',event=>{
 const input=event.target as HTMLInputElement;if(!input.hasAttribute('data-glyph-search'))return;
 const q=input.value.trim().toLowerCase(),root=input.closest('[data-detail="glyph-catalogue"]');if(!root)return;
 root.querySelectorAll<HTMLElement>('[data-action="native-glyph"]').forEach(button=>{button.hidden=!(button.title+' '+button.dataset.value).toLowerCase().includes(q);});
 root.querySelectorAll<HTMLDetailsElement>('.group-content>details').forEach(group=>{group.hidden=!Array.from(group.querySelectorAll<HTMLElement>('[data-action="native-glyph"]')).some(button=>!button.hidden);if(q&&!group.hidden)group.open=true;});
});

let observedInspector:Element|null=null,observedContent:Element|null=null;
function installObservers(){
 const inspector=document.getElementById('inspector'),content=document.getElementById('inspector-content');
 if(inspector&&inspector!==observedInspector){observedInspector=inspector;new MutationObserver(()=>{if(preservePointerInspector)queueMicrotask(retainPointerInspector);}).observe(inspector,{attributes:true,attributeFilter:['hidden']});}
 if(content&&content!==observedContent){observedContent=content;new MutationObserver(()=>queueMicrotask(enhanceInspector)).observe(content,{childList:true,subtree:true});queueMicrotask(enhanceInspector);}
}
new MutationObserver(installObservers).observe(document.documentElement,{childList:true,subtree:true});
queueMicrotask(installObservers);
