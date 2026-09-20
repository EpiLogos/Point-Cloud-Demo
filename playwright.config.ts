import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:90000,workers:1,
 use:{baseURL:'http://127.0.0.1:47834',viewport:{width:1280,height:800},launchOptions:{executablePath:'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']},screenshot:'only-on-failure'},
 webServer:{command:'node server/index.mjs',url:'http://127.0.0.1:47834/api/health',reuseExistingServer:false,env:{PHYSIS_PORT:'47834',PHYSIS_DATA_DIR:'/tmp/physis-master-browser-test-library',PHYSIS_TEST_MODE:'1'}}
});
