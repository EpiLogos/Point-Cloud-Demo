/** Build the unchanged native applications. Only build outputs are written. */
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=process.cwd();for(const name of ['master','main']){
 const cwd=path.resolve('.parity-reference',name);
 if(!fs.existsSync(path.join(cwd,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(cwd,'node_modules'),'dir');
 const result=spawnSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd,stdio:'inherit',env:{...process.env,DISABLE_HMR:'true'}});
 if(result.status!==0)process.exit(result.status??1);
}
