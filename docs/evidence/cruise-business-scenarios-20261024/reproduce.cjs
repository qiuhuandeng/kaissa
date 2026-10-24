// 业务场景核查，不修改源页面；各场景使用独立浏览器会话。
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),out=__dirname;
(async()=>{
 const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/merchant/';
 const browser=await chromium.launch({channel:'chrome',headless:true}),observations=[],errors=[];
 const record=(id,steps,result,data)=>{observations.push({id,steps,result,data});console.log(id+': '+result);};
 async function scene(id,fn){const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push({id,error:e.message}));p.on('dialog',d=>d.accept());const go=f=>p.goto(base+f);const shot=async n=>{await p.locator('.crp-drawer,.modal-overlay.show .modal').evaluateAll(async ns=>{for(const el of ns)await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});await p.screenshot({path:path.join(out,n+'.png'),fullPage:true});};try{await fn(p,go,shot);}catch(e){record(id+'-incomplete',[],'核查未完成',{error:e.stack});process.exitCode=1;}finally{await context.close();}}
 try{
 await scene('B01',async(p,go,shot)=>{
  await go('sales/booking.html?type=cruise&entry=product-booking&product='+encodeURIComponent('理想号地中海邮轮'));
  await p.locator('[data-cruise-add-person=child]').first().click();
  const before=await p.locator('#orderReceivableTotal').innerText();assert.equal(before,'¥85,750');
  await p.locator('[data-cruise-service=museum]').check();
  const options=await p.locator('[data-cruise-service=museum]').evaluate(el=>el.closest('label')?.innerText||el.parentElement.innerText);
  await shot('family-service-participants');await p.locator('#orderProcessMode').selectOption('pending');await p.locator('#createOrder').click();await p.locator('#createdTitle').waitFor();
  const data=await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('caesarOrderFinanceEvents')).orders).at(-1).cruiseBookingDetails);
  assert.equal(data.rooms[0].rooms[0].people.length,3);const museum=data.services.find(s=>s.id==='museum');assert.equal(museum.quantity,3);
  record('B01',['销售预订选择邮轮','1间舱加入第3位儿童','选博物馆服务','生成待确认订单并核成交组成'],'全家参加可表达；仅父母参加不能表达',{fareBeforeService:before,people:3,rooms:1,service: museum,selection:options,result:await p.locator('#createdFinanceItems').innerText()});
 });
 await scene('B02',async(p,go,shot)=>{
  const click=a=>p.locator('[data-cp="'+a+'"]').last().click(),f=k=>p.locator('[data-field="'+k+'"]');
  async function approve(no){await go('approval/approvals.html?view=todo&approvalNo='+no);await p.locator('#approvalSubmitBtn').waitFor({state:'visible'});await p.locator('#approvalOpinion').fill('核对本笔代理订舱，供关联销售订单使用');await p.locator('#approvalSubmitBtn').click();}
  await go('cruise/procurement-orders.html?create=1&contractId=HT-YL-006');await f('voyage.date').fill('2027-02-04');await f('voyage.back').fill('2027-02-11');await f('lines.0.quantity').fill('1');await f('salesOrder').fill('SO-AGENCY-ONLY-001');await click('submit');
  let s=await p.evaluate(()=>CaesarCruisePurchase.read()),o=s.orders.find(x=>x.salesOrder==='SO-AGENCY-ONLY-001');assert(o);await approve(o.approvalNo);s=await p.evaluate(()=>CaesarCruisePurchase.read());let receipt=s.receipts.find(r=>r.sourceId===o.id);
  await go('cruise/procurement-receipts.html');await p.locator('[data-row="'+receipt.id+'"] [data-cp=receive]').click();await click('submit-receipt');s=await p.evaluate(()=>CaesarCruisePurchase.read());receipt=s.receipts.find(r=>r.id===receipt.id);await approve(receipt.approvalNo);
  await go('cruise/inventory-locks.html');const key='HC-VENICE-20270204|BA';const inventory=await p.evaluate(key=>{const s=CaesarCruiseInventory.read(),st=s.stocks.find(x=>x.id===key);return {stock:st,count:CaesarCruiseInventory.count(s,st),orders:s.positions.filter(x=>x.stock===key)};},key);
  await p.locator('[data-ci=new-lock]').click();await p.locator('[data-f=stock]').selectOption(key);await p.locator('[data-f=customer]').fill('另一位客户');await p.locator('[data-f=quantity]').fill('1');await p.locator('[data-ci=save-lock]').click();
  const second=await p.evaluate(key=>CaesarCruiseInventory.read().positions.find(x=>x.stock===key&&x.customer==='另一位客户'),key);await shot('agency-purchase-reused');
  record('B02',['散位代理协议拆1间采购订单','填写关联销售订单','统一审批通过','船方1间确认入库及审核','库存页给另一客户锁同1间'],'不符合按单采购的专属占用要求',{sourceOrder:o.salesOrder,receipt:receipt.id,afterReceipt:inventory,anotherCustomerHold:second||null});assert(second);
 });
 await scene('B03',async(p,go,shot)=>{
  await go('cruise/inventory-pools.html');await p.locator('[data-ci=pool-detail]').first().click();const pool=await p.locator('.crp-body').innerText();
  await go('cruise/inventory-locks.html');await p.locator('[data-ci=new-lock]').click();await p.locator('[data-f=stock]').selectOption('HC-IDEAL-20261112|BA');await p.locator('[data-f=product]').selectOption('SH');await p.locator('[data-f=origin]').selectOption('上海');await p.locator('[data-f=channel]').selectOption('B2C');await p.locator('[data-f=quantity]').fill('4');await p.locator('[data-ci=save-lock]').click();const issue=await p.locator('.crp-error').innerText();await shot('shared-pool-quota-conflict');
  await p.locator('[data-f=quantity]').fill('3');await p.locator('[data-ci=save-lock]').click();const held=await p.evaluate(()=>CaesarCruiseInventory.read().positions[0]);assert.equal(held.quantity,3);await p.locator('[data-ci=release][data-id="'+held.id+'"]').click();await p.locator('[data-ci=confirm-release]').click();
  record('B03',['查看先到先得共享池','上海产品申请4间','查看失败原因','改3间成功保舱','客户放弃后释放'],'实际为受配额限制的共享，需明确业务策略',{pool,issue,held,released:await p.evaluate(id=>CaesarCruiseInventory.read().positions.find(x=>x.id===id).status,held.id)});
 });
 await scene('B04',async(p,go,shot)=>{
  await go('cruise/room-assignments.html');await p.locator('[data-rm=suggest]').click();const suggestions=await p.locator('.crp-layer').innerText();await p.locator('[data-rm=apply-suggestions]').click();
  let s=await p.evaluate(()=>CaesarCruiseRooms.read());const accessible=s.groups.find(g=>g.id==='G-SH-01');assert.equal(accessible.room,'9240');
  await p.locator('[data-rm=assign][data-id=G-BJ-01]').click();await p.locator('[data-field=room]').selectOption('9240');await p.locator('[data-rm=save-room]').click();const duplicate=await p.locator('.crp-error').innerText();await shot('room-accessible-and-conflict');
  record('B04',['同航次北京上海同舱组待分房','确认分房建议','无障碍客人匹配房号9240','再把另一同舱组安排到9240'],'本范围符合：建议照顾偏好，重复房号未覆盖原安排',{suggestions,accessible,duplicate});
 });
 await scene('B05',async(p,go,shot)=>{
  await go('tour/schedules-detail.html?type=cruise&tab=orders');await p.locator('#openWholeGroupTransfer').click();await p.locator('[data-transfer-decision]').nth(0).selectOption('接受转团');await p.locator('[data-cr-transfer=plan]').nth(0).selectOption('B 岸上自由');await p.locator('[data-cr-transfer=delta]').nth(0).fill('-1200');await p.locator('[data-transfer-decision]').nth(1).selectOption('退款');await p.locator('[data-transfer-decision]').nth(2).selectOption('待决定');await p.locator('#confirmWholeTransfer').click();const decisions=await p.locator('#wholeTransferRows').innerText();assert(decisions.includes('转团申请已提交')&&decisions.includes('退款申请已提交')&&decisions.includes('待决定'));await shot('mixed-customer-decisions');
  await p.locator('[data-transfer-decision]').nth(2).selectOption('接受转团');await p.locator('[data-cr-transfer=targetCabin]').nth(2).selectOption('BA');await p.locator('[data-cr-transfer=rooms]').nth(2).fill('3');await p.locator('#confirmWholeTransfer').click();const shortage=await p.locator('#wholeTransferRows tr').nth(2).innerText();
  const href=await p.locator('#wholeTransferRows a').first().getAttribute('href');await p.goto(new URL(href,p.url()).href);const destination=await p.locator('body').innerText();
  record('B05',['船方变更后逐单选择转团／退款／待决定','确认本批申请','剩余订单申请超过目标舱位','进入原售后承接'],'申请阶段符合；合同及资金最终办理不能据此判整链通过',{decisions,shortage,destination:destination.slice(-5500)});
 });
 const F=require(path.join(root,'shared/cruise-finance-model.js'));const r=F.seed(),a=F.voyages[0].id,b=F.voyages[1].id;
 F.allocate(r,[{id:a,allocated:300000},{id:b,allocated:400000}]);F.submit(r,a,200000);F.confirm(r,'确认冲抵');F.transfer(r,a,b,100000);const prior=JSON.stringify(r);let rejection='';try{F.transfer(r,a,b,1);}catch(e){rejection=e.message;}assert.equal(JSON.stringify(r),prior);
 record('B06',['100万元预付分配30万和40万','第一航次确认冲抵20万','未冲抵10万转第二航次','尝试继续转走已冲抵部分'],'规则算例符合：转用途不产生第二笔付款，已冲抵部分受保护',{totals:F.totals(r),uses:r.uses,rejection,evidence:'运行现有计算规则；本轮未把这些步骤标为新浏览器验收'});
 }finally{fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify({scope:'业务场景适配性核查：5条浏览器操作链＋1条财务规则算例；非完整上线验收',observations,errors},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
