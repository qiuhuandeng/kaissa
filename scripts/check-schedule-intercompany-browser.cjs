// 对独立调试浏览器运行；默认端口9241，可用 SCHEDULE_QA_PORT 修改。无第三方依赖。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const tabs=await (await fetch('http://127.0.0.1:'+(process.env.SCHEDULE_QA_PORT||9241)+'/json/list')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab,'需要独立验收浏览器页面');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0,n=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,expr)=>{assert.ok(await run(expr),name);console.log('PASS '+name);n++;};


const root=pathToFileURL(path.resolve(__dirname,'../merchant/tour/')).href+'/';
const navigate=async(page)=>{await send('Page.navigate',{url:root+page});for(let i=0;i<80;i++){await pause(100);if(await run("document.readyState==='complete' && !!document.querySelector('#orderRows .orders-normalized-row,#overviewProductGrid .description-item,#icFulfillment')")){await pause(250);return;}}throw Error('页面未就绪');};
const listSnapshot=()=>run("Array.from(document.querySelectorAll('#orderRows tr:not([data-intercompany])')).map(r=>r.outerHTML)");
const detailSnapshot=()=>run("document.querySelector('main.order-detail-page').innerHTML");
const baselineFile='/private/tmp/schedule-p05-before.json';
const click=s=>run('document.querySelector('+JSON.stringify(s)+').click()');
const shoot=async name=>{await pause(450);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/'+name,Buffer.from(r.data,'base64'));};
try{
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
if(process.argv.includes('--capture-baseline')){let base={};await navigate('schedule-orders.html');base.list=await listSnapshot();for(const type of ['group','cruise','free','single']){await navigate('schedule-orders-detail.html?type='+type);base[type]=await detailSnapshot();}fs.writeFileSync(baselineFile,JSON.stringify(base));console.log('已记录原列表及四类详情基线');ws.close();process.exit(0);}

if(process.argv.includes('--compare-baseline')){
 const base=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
 await navigate('schedule-orders.html');assert.deepEqual(await listSnapshot(),base.list);n++;console.log('PASS 普通列表全部行字段顺序及操作与改动前一致');
 for(const type of ['group','cruise','free','single']){await navigate('schedule-orders-detail.html?type='+type);assert.equal(await detailSnapshot(),base[type]);n++;console.log('PASS '+type+'普通详情与改动前逐项一致');}
}
await navigate('schedule-orders.html');
const cross="Array.from(document.querySelectorAll('#orderRows [data-intercompany]'))";
await check('跨主体追加两条，未增加主列表列',cross+".length===2 && document.querySelector('.orders-table-wrap thead tr').children.length===8");
await check('跨主体行显示实际销售公司和关联销售订单',cross+"[0].textContent.includes('销售公司：福建凯撒旅游有限公司') && "+cross+"[1].textContent.includes('销售公司：北京凯撒旅游有限公司') && "+cross+".every(r=>r.textContent.includes('关联销售订单'))");
await check('金额与办理提示分行，关键短值完整',cross+".every(r=>getComputedStyle(r.querySelector('.orders-amount-cell > span')).display==='block' && r.querySelector('.orders-amount-cell strong').scrollWidth<=r.querySelector('.orders-amount-cell strong').clientWidth+1)");
await check('跨主体行只有详情，金额无改价入口且不进入批量业务操作',cross+".every(r=>r.querySelector('.orders-action-cell').textContent.trim()==='详情' && !r.querySelector('[data-open-receivable-drawer]') && r.querySelector('input').disabled)");
await click('#checkAllOrders');
await check('全选不能选中跨主体行',cross+".every(r=>!r.querySelector('input').checked)");
await run("document.querySelector('#quickSearch').value='KSIC260902'");await click('#searchOrders');
await check('原搜索可找到跨主体订单',"Array.from(document.querySelectorAll('#orderRows tr')).filter(r=>!r.hidden).length===1 && !document.querySelector('[data-order-no=KSIC260902]').hidden");
await click('#resetOrders');
const node=async(company)=>{await run(`window.caesarCompanyContext=()=>({company:${JSON.stringify(company)},department:'产品中心'});window.dispatchEvent(new CustomEvent('caesar-company-change'));`);await pause(450);};
await node('上海其他公司');
await check('无关节点不显示跨主体样例',cross+".every(r=>r.hidden)");
await click('[data-filter-value="全部"]');await pause(150);
await check('状态筛选不能放出无关公司的跨主体样例',cross+".every(r=>r.hidden)");
await node('福建凯撒');
await click('[data-order-no="KSIC260902"] .orders-action-cell a');await pause(700);
await check('列表详情入口到正确团期订单，福建承接北京销售',"!!document.querySelector('#icFulfillment') && document.querySelector('#orderNo').textContent==='KSIC260902' && document.querySelector('#icFulfillment').textContent.includes('来源销售公司北京凯撒旅游有限公司')");
await shoot('schedule-intercompany-detail.png');
const tab=async(name)=>{await click('[data-ic-tab="'+name+'"]');await pause(80);};
const edit=async(name)=>{await click('[data-ic-edit="'+name+'"]');await pause(150);};
const set=async(name,value)=>run(`(()=>{const e=document.querySelector('#icWorkForm [name=${JSON.stringify(name)}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const save=async()=>{await click('#icWorkSave');await pause(450);};
await check('履约公司只读他方成交价，不提供收款应收及合同办理',"!document.querySelector('#receiptDrawer,#receivableDrawer,[data-contract-entry]') && document.querySelector('#icFulfillment').textContent.includes('¥11,360') && !document.querySelector('a[href*=sales]')");
await tab('execution');await edit('execution');await set('execution','已完成');await set('actualDate','2026-10-26');await set('result','本单服务全部完成');await save();
await check('资源及名单未齐不能登记完成',"document.querySelector('#icWorkError').textContent.includes('确认资源') && document.querySelector('#icExecutionStatus').textContent==='待资源确认'");
await node('福建凯撒');
await tab('resources');await edit('resources');await set('resource','已确认');await save();
await check('缺确认依据不能保存资源结果',"document.querySelector('#icWorkDrawer').getAttribute('aria-hidden')==='false' && document.querySelector('[data-ic-panel=resources]').textContent.includes('0人')");
await set('resource','无位');await set('reference','所选房型满位，等待销售核对替代安排');await save();
await check('履约方可反馈无位，名额不占用且客户订单状态不擅自变更',"document.querySelector('#icExecutionStatus').textContent==='资源无位' && document.querySelector('[data-ic-panel=resources]').textContent.includes('0人') && document.querySelector('#icFulfillment').textContent.includes('关联订单状态待确认')");
await edit('resources');await set('resource','已确认');await set('reference','地接确认函 FJ-MN-20261022，双床房1间、交通2席');await save();
await check('履约确认承接2人资源，不改对客金额或订单主状态',"document.querySelector('#icExecutionStatus').textContent==='待出行' && document.querySelector('[data-ic-panel=resources]').textContent.includes('2人') && document.querySelector('#icFulfillment').textContent.includes('¥11,360') && document.querySelector('#icFulfillment').textContent.includes('关联订单状态待确认')");
await tab('travelers');await edit('travelers');await set('checked0','已核验');await set('checked1','已核验');await set('arrangement0','双床房，同车出行');await set('arrangement1','双床房，同车出行');await save();
await check('实际履约方可维护名单及出行安排',"document.querySelector('[data-ic-panel=travelers]').textContent.includes('双床房，同车出行') && document.querySelector('[data-ic-panel=overview]').textContent.includes('2/2人')");
await tab('supplements');await edit('supplements');await set('item','酒店加住');await set('amount','600');await set('basis','地接加住报价确认函，1间1晚');await save();
await check('补差只形成待销售确认依据，成交价不变',"document.querySelector('[data-ic-panel=supplements]').textContent.includes('¥600.00') && document.querySelector('[data-ic-panel=supplements]').textContent.includes('待销售方确认') && document.querySelector('#icFulfillment').textContent.includes('¥11,360')");
await edit('supplements');await set('item','酒店加住');await set('amount','600');await set('basis','地接加住报价确认函，1间1晚');await save();
await check('同一补差依据不可重复提交',"document.querySelector('#icWorkError').textContent.includes('请勿重复提交')");
await node('北京凯撒');
await check('切到销售方时关闭未提交表单，并收起全部履约操作',"document.querySelector('#icWorkDrawer').getAttribute('aria-hidden')==='true' && !document.querySelector('[data-ic-edit]') && document.querySelector('a[href*=sales]').href.includes('KSIC260902')");
await check('销售方能查看已确认履约结果和补差，不能修改',"document.querySelector('[data-ic-panel=resources]').textContent.includes('地接确认函') && document.querySelector('[data-ic-panel=supplements]').textContent.includes('待销售方确认') && document.querySelector('#icWorkForm').children.length===0");
await run("document.querySelector('#icFulfillment').insertAdjacentHTML('beforeend','<button id=forcedEdit data-ic-edit=resources>强制入口</button>')");await click('#forcedEdit');
await check('重新检查办理公司，不能用旧入口打开资源表单',"document.querySelector('#icWorkDrawer').getAttribute('aria-hidden')==='true'");
await node('上海其他公司');
await check('无关公司直接详情不暴露订单资料或办理入口',"document.querySelector('#icFulfillment').textContent.includes('无履约或销售关系') && !document.querySelector('#orderNo,[data-ic-edit]')");
await node('福建凯撒旅游有限公司');await tab('execution');await edit('execution');await set('execution','已完成');await set('actualDate','2026-10-26');await set('result','资源与名单核对完成，服务全部完成');await save();
await check('资源已确认不等于客户订单已确认，待确认订单不能登记履约完成',"document.querySelector('#icWorkError').textContent.includes('销售订单尚未确认') && document.querySelector('#icExecutionStatus').textContent==='待出行'");
await navigate('schedule-orders-detail.html?orderNo=KSIC260901');
await check('福建销售北京产品：福建只能查看北京履约',"!document.querySelector('[data-ic-edit]') && document.querySelector('#icFulfillment').textContent.includes('实际履约公司北京凯撒旅游有限公司') && document.querySelector('#icExecutionStatus').textContent==='待出行'");
await node('北京凯撒');await tab('resources');
await check('反向切到北京履约公司有资源入口，实时可售不再强制二次确认',"!!document.querySelector('[data-ic-edit=resources]') && document.querySelector('[data-ic-panel=resources]').textContent.includes('团期实时可售')");
await edit('resources');await set('reference','未提交的修改');await node('福建凯撒');await click('#icWorkSave');
await check('切换销售公司后旧保存事件不能提交履约修改',"document.querySelector('[data-ic-panel=resources]').textContent.includes('团期实时可售') && !document.querySelector('[data-ic-panel=resources]').textContent.includes('未提交的修改')");
await node('北京凯撒');await tab('travelers');await edit('travelers');await set('checked0','已核验');await set('checked1','已核验');await save();
await tab('execution');await edit('execution');await set('execution','已完成');await set('actualDate','2026-10-21');await set('result','本单旅游服务全部完成');await save();
await check('已确认订单由履约方登记完成，保留结果并关闭重复办理',"document.querySelector('#icExecutionStatus').textContent==='已完成' && document.querySelector('[data-ic-panel=execution]').textContent.includes('旅游服务全部完成') && !document.querySelector('[data-ic-edit]')");
await navigate('schedule-orders-detail.html?orderNo=KSIC260901');
await click('.workspace-scope-badge');await click('.org-tree-select[title="产品中心"]');
await check('原右上角部门切换保持当前公司的本单边界',"!document.querySelector('[data-ic-edit]')");
await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await pause(500);await tab('overview');
await check('1024窗口跨主体来源信息未撑破页面',"Array.from(document.querySelectorAll('#icFulfillment .description-item')).every(x=>{const r=x.getBoundingClientRect();return r.right<=innerWidth+1 && r.left>=0})");await shoot('schedule-intercompany-narrow.png');
await node('北京凯撒');await tab('supplements');await edit('supplements');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(500);
await check('390宽处理抽屉控件与提交可达',"(()=>{const d=document.querySelector('#icWorkDrawer .modal'),b=document.querySelector('#icWorkSave');return d.scrollWidth<=d.clientWidth+1 && b.getBoundingClientRect().right<=innerWidth+1})()");await shoot('schedule-intercompany-drawer-narrow.png');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await navigate('schedule-orders.html');await run("document.querySelector('#quickSearch').value='集团内跨主体'");await click('#searchOrders');await pause(150);await shoot('schedule-intercompany-list.png');
await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await pause(500);
await run("document.querySelector('.orders-table-wrap').scrollLeft=10000");
await check('窄窗口操作列固定可达且跨主体无金额编辑入口',"Array.from(document.querySelectorAll('[data-intercompany] .orders-action-cell a')).every(x=>{const r=x.getBoundingClientRect();return r.right<=innerWidth+1 && r.left>=0}) && !document.querySelector('[data-intercompany] [data-open-receivable-drawer]')");await shoot('schedule-intercompany-list-narrow.png');
await navigate('schedule-orders-detail.html?type=group&orderNo=UNKNOWN&salesCompany=北京凯撒');
await check('未知普通订单不因网址公司名进入跨主体分支',"!document.querySelector('#icFulfillment') && !!document.querySelector('#overviewProductGrid')");
assert.deepEqual(errors,[],'无浏览器异常');n++;console.log('PASS 无浏览器脚本异常');console.log('完成 '+n+' 项浏览器检查');

}finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
