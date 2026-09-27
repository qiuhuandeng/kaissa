// 对独立调试浏览器运行；默认端口9237，可用 MARKET_QA_PORT 修改。无第三方依赖。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const tabs=await (await fetch('http://127.0.0.1:'+(process.env.MARKET_QA_PORT||9237)+'/json/list')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab,'需要独立验收浏览器页面');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0,n=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,expr)=>{assert.ok(await run(expr),name);console.log('PASS '+name);n++;};
const open="document.querySelector('.market-product-card[data-provider-kind=internal]').click();document.querySelector('#marketDetailAgencyButton').click()";
const reset=async()=>{await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../merchant/product/product-market.html')).href});for(let i=0;i<80;i++){await pause(100);if(await run("!!document.querySelector('.market-product-card[data-provider-kind=internal] [data-market-sale-status]')"))return;}throw Error('page not ready: '+JSON.stringify(await run("({url:location.href,text:document.body.innerText.slice(0,700)})"))+' errors='+JSON.stringify(errors));};
try{
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await reset();await run(open);await pause(400);
await check('内部条件可见，外部协议隐藏',"!document.querySelector('#agencyInternalBasis').hidden && document.querySelector('#agencyAgreementField').hidden");
await check('履约、渠道、结算、有效期按产品显示',"['北京凯撒','福建凯撒','履约公司','呼叫中心','待双方财务确认','合作有效期'].every(x=>document.querySelector('#agencyInternalConditions').innerText.includes(x))");
await check('实时可售保留且共享渠道不能扩大',"document.querySelector('#agencyStockResultTitle').innerText.includes('可直接占用') && document.querySelector('#agencySaleRange').disabled");
await run("document.querySelector('#agencyInternalBasis').scrollIntoView({block:'center'})");await pause(300);
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/market-intercompany-desktop.png',Buffer.from(shot.data,'base64'));
await run("document.querySelector('#submitAgencyReview').click()");
await check('合法共享提交并保存合作依据',"document.querySelector('[data-provider-kind=internal]').dataset.cooperationBasis==='INT-BJ-FJ-2026-007' && document.querySelector('[data-provider-kind=internal]').dataset.saleStatus==='入库审核中'");
await reset();await run(open);await run("document.querySelector('#agencyConfirmModal [data-close-modal]').click();document.querySelector('.market-product-card[data-product=北海道深度8日游]').click();document.querySelector('#marketDetailAgencyButton').click()");
await check('切换外部产品清空共享条件，恢复协议及销售范围',"document.querySelector('#agencyInternalBasis').hidden && !document.querySelector('#agencyAgreementField').hidden && document.querySelector('#agencyInternalConditions').innerHTML==='' && !document.querySelector('#agencySaleRange').disabled");
await run("document.querySelector('#agencyCompanyAgreement').value='AGR-GL-FJ-013';document.querySelector('#submitAgencyReview').click()");
await check('外部原协议仍可提交',"document.querySelector('.market-product-card[data-product=北海道深度8日游]').dataset.saleStatus==='入库审核中'");
await reset();await run("document.querySelector('[data-provider-kind=internal]').dataset.internalCompany='上海凯撒'");await run(open);await run("document.querySelector('#submitAgencyReview').click()");
await check('无共享授权不能提交',"document.querySelector('[data-provider-kind=internal]').dataset.saleStatus==='可代理'");
await run("document.querySelector('#saveAgencyDraft').click()");await check('无授权可存草稿但不伪造依据',"document.querySelector('[data-provider-kind=internal]').dataset.saleStatus==='入库草稿' && document.querySelector('[data-provider-kind=internal]').dataset.cooperationBasis===''");
await reset();await run("document.querySelector('[data-provider-kind=internal]').dataset.internalValidTo='2026-01-01'");await run(open);await run("document.querySelector('#submitAgencyReview').click()");
await check('失效合作阻止提交',"document.querySelector('[data-provider-kind=internal]').dataset.saleStatus==='可代理' && document.querySelector('#agencyInternalText').innerText.includes('已失效')");
await reset();await run("document.querySelector('[data-provider-kind=internal]').dataset.supplier='福建凯撒'");await run(open);
await check('本公司产品不显示内部关系且不能重复入库',"document.querySelector('#agencyInternalBasis').hidden && !document.querySelector('#agencyOwnProductHint').hidden && document.querySelector('#submitAgencyReview').disabled && document.querySelector('#saveAgencyDraft').disabled");
await reset();await run("Object.assign(document.querySelector('[data-provider-kind=internal]').dataset,{supplier:'福建凯撒',internalCompany:'北京凯撒',fulfillmentCompany:'福建凯撒',businessCompany:'北京凯撒',internalReference:'INT-FJ-BJ-DEMO'});document.querySelector('#agencyBusinessCompany').innerHTML='<option>北京凯撒</option>'");await run(open);await run("document.querySelector('#submitAgencyReview').click()");
await check('反向样例按实际关系提交',"document.querySelector('[data-provider-kind=internal]').dataset.cooperationBasis==='INT-FJ-BJ-DEMO'");
await reset();await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await run(open);await run("document.querySelector('#agencyInternalBasis').scrollIntoView({block:'center'})");await pause(400);
await check('窄屏共享条件不溢出',"(()=>{const r=document.querySelector('#agencyInternalConditions').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})()");
shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/market-intercompany-narrow.png',Buffer.from(shot.data,'base64'));
assert.deepEqual(errors,[]);console.log('PASS 无页面脚本错误');console.log('通过 '+(n+1)+' 项浏览器检查');
}finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
