// 对独立调试浏览器运行；默认端口9239，可用 ORDERS_QA_PORT 修改。无第三方依赖。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const tabs=await (await fetch('http://127.0.0.1:'+(process.env.ORDERS_QA_PORT||9239)+'/json/list')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab,'需要独立验收浏览器页面');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0,n=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,expr)=>{assert.ok(await run(expr),name);console.log('PASS '+name);n++;};
const baseUrl=pathToFileURL(path.resolve(__dirname,'../merchant/sales/orders.html')).href;
const baselineFile='/private/tmp/orders-p03-before.json';
const reset=async()=>{await send('Page.navigate',{url:baseUrl});for(let i=0;i<80;i++){await pause(100);if(await run("document.readyState==='complete' && !!document.querySelector('.orders-normalized-row')")){await pause(300);return;}}throw Error('页面未就绪');};
const snapshot=()=>run("Array.from(document.querySelectorAll('#orderRows tr[data-product-type]')).map(r=>({no:r.dataset.orderNo,cells:Array.from(r.children).slice(1).map(c=>c.innerHTML)}))");
const click=s=>run('document.querySelector('+JSON.stringify(s)+').click()');
const set=async(s,v)=>{await run(`document.querySelector(${JSON.stringify(s)}).value=${JSON.stringify(v)};document.querySelector(${JSON.stringify(s)}).dispatchEvent(new Event('change',{bubbles:true}))`);await click('#searchOrders');await pause(150);};
const visible="Array.from(document.querySelectorAll('#orderRows tr[data-product-type]')).filter(r=>!r.hidden)";
const shoot=async name=>{await pause(350);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/'+name,Buffer.from(r.data,'base64'));};
try{
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await reset();
if(process.argv.includes('--capture-baseline')){fs.writeFileSync(baselineFile,JSON.stringify(await snapshot(),null,2));console.log('已记录改动前15行的字段、链接、操作及顺序');ws.close();process.exit(0);}
if(process.argv.includes('--compare-baseline')){const original=JSON.parse(fs.readFileSync(baselineFile,'utf8'));const ids=new Set(original.map(x=>x.no));assert.deepEqual((await snapshot()).filter(x=>ids.has(x.no)),original);console.log('PASS 原15行全部字段、顺序、链接及操作与改动前一致');n++;}
await check('保留七个业务列及原产品来源',"document.querySelectorAll('.orders-table-wrap thead th').length===8 && document.querySelector('#productSource').options.length===4");
await check('默认显示原订单及独立样例，不默认启用跨主体筛选',visible+".length===18 && document.querySelector('#orderSourceType').value==='' && !document.querySelector('#onlyIntercompany').checked");
await set('#orderSourceType','internal');
await check('来源筛选仅显示两条跨主体且快捷条件同步',visible+".length===2 && "+visible+".every(r=>r.dataset.orderSourceType==='internal') && document.querySelector('#onlyIntercompany').checked && document.querySelector('.pagination > span').textContent==='共2条筛选结果' && getComputedStyle(document.querySelector('.pagination .pager')).display==='none'");
await check('双方产品角色互换均按实际提供公司提示，无新增标签',"(()=>{const rows="+visible+";return rows[0].querySelector('.orders-source-hint').textContent.includes('北京凯撒') && rows[1].querySelector('.orders-source-hint').textContent.includes('福建凯撒') && rows.every(r=>r.querySelector('.orders-source-cell').children.length===3 && !r.querySelector('.orders-source-hint .tag'))})()");
await shoot('orders-intercompany-desktop.png');
await click('[data-filter-value="待确认"]');await pause(200);
await check('状态Tab与来源条件组合，不放出自营订单',visible+".length===1 && "+visible+"[0].dataset.orderStatus==='待确认' && "+visible+"[0].dataset.orderSourceType==='internal'");
await click('#resetOrders');await click('#onlyIntercompany');await click('#searchOrders');await pause(150);
await check('快捷条件可独立启用并同步来源选择',visible+".length===2 && document.querySelector('#orderSourceType').value==='internal'");
await click('#onlyIntercompany');await click('#searchOrders');await pause(150);
await check('取消快捷条件恢复全部来源',visible+".length===18 && document.querySelector('#orderSourceType').value===''");
await set('#orderSourceType','external');
await check('体系外外采独立筛选，不显示跨主体提示',visible+".length===1 && "+visible+"[0].dataset.orderSourceType==='external' && !"+visible+"[0].querySelector('.orders-source-hint') && !document.querySelector('#onlyIntercompany').checked");
await set('#orderSourceType','self');
await check('自营只保留原15条且无额外标签或关系提示',visible+".length===15 && "+visible+".every(r=>!r.querySelector('.orders-source-hint'))");
await set('#productSource','单项服务下单');
await check('原产品来源可与新增来源类型组合',visible+".length===1 && "+visible+"[0].dataset.productSource==='单项服务下单'");
await click('#resetOrders');await set('#orderSourceType','internal');await set('#channelSource','门店');
await check('渠道组合仍有效',visible+".length===1 && "+visible+"[0].dataset.store==='软件园门店'");
await set('#paymentStatus','已收款');
await check('无匹配结果不会回退全部订单',visible+".length===0");
await click('#resetOrders');await set('#orderSourceType','internal');await run("document.querySelector('#quickSearch').value='福建闽南'");await click('#searchOrders');await pause(150);
await check('关键词与跨主体条件组合',visible+".length===1 && "+visible+"[0].dataset.productName==='福建闽南文化5日'");
await click('#resetOrders');await set('#orderSourceType','internal');await set('#dateType','travel');await set('#dateStart','2026-10-20');await set('#dateEnd','2026-10-25');
await check('出行日期与来源条件组合',visible+".length===1 && "+visible+"[0].dataset.travelDate==='2026-10-22'");
await click('#resetOrders');await set('#orderSourceType','internal');
await check('跨主体使用原订单动作且无公司间对账或供货确认',visible+".every(r=>{const c=r.querySelector('.orders-action-cell');return c.textContent.includes('详情') && !/公司间对账|供货确认/.test(c.textContent)})");
await click('[data-order-no="KSIC260902"] [data-row-more]');await pause(100);
await check('待确认订单仍有原转确认入口',"!!document.querySelector('[data-order-no=KSIC260902] [data-order-quick-action=转确认]') || Array.from(document.querySelectorAll('.action-dropdown-menu.show button')).some(x=>x.textContent==='转确认')");
await click('#resetOrders');await pause(150);
await check('重置同时清除来源、快捷条件及组合条件',visible+".length===18 && !document.querySelector('#onlyIntercompany').checked && document.querySelector('#orderSourceType').value==='' && document.querySelector('.pagination > span').textContent==='第1-10条/共247条'");
await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,screenWidth:1024,screenHeight:900,deviceScaleFactor:1,mobile:false});await pause(500);await set('#orderSourceType','internal');
await run("document.querySelector('#orderSourceType').scrollIntoView({block:'center'})");
await check('窄屏来源筛选与快捷条件可达',"['#orderSourceType','#onlyIntercompany'].every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})");await shoot('orders-intercompany-narrow-filter.png');
await run("document.querySelector('.orders-table-wrap').scrollIntoView({block:'start'});document.querySelector('.orders-table-wrap').scrollLeft=9999");await pause(150);
await check('窄屏表格内横向滚动，操作列固定可达',"(()=>{const w=document.querySelector('.orders-table-wrap'),c=Array.from(document.querySelectorAll('#orderRows tr[data-product-type]')).find(r=>!r.hidden).querySelector('.orders-action-cell'),r=c.getBoundingClientRect();return w.scrollWidth>w.clientWidth && getComputedStyle(c).position==='sticky' && r.right<=innerWidth+1})()");await shoot('orders-intercompany-narrow-table.png');
assert.deepEqual(errors,[]);console.log('PASS 无页面脚本异常');console.log('通过 '+(n+1)+' 项浏览器检查');
}finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
