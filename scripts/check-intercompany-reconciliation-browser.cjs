// 对独立调试浏览器运行；默认端口9242，可用 INTERCOMPANY_QA_PORT 修改。无第三方依赖。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const tabs=await (await fetch('http://127.0.0.1:'+(process.env.INTERCOMPANY_QA_PORT||9242)+'/json/list')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab,'需要独立验收浏览器页面');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0,n=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,expr)=>{assert.ok(await run(expr),name);console.log('PASS '+name);n++;};


const root=pathToFileURL(path.resolve(__dirname,'../merchant/')).href+'/';
const navigate=async(page)=>{await send('Page.navigate',{url:root+page});for(let i=0;i<80;i++){await pause(100);if(await run("document.readyState==='complete' && (!!document.querySelector('#icRows tr') || !!document.querySelector('#overviewProductGrid .description-item'))")){await pause(300);return;}}throw Error('页面未就绪');};
const click=async s=>{await run('document.querySelector('+JSON.stringify(s)+').click()');await pause(100);};
const set=async(s,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const node=async(company)=>{await run(`window.caesarCompanyContext=()=>({company:${JSON.stringify(company)},department:'财务部'});window.dispatchEvent(new CustomEvent('caesar-company-change'));`);await pause(450);};
const shoot=async name=>{await pause(450);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/'+name,Buffer.from(r.data,'base64'));};
const close=async()=>{await click('[data-ic-action=close]');await pause(450);};
const openRecord=async id=>{await click('[data-ic-record="'+id+'"]');await pause(400);};
const normalize=s=>s.replace(/>\s+</g,'><').trim();
try {
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 if(process.argv.includes('--compare-baseline')) {
  const base=JSON.parse(fs.readFileSync('/private/tmp/order-detail-p11-before.json','utf8'));
  for(const type of ['group','cruise','free','single']) {
   await navigate('sales/orders-detail.html?type='+type);
   assert.equal(normalize(await run("(()=>{const m=document.querySelector('main.order-detail-page').cloneNode(true);m.querySelector('#intercompanySection')?.remove();return m.innerHTML})()")),normalize(base[type]));
   n++;console.log('PASS '+type+' 普通详情完整业务内容与本次改动前一致');
  }
 }
 await navigate('finance/finance-intercompany-reconciliation.html');
 await check('集团对账独立菜单可达，门店和业务结算入口保留',"!!document.querySelector('a[href$=\"finance-intercompany-reconciliation.html\"]') && !!document.querySelector('a[href$=\"finance-store-reconciliation.html\"]') && !!document.querySelector('a[href$=\"finance-settlement.html\"]')");
 await check('默认公司与右上角同源，只展示本公司四条实际结算关系',"document.querySelector('#icCompany').textContent==='福建凯撒旅游有限公司' && document.querySelectorAll('#icRows [data-record]').length===4 && document.querySelector('#icRows').textContent.includes('我方采购') && document.querySelector('#icRows').textContent.includes('我方供货')");
 await check('代收与佣金分别列示，未抵销未付金额',"document.querySelector('[data-record=ICDZ20260927003]').textContent.includes('未付 ¥4,000.00') && document.querySelector('[data-record=ICDZ20260927004]').textContent.includes('未收 ¥800.00')");
 await check('桌面首屏可见主状态和操作列',"(()=>{const cell=document.querySelector('#icRows [data-record] td:nth-child(7)'),action=document.querySelector('#icRows [data-record] td:last-child');return cell.getBoundingClientRect().right<=action.getBoundingClientRect().left+1})()");
 await shoot('intercompany-reconciliation-list.png');
 if(process.argv.includes('--preview')) { ws.close();process.exit(0); }
 await set('#icKind','commission');await click('#icSearch');
 await check('关系筛选只保留佣金订单',"document.querySelectorAll('#icRows [data-record]').length===1 && document.querySelector('#icRows').textContent.includes('佣金应收')");
 await click('#icReset');await set('#icKeyword','KSIC260803');await click('#icSearch');
 await check('关联订单搜索保留该单两种独立关系',"document.querySelectorAll('#icRows [data-record]').length===2");await click('#icReset');
 await openRecord('ICDZ20260927001');
 await check('差异单展示增减依据和双方金额，阻断确认',"document.querySelector('#icDrawerContent').textContent.includes('原结算金额') && document.querySelector('#icDrawerContent').textContent.includes('接送服务增加200元') && document.querySelector('#icDrawerContent').textContent.includes('¥-200.00') && document.querySelector('[data-ic-action=confirm]').disabled");
 await shoot('intercompany-reconciliation-difference.png');
 await set('#icClaim','8200');await click('[data-ic-action=save]');
 await check('金额修改缺原因不得保存',"!document.querySelector('#icError').hidden && document.querySelector('#icError').textContent.includes('原因')");
 await set('#icReason','补齐增补确认单，核对增加200元');await click('[data-ic-action=save]');
 await check('修正只改我方核对金额，旧值和处理原因保留',"document.querySelector('#icDrawerContent').textContent.includes('第2次核对') && document.querySelector('#icDrawerContent').textContent.includes('原核对金额 8000.00') && document.querySelector('#icDrawerContent').textContent.includes('补齐增补确认单') && !document.querySelector('[data-ic-action=confirm]').disabled");
 await click('[data-ic-action=confirm]');await close();
 await check('单方确认不能把账单标为已对账',"document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('待双方确认') && document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('我方：已确认') && document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('对方：未确认')");
 await node('北京凯撒');await openRecord('ICDZ20260927001');await click('[data-ic-action=confirm]');await close();
 await check('对方按同次金额确认后已对账，未收6200余款仍保留',"document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('已对账') && document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('未收 ¥6,200.00') && document.querySelector('[data-record=ICDZ20260927001] [data-ic-record]').textContent==='详情'");
 await openRecord('ICDZ20260927001');
 await check('已对账只读，没有付款或改金额按钮',"!document.querySelector('#icClaim,[data-ic-action=confirm],[data-ic-action=save]') && document.querySelector('#icDrawerContent').textContent.includes('未收／未付已经结清')");await close();
 await node('福建凯撒');await openRecord('ICDZ20260927002');await set('#icClaim','12000');await set('#icReason','复核减项');await click('[data-ic-action=save]');
 await check('金额改变后双方确认清空，历史对方确认留存',"document.querySelectorAll('.ic-rec-parties .ic-rec-fact').length===8 && Array.from(document.querySelectorAll('.ic-rec-parties .ic-rec-value')).filter(x=>x.textContent==='未确认').length===2 && document.querySelector('.ic-rec-history details').textContent.includes('北京凯撒旅游有限公司：¥12,200.00，已确认')");
 await set('#icClaim','12200');await run('window.confirm=()=>false');await click('[data-ic-close]');
 await check('未保存修改关闭可取消',"!document.querySelector('#icRecDrawer').hidden && document.querySelector('#icClaim').value==='12200'");
 await run('window.confirm=()=>true');await click('[data-ic-close]');await pause(450);
 await check('确认放弃后关闭抽屉',"document.querySelector('#icRecDrawer').hidden");
 await click('#icCreate');
 await check('发起只可选择未建立且依据明确的结算关系',"document.querySelector('[name=icSource][value=purchase-901]').disabled===false && document.querySelector('[name=icSource][value=purchase-902]').disabled && document.querySelector('[name=icSource][value=purchase-801]').disabled && document.querySelector('[data-ic-action=create]').disabled");
 await click('[name=icSource][value=purchase-901]');await click('[data-ic-action=create]');
 await check('可从结算依据生成草稿但不冒充已确认',"document.querySelector('#icDrawerContent').textContent.includes('KSIC260901') && document.querySelector('#icDrawerContent').textContent.includes('草稿') && document.querySelector('#icDrawerContent').textContent.includes('¥9,600.00') && !!document.querySelector('[data-ic-action=submit]') && !document.querySelector('[data-ic-action=confirm]')");
 await click('[data-ic-action=submit]');await click('[data-ic-action=confirm]');await close();await click('#icCreate');
 await check('建立后同一依据不可重复发起',"document.querySelector('[name=icSource][value=purchase-901]').disabled && document.querySelector('#icDrawerContent').textContent.includes('ICDZ20260927005')");await close();
 await openRecord('ICDZ20260927004');await set('#icClaim','700');await node('上海其他公司');
 await check('切到无关公司清理表单和列表，不能沿用旧保存入口',"document.querySelector('#icRecDrawer').hidden && !document.querySelector('#icClaim,[data-ic-action=save]') && document.querySelectorAll('#icRows [data-record]').length===0 && document.querySelector('#icCreate').disabled");
 await node('北京凯撒旅游有限公司');
 await check('北京节点同页反转采购供货和收付方向，没有固定公司角色',"document.querySelector('#icCompany').textContent==='北京凯撒旅游有限公司' && document.querySelector('[data-record=ICDZ20260927002]').textContent.includes('我方采购') && document.querySelector('[data-record=ICDZ20260927001]').textContent.includes('我方供货')");
 await navigate('sales/orders-detail.html?orderNo=KSIC260901');await click('#openIntercompanyReconciliation');await pause(700);
 await check('跨主体详情直接进入新对账页并限定关联订单',"location.pathname.endsWith('finance-intercompany-reconciliation.html') && location.search.includes('KSIC260901') && document.querySelector('#icOrderScope').textContent.includes('尚无对账单') && document.querySelectorAll('#icRows [data-record]').length===0");
 await click('#icCreate');
 await check('订单入口发起范围只含本单，不能串到其他关系',"document.querySelectorAll('[name=icSource]').length===1 && document.querySelector('[name=icSource]').value==='purchase-901'");await close();
 await navigate('sales/orders-detail.html?orderNo=KSIC260902');await click('#openIntercompanyReconciliation');await pause(700);await click('#icCreate');
 await check('待资源确认的反向订单可以查看入口但不能生成对账',"document.querySelector('#icOrderScope').textContent.includes('资源待确认') && document.querySelectorAll('[name=icSource]').length===1 && document.querySelector('[name=icSource]').disabled && document.querySelector('[data-ic-action=create]').disabled");
 for(const order of ['UNKNOWN','WC20260926001','KS20260718001']) {
  await navigate('finance/finance-intercompany-reconciliation.html?orderNo='+order+'&company=北京凯撒&role=finance');await click('#icCreate');
  await check('普通／外部／未知订单不因网址构造生成内部记录 '+order,"document.querySelectorAll('#icRows [data-record]').length===0 && !document.querySelector('[name=icSource]') && document.querySelector('[data-ic-action=create]').disabled && document.querySelector('#icCompany').textContent==='福建凯撒旅游有限公司'");
 }
 await navigate('finance/finance-intercompany-reconciliation.html');
 await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await pause(500);
 await run("document.querySelector('.ic-rec-table').scrollLeft=10000");
 await check('1024宽表格在容器内滚动，操作列固定92像素',"(()=>{const w=document.querySelector('.ic-rec-table'),a=document.querySelector('#icRows [data-record] td:last-child');return w.scrollWidth>w.clientWidth && getComputedStyle(a).position==='sticky' && Math.abs(a.getBoundingClientRect().width-92)<2 && a.getBoundingClientRect().right<=innerWidth+1 && document.documentElement.scrollWidth<=innerWidth+1})()");
 await check('金额与状态关键短值没有裁切',"Array.from(document.querySelectorAll('#icRows .ic-rec-money,#icRows .tag')).every(x=>x.scrollWidth<=x.clientWidth+1)");await shoot('intercompany-reconciliation-list-narrow.png');
 await openRecord('ICDZ20260927002');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(500);
 await check('390宽抽屉内容不溢出，核对及确认按钮完整可达',"(()=>{const d=document.querySelector('#icRecDrawer .modal'),b=document.querySelector('[data-ic-action=confirm]');return d.scrollWidth<=d.clientWidth+1 && b.getBoundingClientRect().right<=innerWidth+1 && b.getBoundingClientRect().bottom<=innerHeight+1 && Array.from(document.querySelectorAll('.ic-rec-amounts .ic-rec-value')).every(x=>x.scrollWidth<=x.clientWidth+1)})()");await shoot('intercompany-reconciliation-drawer-narrow.png');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(500);await shoot('intercompany-reconciliation-confirm.png');
 assert.deepEqual(errors,[],'浏览器无未捕获异常');console.log('PASS 浏览器无未捕获异常');n++;
 console.log('完成 '+n+' 项浏览器检查');
} finally { ws.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
