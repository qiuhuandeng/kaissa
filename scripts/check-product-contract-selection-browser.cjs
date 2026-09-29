// Run against dedicated prototype Chrome on 9359 and local server on 4197.
const fs=require('node:fs'), assert=require('node:assert/strict');
async function browser(){const tabs=await fetch('http://127.0.0.1:9359/json/list').then(r=>r.json()),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let seq=0;const pending=new Map(),errors=[];const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,[r,j]);ws.send(JSON.stringify({id,method,params}));});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const [r,j]=pending.get(m.id);pending.delete(m.id);m.error?j(m.error):r(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true});};await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});const delay=n=>new Promise(r=>setTimeout(r,n));const ev=async code=>{const x=await send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw Error(x.exceptionDetails.exception?.description);return x.result.value;};const click=async sel=>{await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing '+${JSON.stringify(sel)});e.click();})()`);await delay(330);};const set=async(sel,val)=>{await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing '+${JSON.stringify(sel)});e.value=${JSON.stringify(val)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);};const page=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4197/'+path});await delay(900);};const shot=async name=>{await delay(300);fs.mkdirSync('docs/evidence/product-contract-selection-20260928',{recursive:true});fs.writeFileSync('docs/evidence/product-contract-selection-20260928/'+name+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));};return {send,ev,click,set,page,shot,errors,close:()=>ws.close()};};
(async()=>{const t=await browser(),{send,ev,click,set,page,shot}=t;let count=0;
const check=async(name,expr)=>{assert.equal(await ev(expr),true,name);console.log('PASS '+name);count++;};
try {
 await send('Emulation.setDeviceMetricsOverride',{width:1366,height:950,deviceScaleFactor:1,mobile:false});
 for(const file of ['product-self-edit.html','product-self-edit.html?type=free','product-cruise-edit.html','product-train-edit.html','product-study-edit.html','product-outsource-package.html']) {
  await page('merchant/product/'+file);
  await check(file+'默认沿用且全产品只有一个选择入口',`document.querySelectorAll('.product-contract').length===1&&document.querySelector('[name=productContractMode]:checked').value==='inherit'&&document.querySelector('[data-pc-template]').disabled`);
  await check(file+'保险资料在费用原区域且可留空',`!!document.querySelector('#insuranceService')&&!document.querySelector('.product-contract #insuranceService')&&!document.querySelector('#insuranceService').required`);
  await check(file+'移除重复合同长表单',`!document.querySelector('[data-pc-allow], [data-pc-check], [data-pc="formation"], [data-pc="version"]')`);
  await click('[name=productContractMode][value=specified]');
  await check(file+'指定时仅一个下拉并有适用模板',`document.querySelectorAll('.product-contract select').length===1&&!document.querySelector('[data-pc-template]').disabled&&document.querySelector('[data-pc-template]').options.length>1`);
  await check(file+'未指定模板拦截并定位',`ProductContractConfig.validate()===false&&document.querySelector('.product-contract').getBoundingClientRect().height>0`);
  const id=await ev(`document.querySelector('[data-pc-template]').options[1].value`);
  await set('[data-pc-template]',id);
  await check(file+'选一份模板可通过',`ProductContractConfig.validate()===true&&ProductContractConfig.capture()[0].template===${JSON.stringify(id)}`);
  await click('[name=productContractMode][value=inherit]');
  await check(file+'回沿用清除指定且无额外必填',`ProductContractConfig.capture()[0].template===''&&ProductContractConfig.validate()===true`);
 }
 await page('merchant/product/product-self-edit.html');await click('[name=productContractMode][value=specified]');await set('[data-pc-template]','T-GROUP-2026');await set('#travelType','境内游');
 await check('旅游范围改变后原出境模板失效',`ProductContractConfig.capture()[0].template===''&&document.querySelector('.pc-status').textContent.includes('不再适用')`);
 await set('[data-pc-template]','T-DOMESTIC-2026');await ev(`document.querySelector('.product-contract').scrollIntoView({block:'center'})`);await shot('group-specified');
 await page('merchant/product/product-study-edit.html');
 await check('研学资料放课程和费用，不在模板区',`!!document.querySelector('#courseItinerary #studyCourseHours')&&!!document.querySelector('#feeNote #studyCourseFeeItems')&&!document.querySelector('.product-contract [data-product-material]')`);
 await set('#studyCourseHours','');await check('课时缺失定位课程区域',`!ProductContractConfig.validate()&&document.querySelector('#courseItinerary').classList.contains('active')`);await set('#studyCourseHours','20');await check('补充课时恢复',`ProductContractConfig.validate()`);
 await shot('study-course');
 await page('merchant/product/product-cruise-edit.html');await check('邮轮岸上标准在航程区域',`!!document.querySelector('#shoreServiceStandard')&&!document.querySelector('.product-contract #shoreServiceStandard')`);
 await set('#shoreServiceStandard','');await check('岸上标准缺失拦截',`!ProductContractConfig.validate()`);await set('#shoreServiceStandard','岸上交通、游览4小时、含午餐、返船集合时间见每日安排');await check('岸上标准补充恢复',`ProductContractConfig.validate()`);await shot('cruise-service');
 await page('merchant/product/products.html');await ev(`ProductContractConfig.openService(null);document.querySelector('#serviceProductDrawer').classList.add('show')`);
 await check('单项服务规格在独立业务区',`!!document.querySelector('[data-service-details] [data-service-field=spec]')&&!document.querySelector('.product-contract textarea')`);
 await set('[data-service-field=spec]','日本签证');await set('[data-service-field=conditions]','材料齐全后递交');await set('[data-service-field=fee]','含代办服务费，不含领馆费用');await set('[data-service-field=deadline]','出行前20天');
 await check('服务选择沿用时仅校验自身服务资料',`ProductContractConfig.serviceValid()`);
 await set('#serviceProductType','酒店');await check('酒店不显示签证期限',`!document.querySelector('[data-service-field=deadline]')&&document.querySelector('[data-service-details]').textContent.includes('房型')`);
 await set('#serviceProductType','签证');await check('切换类型保留各自资料',`document.querySelector('[data-service-field=spec]').value==='日本签证'`);
 await click('[name=productContractMode][value=specified]');await set('[data-pc-template]','T-AGENCY-2026-出境');
 await ev(`window.testServiceRow=document.querySelector('[data-service-name]');ProductContractConfig.saveService(testServiceRow);ProductContractConfig.openService(null);ProductContractConfig.openService(testServiceRow)`);
 await check('重开服务保留模式模板及规格',`ProductContractConfig.capture()[0].template==='T-AGENCY-2026-出境'&&document.querySelector('[data-service-field=spec]').value==='日本签证'`);await shot('service-fields');
 await page('merchant/product/product-study-edit.html?mode=view');await check('研学详情模板区域保持只读',`Array.from(document.querySelectorAll('.product-contract input, .product-contract select')).every(n=>n.disabled)`);
 await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await page('merchant/product/product-self-edit.html');await click('[name=productContractMode][value=specified]');await ev(`document.querySelector('.product-contract').scrollIntoView({block:'center'})`);
 await check('1024宽无页面溢出',`document.documentElement.scrollWidth<=innerWidth&&document.querySelector('[data-pc-template]').getBoundingClientRect().right<=innerWidth`);await shot('group-1024');
 assert.deepEqual(t.errors,[]);console.log('完成 '+count+' 组页面检查；运行异常 0');
} catch(error){await shot('failure');throw error;} finally {t.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
