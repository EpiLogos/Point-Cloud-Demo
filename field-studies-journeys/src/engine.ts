import {Scene,Vec3} from './model.js';
import {Camera} from './camera.js';
/** All document writes belong to the shell. Adapters never create their own clock or UI. */
export interface EngineFrame {
 scene:Readonly<Scene>;scaffold?:'off'|'axis'|'grid';authoringRevision?:number;simTime:number;delta:number;params:Readonly<Record<string,number>>;
 camera:Readonly<Camera>;pointer:{active:boolean;world:Vec3};selectedIds:ReadonlyArray<string>;
}
export interface EngineCapabilities {name:string;kind:'preview'|'production';parameters:ReadonlyArray<string>;physicalResonance:boolean;runtimeCheckpoints:boolean;exactSeek:boolean;notes:ReadonlyArray<string>}
export type EngineCommand={type:'reset-field'}|{type:'recover-context'}|{type:'reset-phases'}|{type:'disperse';strength:number}|{type:'fire-automation';id:string;delay?:number};
export interface FieldEngineAdapter {
 command?(command:EngineCommand):void;
 readonly canvas:HTMLCanvasElement;
 readonly capabilities:EngineCapabilities;
 render(frame:EngineFrame):void;
 resize(width:number,height:number,pixelRatio:number):void;
 needsRender?():boolean;
 telemetry?():any;
 capture?(width:number,height:number):HTMLCanvasElement;
 withCleanFrame?<T>(copy:()=>T):T;
 inspect?(readParticles?:boolean):unknown;
 projectNative?(point:Vec3):unknown;
 stations?():Array<{index:number;name:string;frequencyHz:number;m:number;n:number;color:string}>;
 dispose():void;
}
export type EngineFactory=(canvas:HTMLCanvasElement)=>FieldEngineAdapter;
declare global {interface Window {
 OI_ENGINE_FACTORY?:EngineFactory;
 __JOURNEY__?:unknown;
 __START_PRESENTATION__?:boolean;
 __FIELD_STUDIES__?:any;
}}
