// Run against: python3 -m http.server 8000
// Requires Playwright and Chromium; no application build or npm dependencies.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.ORBIT_BASE_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE|Shader|WebGLProgram/.test(message.text()))errors.push(message.text());});
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
 async function go(path){await page.goto(base+path);await page.waitForTimeout(200);}
 async function state(){return page.evaluate(()=>JSON.parse(localStorage.getItem('orbit.passport.v1')));}
 await go('index.html');await page.evaluate(()=>localStorage.clear());
 await go('echo.html');assert.equal(await page.locator('#secret-locked').isVisible(),true);
 await go('signal.html');await page.fill('#coordinates','07-21-42');await page.locator('#decode-form button').click();assert.match(await page.locator('#decode-status').innerText(),/Сначала/);
 await go('solar.html');await page.locator('#solar-view canvas').waitFor();
 for(const id of ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'])await page.selectOption('#target',id);
 assert.ok((await state()).achievements.includes('navigator'));
 await page.selectOption('#target','saturn');await page.getByRole('button',{name:'Поймать сигнал из колец'}).click();
 await page.selectOption('#scale-mode','relative');await page.locator('#solar-reset').click();
 await page.locator('#free-flight').check();await page.locator('#solar-view canvas').focus();await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');await page.locator('#free-flight').uncheck();
 await page.locator('#solar-pause').click();assert.equal(await page.locator('#solar-pause').getAttribute('aria-pressed'),'true');
 await page.locator('[data-audio]').click();assert.equal(await page.locator('[data-audio]').getAttribute('aria-pressed'),'true');await page.locator('[data-audio]').click();
 await page.locator('[data-immersion]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#solar-view').evaluate(el=>el.classList.contains('immersive')),true);await page.keyboard.press('Escape');await page.waitForTimeout(200);assert.equal(await page.locator('#solar-view').evaluate(el=>el.classList.contains('immersive')),false);
 await page.screenshot({path:'/tmp/orbit-solar-v3.png',fullPage:true});
 await go('hangar.html');await page.fill('#ship-name','Искра');await page.selectOption('#hull','freighter');await page.selectOption('#engine','plasma');await page.locator('#paint').fill('#f58567');await page.locator('#ship-form button[type=submit]').click();await page.reload();assert.equal(await page.inputValue('#ship-name'),'Искра');assert.equal(await page.inputValue('#hull'),'freighter');assert.equal(await page.inputValue('#paint'),'#f58567');await page.screenshot({path:'/tmp/orbit-hangar-v3.png',fullPage:true});
 await go('lab.html');await page.fill('#mass','100');assert.match(await page.locator('#weights').innerText(),/37.9/);await page.locator('#lab-scan').click();assert.match(await page.locator('#lab-message').innerText(),/21/);
 await go('blackhole.html');await page.locator('#hole-view canvas').waitFor();await page.locator('#hole-mass').fill('1.3');await page.locator('#hole-tilt').fill('0.5');await page.locator('#hole-lens').fill('0.9');await page.locator('#hole-scan').click();await page.screenshot({path:'/tmp/orbit-hole-v3.png',fullPage:true});
 await go('signal.html');await page.fill('#coordinates','11-11-11');await page.locator('#decode-form button').click();assert.match(await page.locator('#decode-status').innerText(),/не установлена/);await page.fill('#coordinates','07-21-42');await page.locator('#decode-form button').click();await page.locator('#secret-link').click();assert.equal(await page.locator('#secret-found').isVisible(),true);
 await go('mission.html');await page.fill('#explorer','Алекс');await page.selectOption('#destination','europa');await page.locator('#expedition button[type=submit]').click();const download=page.waitForEvent('download');await page.locator('#download').click();assert.equal((await download).suggestedFilename(),'orbit-boarding-pass.txt');
 await go('atlas.html');await page.locator('[data-planet=europa]').click();await page.locator('#wireframe').check();
 await go('passport.html');assert.match(await page.locator('#identity-name').innerText(),/Алекс/);assert.match(await page.locator('#passport-ship').innerText(),/Искра/);assert.match(await page.locator('#mission-history').innerText(),/Европа/);assert.equal(await page.locator('.badge.earned').count(),7);await page.reload();assert.equal(await page.locator('.badge.earned').count(),7);
 const exported=page.waitForEvent('download');await page.locator('#export-passport').click();assert.equal((await exported).suggestedFilename(),'orbit-passport.json');
 await page.locator('#reset-passport').click();await page.locator('#cancel-reset').click();assert.equal(await page.locator('.badge.earned').count(),7);
 await go('lander.html');await page.locator('#start-flight').click();await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');assert.ok(parseFloat(await page.locator('#fuel').innerText())<100);await page.keyboard.press('p');assert.equal(await page.locator('#pause-flight').innerText(),'Продолжить');const fuel=await page.locator('#fuel').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('#fuel').innerText(),fuel);await page.locator('#start-flight').click();await page.waitForFunction(()=>document.querySelector('#lander-canvas').dataset.status==='crashed',{},{timeout:30000});assert.match(await page.locator('#flight-status').innerText(),/вне площадки/);await page.locator('#start-flight').click();await page.waitForFunction(()=>document.querySelector('#lander-canvas').dataset.status==='flying');await page.locator('#pause-flight').click();
 await page.screenshot({path:'/tmp/orbit-lander-v3.png',fullPage:true});
 const pages=['index.html','atlas.html','mission.html','lab.html','solar.html','lander.html','hangar.html','blackhole.html','passport.html','signal.html','echo.html'];
 await page.setViewportSize({width:390,height:844});
 for(const path of pages){await go(path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile overflow: '+path);const links=await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h.endsWith('.html')));for(const href of new Set(links)){const response=await context.request.get(base+href);assert.equal(response.status(),200,'Broken link '+href);}}
 await go('hangar.html');await page.screenshot({path:'/tmp/orbit-mobile-v3.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await go('solar.html');assert.equal(await page.locator('#solar-pause').getAttribute('aria-pressed'),'true');await go('hangar.html');assert.equal(await page.locator('#ship-spin').isChecked(),false);await go('blackhole.html');assert.equal(await page.locator('#hole-pause').getAttribute('aria-pressed'),'true');
 await go('passport.html');await page.locator('#reset-passport').click();await page.locator('#confirm-reset').click();assert.equal(await page.locator('.badge.earned').count(),0);await go('echo.html');assert.equal(await page.locator('#secret-locked').isVisible(),true);
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});const noStorage=await blocked.newPage();noStorage.on('pageerror',e=>errors.push(e.message));await noStorage.goto(base+'passport.html');assert.equal(await noStorage.locator('.storage-warning').isVisible(),true);await blocked.close();
 const noGpu=await browser.newContext();await noGpu.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});const fallback=await noGpu.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.goto(base+'solar.html');assert.equal(await fallback.locator('.fallback').isVisible(),true);await fallback.selectOption('#target','mars');assert.equal(await fallback.locator('#target-name').innerText(),'Марс');await noGpu.close();
 assert.deepEqual(errors,[]);
 console.log('PASS: all 11 pages and mobile layouts; WebGL; solar navigation; ship persistence; landing controls/crash/retry; full quest with incorrect-code handling; secret gate; passport, export and reset; mission download; audio and immersion; reduced motion; storage and WebGL fallbacks.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
