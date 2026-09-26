// Dedicated local Chrome, e.g. --remote-debugging-port=9359 --user-data-dir=/private/tmp/caesar-field-permissions-chrome
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const tab=await fetch('http://127.0.0.1:9359/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
 const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0,count=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,[resolve,reject]);ws.send(JSON.stringify({id,method,params}));});
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p[1](m.error):p[0](m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true});};
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const click=async selector=>{await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('missing '+${JSON.stringify(selector)});n.click();})()`);await wait(100);};
 const set=async(selector,value)=>evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});n.value=${JSON.stringify(value)};n.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const page=async file=>{const url='file://'+encodeURI(path.resolve(__dirname,'..',file));await send('Page.navigate',{url});for(let i=0;i<100;i++){await wait(100);const ready=await evaluate(`location.href===${JSON.stringify(url)} && document.readyState!=='loading' && !!document.querySelector('main') && (location.pathname.includes('positions.html') ? !!document.querySelector('#positionRows tr') : location.pathname.includes('merchant-roles.html') ? !!document.querySelector('[data-price-role]') : !!document.querySelector('[data-open-market-detail]'))`);if(ready)return;}throw Error('页面加载超时：'+file+' '+await evaluate(`JSON.stringify({url:location.href,ready:document.readyState,main:!!document.querySelector('main')})`));};
 const check=async(name,expr)=>{assert.equal(await evaluate(expr),true,name);count++;console.log('PASS '+name);};
 const shot=async name=>{await wait(250);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/price-permissions-'+name+'.png',Buffer.from(r.data,'base64'));};
 try{
  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page('admin/positions.html');await evaluate('localStorage.removeItem(PriceFieldPermissions.key)');await page('admin/positions.html');
  await check('岗位列表含三类岗位',`['直营电销顾问','加盟门店店长','加盟门店店员'].every(x=>document.querySelector('#positionRows').innerText.includes(x))`);
  await click('[data-edit-position="P010"]');await click('[data-position-tab="fields"]');
  await check('店长加载可见字段',`document.querySelector('#positionSettlement').checked && !document.querySelector('#positionSettlement').disabled`);await shot('position-fields');
  await click('#positionSettlement');await click('#positionSave');await wait(300);await click('[data-edit-position="P010"]');await click('[data-position-tab="fields"]');
  await check('保存复开保留取消授权',`!document.querySelector('#positionSettlement').checked`);
  await click('[data-close-position-drawer]');await wait(300);await click('[data-edit-position="P011"]');await click('[data-position-tab="fields"]');
  await check('店员明确禁止开放',`document.querySelector('#positionSettlement').disabled && !document.querySelector('#positionSettlement').checked && document.querySelector('#positionRole').disabled`);await click('[data-close-position-drawer]');await wait(300);
  await page('admin/merchant-roles.html');await check('角色新增后数量正确',`document.querySelector('.list-surface-pagination > span').textContent==='共 9 条'`);await check('角色字段操作首屏可达',`(()=>{const c=document.querySelector('[data-price-role="franchise-manager"]');return c.getBoundingClientRect().right<=innerWidth && getComputedStyle(c.closest('td')).position==='sticky';})()`);await shot('roles');await click('[data-price-role="franchise-manager"]');
  await check('角色入口采用岗位保存结果',`!document.querySelector('#roleSettlement').checked`);await click('#roleSettlement');await click('#saveRoleFields');await wait(300);
  await page('admin/positions.html');await click('[data-edit-position="P010"]');await click('[data-position-tab="fields"]');
  await check('角色保存反映到岗位',`document.querySelector('#positionSettlement').checked`);await click('[data-close-position-drawer]');await wait(300);await shot('positions');
  await click('[data-open-position-drawer]');await set('#positionName','');await click('#positionSave');await check('空岗位名称拦截',`document.querySelector('#positionError').textContent.includes('请填写岗位名称')`);await click('[data-close-position-drawer]');await wait(300);
  await set('[aria-label="岗位筛选"] input','不存在岗位');await click('.btn-filter-search');await check('岗位搜索空结果',`document.querySelector('#positionRows').textContent.includes('暂无符合条件')`);
  await page('admin/positions.html');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await wait(200);await click('.nav-toggle');await shot('position-narrow');
  await check('岗位窄屏表格内滚动、操作列固定宽度',`(()=>{const c=document.querySelector('#positionRows td:last-child'),w=document.querySelector('.position-table-wrap');return getComputedStyle(c).position==='sticky' && c.getBoundingClientRect().width<=118 && w.scrollWidth>w.clientWidth;})()`);
  await click('[data-edit-position="P010"]');await click('[data-position-tab="fields"]');await shot('fields-narrow');
  await check('岗位字段抽屉未横向溢出',`(()=>{const x=document.querySelector('.position-drawer');return x.scrollWidth<=x.clientWidth+1;})()`);
  assert.deepEqual(errors,[],'浏览器脚本异常');console.log('完成 '+count+' 组浏览器检查，脚本异常 0');
 }catch(error){await shot('failure');throw error;}finally{await send('Target.closeTarget',{targetId:tab.id});ws.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
