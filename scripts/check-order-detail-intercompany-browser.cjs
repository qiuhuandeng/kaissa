// 对独立调试浏览器运行；默认端口9240，可用 DETAIL_QA_PORT 修改。无第三方依赖。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const tabs=await (await fetch('http://127.0.0.1:'+(process.env.DETAIL_QA_PORT||9240)+'/json/list')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab,'需要独立验收浏览器页面');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0,n=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,expr)=>{assert.ok(await run(expr),name);console.log('PASS '+name);n++;};

const baseUrl=pathToFileURL(path.resolve(__dirname,'../merchant/sales/orders-detail.html')).href;
const baselineFile='/private/tmp/order-detail-p04-before.json';
const reset=async(query='')=>{await send('Page.navigate',{url:baseUrl+query});for(let i=0;i<80;i++){await pause(100);if(await run("document.readyState==='complete' && !!document.querySelector('#overviewProductGrid .description-item')")){await pause(250);return;}}throw Error('详情未就绪 '+JSON.stringify(errors));};
const snapshot=()=>run("(()=>{const m=document.querySelector('main.order-detail-page').cloneNode(true);m.querySelector('#intercompanySection')?.remove();return m.innerHTML})()");
const click=s=>run('document.querySelector('+JSON.stringify(s)+').click()');
const shoot=async name=>{await pause(450);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/'+name,Buffer.from(r.data,'base64'));};
try{
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
if(process.argv.includes('--capture-baseline')){let baseline={};for(const type of ['group','cruise','free','single']){await reset('?type='+type);baseline[type]=await snapshot();}fs.writeFileSync(baselineFile,JSON.stringify(baseline));console.log('已记录四类普通详情完整基线');ws.close();process.exit(0);}

const norm=s=>s.replace(/>\s+</g,'><').trim();
if(process.argv.includes('--compare-baseline')){const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));for(const type of ['group','cruise','free','single']){await reset('?type='+type);const actual=norm(await snapshot()),expected=norm(await run('(()=>{const d=new DOMParser().parseFromString('+JSON.stringify(baseline[type])+',"text/html");return (d.querySelector("main.order-detail-page")||d.body).innerHTML})()'));if(actual!==expected){let i=0;while(actual[i]===expected[i])i++;throw Error(type+' 基线首处差异 '+i+' actual='+actual.slice(Math.max(0,i-120),i+220)+' expected='+expected.slice(Math.max(0,i-120),i+220));}console.log('PASS '+type+' 普通订单完整内容与改动前一致');n++;}}
for(const query of ['?type=group','?type=cruise','?type=free','?type=single','?orderNo=WC20260926001','?orderNo=UNKNOWN&salesCompany=福建凯撒&productCompany=北京凯撒']){
 await reset(query);await check('无跨主体关系不出现区域 '+query,"document.querySelector('#intercompanySection').hidden && getComputedStyle(document.querySelector('#intercompanySection')).display==='none' && document.querySelector('#intercompanyRelationGrid').children.length===0");
}
const relation="document.querySelector('#intercompanyRelationGrid').textContent";
const field=(label,expected,grid='intercompanyRelationGrid')=>`Array.from(document.querySelectorAll('#${grid} .description-item')).some(x=>x.querySelector('.description-label').textContent===${JSON.stringify(label)} && x.querySelector('.description-value').textContent===${JSON.stringify(expected)})`;
await reset('?orderNo=KSIC260901');
await check('福建销售北京产品：产品、金额、确认状态与列表一致',"!document.querySelector('#intercompanySection').hidden && document.querySelector('#orderProductName').textContent==='西藏深度探索7日' && document.querySelector('#orderHeroTotal').textContent.includes('11,360') && document.querySelector('#orderStatusText').textContent==='已确认' && document.querySelector('#paymentStatusText').textContent==='未收款' && document.querySelector('#overviewBookingGrid').textContent.includes('2')");
await check('正向五方责任按订单展示',field('销售方','福建凯撒旅游有限公司')+' && '+field('产品方','北京凯撒旅游有限公司')+' && '+field('履约方','北京凯撒旅游有限公司')+' && '+field('签约方','福建凯撒旅游有限公司')+' && '+field('收款方','福建凯撒旅游有限公司'));
await check('福建节点显示本单销售签约收款角色及北京交易对手',field('当前节点在本单中的角色','销售方、签约方、收款方')+' && '+field('交易对手','北京凯撒旅游有限公司')+' && '+field('内部结算状态','待结算'));
await check('财务承接同步本单责任，没有无内部结算冲突',"document.querySelector('#financeResponsibilityRows').textContent.includes('北京凯撒旅游有限公司') && !document.querySelector('#financeInternalRows').textContent.includes('无跨法人') && document.querySelector('#financeInternalRows').textContent.includes('KSIC260901')");
await shoot('order-detail-intercompany-desktop.png');
await click('#openIntercompanyReconciliation');await pause(700);
await check('公司间对账入口进入财务新页并限定本单',"location.pathname.endsWith('finance-intercompany-reconciliation.html') && location.search.includes('KSIC260901') && document.querySelector('#icOrderScope').textContent.includes('尚无对账单')");
await reset('?orderNo=KSIC260901');
await click('.workspace-scope-badge');await pause(100);await click('.org-tree-select[title="产品中心"]');
await check('真实右上角切换部门刷新当前节点但不改变订单公司角色',relation+".includes('产品中心') && "+field('当前节点在本单中的角色','销售方、签约方、收款方'));
const node=async(company,department='销售中心')=>run(`window.caesarCompanyContext=()=>({company:${JSON.stringify(company)},department:${JSON.stringify(department)}});window.dispatchEvent(new CustomEvent('caesar-company-change'));`);
await node('北京凯撒');
await check('同单北京节点显示产品履约角色，交易对手反转',field('当前节点在本单中的角色','产品方、履约方')+' && '+field('交易对手','福建凯撒旅游有限公司'));
await node('上海其他公司');await pause(450);
await check('不参与公司节点无本单角色并禁用财务入口',field('当前节点在本单中的角色','本单无参与角色')+" && document.querySelector('#openIntercompanyReconciliation').disabled");
await node('福建凯撒旅游有限公司');
await check('完整公司名称可识别并开放财务入口',field('交易对手','北京凯撒旅游有限公司')+" && !document.querySelector('#openIntercompanyReconciliation').disabled");
await reset('?orderNo=KSIC260902');
await check('反向订单：福建节点为产品履约方而非固定销售方',field('销售方','北京凯撒旅游有限公司')+' && '+field('产品方','福建凯撒旅游有限公司')+' && '+field('当前节点在本单中的角色','产品方、履约方')+' && '+field('签约方','北京凯撒旅游有限公司')+' && '+field('收款方','北京凯撒旅游有限公司'));
await check('二次确认保持待确认，不虚构应收及资源占用',"document.querySelector('#orderStatusText').textContent==='待确认' && document.querySelector('#receivableRows').textContent.includes('应收未生成') && document.querySelector('#overviewBookingGrid').textContent.includes('尚未占用名额') && "+field('内部结算状态','未形成结算（资源待确认）'));
await check('跨主体新样例无旧欧洲游客、航班和收款历史',"!document.querySelector('#travelerTableRows').textContent.trim() && !document.querySelector('#logList').textContent.includes('2026-07-04') && document.querySelector('#receiptRows').textContent.includes('暂无收款')");
await node('北京凯撒');
await check('反向订单北京节点为销售签约收款方',field('当前节点在本单中的角色','销售方、签约方、收款方')+' && '+field('交易对手','福建凯撒旅游有限公司'));
await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await pause(500);
await run("document.querySelector('#intercompanySection').scrollIntoView({block:'center'})");
await check('1024宽窗口关系字段和入口不超出可视区',"Array.from(document.querySelectorAll('#intercompanySection .description-item,#openIntercompanyReconciliation')).every(x=>{const r=x.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})");await shoot('order-detail-intercompany-narrow.png');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:baseUrl.replace('orders-detail.html','orders.html')});await pause(700);
await click('[data-order-no="KSIC260901"] a[href*="orders-detail.html"]');await pause(700);
await check('列表原详情入口可到对应跨主体详情',"location.search.includes('KSIC260901') && document.querySelector('#intercompanySection') && !document.querySelector('#intercompanySection').hidden && document.querySelector('#orderProductName').textContent==='西藏深度探索7日'");
assert.deepEqual(errors,[],'浏览器无未捕获脚本异常');console.log('PASS 浏览器无未捕获脚本异常');n++;
console.log('完成 '+n+' 项浏览器检查');

}finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
