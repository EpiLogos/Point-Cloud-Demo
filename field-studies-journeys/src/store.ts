import {Journey,clone,validateJourney} from './model.js';
export const STORAGE_KEY='oi.field-studies.journey-library.v1';
export class DocumentStore {
 document:Journey;undoStack:Journey[]=[];redoStack:Journey[]=[];private baseline:Journey|null=null;
 constructor(document:Journey){this.document=clone(document);}
 begin(){if(!this.baseline)this.baseline=clone(this.document);}
 finish(){if(!this.baseline)return;const before=this.baseline;this.baseline=null;if(JSON.stringify(before)!==JSON.stringify(this.document)){this.undoStack.push(before);if(this.undoStack.length>60)this.undoStack.shift();this.redoStack=[];this.document.updatedAt=new Date().toISOString();}}
 change(fn:(doc:Journey)=>void){this.begin();fn(this.document);this.finish();}
 undo(){this.finish();const d=this.undoStack.pop();if(!d)return false;this.redoStack.push(clone(this.document));this.document=d;return true;}
 redo(){const d=this.redoStack.pop();if(!d)return false;this.undoStack.push(clone(this.document));this.document=d;return true;}
 replace(doc:Journey){this.change(()=>{this.document=clone(doc);});}
}
export function readLibrary():Journey[]{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return[];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return[];return parsed.flatMap(v=>{try{return[validateJourney(v)];}catch{return[];}});}catch{return[];}}
export function saveToLibrary(journey:Journey){const all=readLibrary().filter(j=>j.id!==journey.id);all.unshift(clone(journey));localStorage.setItem(STORAGE_KEY,JSON.stringify(all.slice(0,24)));return all;}
