/* 项目团控只读，项目采购与团期结算共用原费用；每种协议独立会话。 */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.MICE_COST_EVIDENCE||'docs/evidence/mice-prototype/cost-boundary-20261024'),checks=[],errors=[];fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const mode of ['file','http']){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(mode+': '+e.message));
 const pid='PRJ-20261008-002',aid='PRJ20261000010',aid2='PRJ20261000011',common='FY20261008003';
 const url=f=>mode==='file'?pathToFileURL(path.join(root,f.split('?')[0])).href+(f.includes('?')?'?'+f.split('?')[1]:''):'http://127.0.0.1:'+server.address().port+'/'+f;
 const go=async f=>{await page.goto(url(f));await page.waitForTimeout(250);};
 const check=async(name,fn)=>{try{await fn();checks.push(mode+'：'+name);console.log('PASS',mode,name);}catch(e){await page.screenshot({path:path.join(out,mode+'-failure.png')});throw e;}};
 const act=async(key,id)=>{const selector='[data-mice-action="'+key+'"]'+(id?'[data-id="'+id+'"]':'');const inner=page.locator('.mice-drawer-overlay '+selector);await(await inner.count()?inner:page.locator(selector)).first().click();};
 const input=(n,v)=>page.locator('#mice-form [name="'+n+'"]').fill(String(v)),select=(n,v)=>page.locator('#mice-form [name="'+n+'"]').selectOption(v);
 const submit=async v=>{await page.locator('#mice-form button[value="'+v+'"]').click();await page.waitForTimeout(120);};
 const close=async()=>{await page.locator('.mice-close').click();if(await page.locator('[data-yes]').count())await page.locator('[data-yes]').click();};
 const title=async text=>assert.equal(await page.locator('#mice-dialog-title').innerText(),text);
 const row=id=>page.locator('#projectCostWorkspace .mice-cost-table tr').filter({has:page.locator('[data-mice-action=cost-view][data-id="'+id+'"]')});
 const get=id=>page.evaluate(id=>MiceUI.store.find('costs',id),id);
 const costs=()=>go('merchant/tour/fulfillment-cost.html?type=project&work=costs&projectId='+pid+'&activityId='+aid);
 const ledger=(extra='')=>go('merchant/tour/fulfillment-cost.html?type=project&work=costs'+extra);
 const fields=async(name,amount)=>{await input('name',name);await select('supplier','华东会议服务有限公司');await select('category','会场设备');await input('amount',amount);await input('basis','测试：供应商服务确认资料');};
 await check('执行无成本页签，旧成本地址转独立结算详情，成本写入仍归结算',async()=>{
  await go('merchant/tour/schedules-detail.html?mice=1&id='+aid+'&tab=costs');await page.waitForURL(/fulfillment-cost.html/);
  assert.equal(await page.locator('#settlementBasisTitle').innerText(),'项目团结算详情');assert.equal(await page.locator('#saveSettlementBasis').isVisible(),false);
  await go('merchant/tour/schedules-detail.html?mice=1&id='+aid+'&tab=resources');
  assert.equal(await page.getByRole('tab',{name:'成本摘要',exact:true}).count(),0);assert.equal(await page.locator('[data-mice-action=cost-new],[data-mice-action=cost-edit],[data-mice-action=cost-budget]').count(),0);
  await page.evaluate(([p,a])=>MiceCosts.openForActivity(p,a,'cost-new'),[pid,aid]);assert.equal(await page.locator('#mice-form').count(),0);
  assert.equal(await page.locator('[data-mice-action=resource-new]').count(),1);assert.equal(await page.locator('[data-mice-action=resource-cost]').count(),0);
 });
 await check('进行中在团期结算维护成本，最终结算仍只读',async()=>{
  await go('merchant/tour/fulfillment-cost.html?type=project');assert.equal(await page.locator('[data-open-cost="'+aid+'"]').count(),1);await page.locator('[data-open-settlement-basis="'+aid+'"]').click();assert.equal(await page.locator('#saveSettlementBasis').isVisible(),false);await page.locator('#settlementBasisDrawer .modal-close').click();await page.locator('[data-open-cost="'+aid+'"]').click();await page.waitForTimeout(300);assert(await page.locator('#scheduleCostDrawer').isVisible());assert.equal(await page.locator('#saveScheduleCost').isVisible(),false);
 });
 let direct,shared;
 await check('本团新增确认费用、保存回原抽屉并高亮来源，税额表单保留',async()=>{
  await act('cost-new');await title('新增费用');assert.equal(await page.locator('[name=projectId]').count(),0);assert.equal(await page.locator('[name=scopeType]').inputValue(),'direct');assert.equal(await page.locator('[name=expectedTaxRate]').count(),1);await fields('验收本团设备',2000);await submit('confirm');assert.equal(await page.locator('#mice-form').count(),0);direct=await page.evaluate(()=>MiceUI.store.data.costs.find(c=>c.name==='验收本团设备'));assert.equal(direct.activityId,aid);assert.equal(direct.status,'已确认');assert.equal(await row(direct.id).count(),1);assert(await row(direct.id).evaluate(n=>n.classList.contains('mice-cost-highlight')));
 });
 await check('编辑成本、调整预计不改变客户成交金额',async()=>{
  await act('cost-edit',direct.id);await input('amount',2300);await submit('confirm');assert.equal((await get(direct.id)).amount,2300);
  const before=await page.evaluate(()=>JSON.stringify(MiceUI.store.data.orders));await act('cost-budget');await input('estimate',130000);await select('charge','不追加');await input('reason','测试最新预计');await input('basis','费用核对资料');await submit('save');assert.equal(await page.evaluate(id=>MiceUI.store.find('activities',id).latestEstimate,aid),130000);assert.equal(await page.evaluate(()=>JSON.stringify(MiceUI.store.data.orders)),before);
 });
 await check('跨团费用允许待分配，超额分配不保存，分配后原采购只计一次',async()=>{
  await act('cost-new');await select('scopeType','shared');await fields('验收跨团设备',30000);for(const id of [aid,aid2])await page.locator('[name=covered][value="'+id+'"]').check();await submit('confirm');shared=await page.evaluate(()=>MiceUI.store.data.costs.find(c=>c.name==='验收跨团设备'));assert.equal(shared.unallocated,30000);assert.equal(await page.locator('#mice-cost-range').inputValue(),'project');await act('cost-view',shared.id);await act('cost-allocation',shared.id);await input('alloc-'+aid,20000);await input('alloc-'+aid2,11000);await input('basis','按实际设备使用分配');await submit('save');assert.match(await page.locator('[data-error=allocation]').innerText(),/不得超过/);await input('alloc-'+aid2,10000);await submit('save');await title('费用详情');assert.equal((await get(shared.id)).amount,30000);await close();await page.locator('#mice-cost-range').selectOption('activity');assert.match(await row(shared.id).innerText(),/20,000/);assert.equal(await page.evaluate(id=>MiceUI.store.data.costs.filter(c=>c.id===id).length,shared.id),1);
 });
 await check('项目公共费用管理分摊保留项目承担，原采购总额不变',async()=>{
  await page.locator('#mice-cost-range').selectOption('project');await act('cost-view',common);await act('cost-allocation',common);await input('alloc-'+aid,12000);await input('common',48000);await input('basis','统筹服务管理分摊');await submit('save');await close();await page.locator('#mice-cost-range').selectOption('activity');assert.match(await row(common).innerText(),/12,000/);assert.equal((await get(common)).amount,60000);
 });
 await check('在结算维护页引用执行资源新增费用，不重复提供已引用资源',async()=>{
  await page.evaluate(id=>{MiceUI.store.find('activities',id).resources.push({id:'RESOURCE-BOUNDARY',name:'验收会议设备',category:'会场设备',supplier:'华东会议服务有限公司',start:'2026-11-01',end:'2026-11-01',quantity:1,unit:'项',status:'已确认',confirmNo:'测试资源确认'});MiceUI.store.save();MiceSettlementHost.refreshCosts();},aid);
  await page.locator('#projectCostResource').selectOption('RESOURCE-BOUNDARY');await act('cost-resource');assert.equal(await page.locator('[name=name]').inputValue(),'验收会议设备');await input('amount',300);await submit('confirm');assert.equal(await page.locator('#projectCostResource option[value=RESOURCE-BOUNDARY]').count(),0);assert.equal(await page.evaluate(()=>MiceUI.store.data.costs.filter(c=>c.resourceId==='RESOURCE-BOUNDARY').length),1);
 });
 await check('结算项目费用入口沿用成本抽屉，项目／范围／状态／关键词查询保留',async()=>{
  await ledger();assert.match(page.url(),/work=costs/);assert.equal(await page.locator('#mice-app').count(),0);assert(await page.locator('#scheduleCostDrawer').isVisible());await page.locator('#mice-cost-query').fill('无此费用');await page.locator('#mice-cost-query').press('Enter');assert.match(await page.locator('#projectCostWorkspace').innerText(),/暂无符合条件/);await act('cost-reset');await page.locator('#mice-cost-project').selectOption(pid);await page.locator('#mice-cost-scope').selectOption('shared');await page.locator('#mice-cost-status').selectOption('已确认');await act('cost-search');assert(await row(shared.id).count());
 });
 await check('尚未排团项目可维护公共费用，不强制虚构项目团',async()=>{
  await page.evaluate(()=>{const p=MiceUI.M.clone(MiceUI.store.data.projects[1]);p.id='NO-GROUP';p.name='验收未排团项目';MiceUI.store.data.projects.push(p);MiceUI.store.save();});await ledger();await act('cost-new');await select('projectId','NO-GROUP');await fields('验收前期策划',6000);await submit('confirm');assert.equal(await page.locator('#mice-form').count(),0);const c=await page.evaluate(()=>MiceUI.store.data.costs.find(c=>c.name==='验收前期策划'));assert.equal(c.activityId,'');assert.equal(c.projectId,'NO-GROUP');assert.equal(await row(c.id).count(),1);
 });
 await check('原采购付款申请沿用同一费用，保存后返回费用详情且不冒充已付款',async()=>{
  await costs();await act('cost-edit',shared.id);await input('conditionLimit',30000);await input('paymentBasis','已核首付款条件');await submit('confirm');await act('cost-view',shared.id);await act('payment-new',shared.id);await title('申请付款');await input('amount',5000);await input('date','2026-10-24');await input('basis','测试首付款申请');await submit('submit');await title('费用详情');const r=await page.evaluate(()=>MiceUI.store.data.requests.at(-1));assert.equal(r.costId,shared.id);assert.equal((await get(shared.id)).paid,0);await close();
 });
 await check('费用调整草稿旧链接返回团期结算原费用，错误调整不回退其他记录',async()=>{
  await page.locator('#mice-cost-range').selectOption('activity');await act('cost-view',direct.id);await act('cost-adjust',direct.id);await input('amount',200);await input('reason','测试后补设备费用');await submit('draft');await title('费用详情');const change=await page.evaluate(()=>MiceUI.store.data.adjustments.at(-1));await ledger('&projectId='+pid+'&activityId='+aid+'&costId='+direct.id+'&adjustmentId='+change.id);await title('结算费用调整');assert.equal(await page.locator('[name=amount]').inputValue(),'200');await close();await ledger('&projectId='+pid+'&activityId='+aid+'&costId='+direct.id+'&adjustmentId=UNKNOWN');assert.equal(await page.locator('#mice-form').count(),0);
 });
 await check('历史角色参数不限制原型；完成／审批中／已确认仍遵守阶段锁定',async()=>{
  await costs();await page.evaluate(()=>sessionStorage.setItem('caesar-mice-access-fixture','foreign'));await page.reload();await page.waitForTimeout(200);assert(await page.locator('[data-mice-action=cost-new]').isEnabled());
  await page.evaluate(id=>{MiceUI.store.find('activities',id).status='已完成';MiceSettlementHost.refreshCosts();},aid);assert.equal(await page.locator('[data-mice-action=cost-budget]').count(),0);
  for(const status of ['审批中','已确认']){await page.evaluate(([id,status])=>{const d=MiceUI.store.data;d.settlements.push({id:'BOUNDARY-'+status,projectId:'PRJ-20261008-002',activities:[id],status});MiceSettlementHost.refreshCosts();},[aid,status]);assert.equal(await page.locator('#projectCostWorkspace [data-mice-action=cost-new],#projectCostWorkspace [data-mice-action=cost-edit][data-id="'+direct.id+'"]').count(),0);}
  await page.evaluate(id=>{const d=MiceUI.store.data;d.settlements=d.settlements.filter(r=>!r.id.startsWith('BOUNDARY-'));MiceUI.store.find('activities',id).status='进行中';MiceUI.store.save();},aid);
 });
 await check('错误费用或跨项目来源不打开其他费用，不生成单据',async()=>{
  await ledger('&projectId='+pid+'&costId=UNKNOWN');assert.match(await page.locator('#projectCostWorkspace').innerText(),/未找到/);assert.equal(await page.locator('#mice-form').count(),0);
  await go('merchant/tour/fulfillment-cost.html?type=project&work=costs&projectId='+pid+'&activityId=PRJ20261000001');assert.equal(await page.locator('#scheduleCostDrawer').isVisible(),false);
 });
 await check('普通团期与邮轮维护抽屉恢复原结构，不残留项目费用区',async()=>{
  await costs();await page.locator('#scheduleCostDrawer .modal-close').click();await page.selectOption('#costType','全部类型');await page.locator('#searchCosts').click();const ordinary=await page.evaluate(()=>ProjectSettlementPage.schedules.find(s=>s.type==='普通团期').id);await page.evaluate(id=>ProjectSettlementPage.openCosts(id),ordinary);await page.waitForTimeout(300);assert.equal(await page.locator('#projectCostWorkspace').count(),0);assert(await page.locator('#addGroupCostRow').isVisible());assert(await page.locator('#saveScheduleCost').isVisible());await page.locator('#scheduleCostDrawer .modal-close').click();
  const cruise=await page.evaluate(()=>ProjectSettlementPage.schedules.find(s=>s.type==='邮轮团期').id);await page.evaluate(id=>ProjectSettlementPage.openCosts(id),cruise);assert.equal(await page.locator('#projectCostWorkspace').count(),0);
 });
 await check('1440与1024抽屉无整页横向溢出，表格内部滚动',async()=>{
  for(const width of [1440,1024]){await page.setViewportSize({width,height:1000});await costs();await page.locator('#mice-cost-range').selectOption('project');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert(await page.locator('#projectCostWorkspace').evaluate(n=>n.scrollWidth<=n.clientWidth+2));await page.screenshot({path:path.join(out,mode+'-costs-'+width+'.png')});}
 });
 await check('恢复项目采购菜单与原独立列表，采购和结算导航分别选中',async()=>{
  await page.setViewportSize({width:1440,height:1000});await go('merchant/tour/schedules.html?mice=1');
  await page.locator('a.nav-item').filter({hasText:/^项目采购$/}).click();await page.waitForURL(/fulfillment-cost.html\?mice=1/);await page.locator('#mice-app .mice-cost-table').waitFor();
  assert.equal(await page.locator('a.nav-item.active').innerText(),'项目采购');assert.equal(await page.locator('#mice-app').isVisible(),true);assert.equal(await page.locator('#scheduleCostDrawer').isVisible(),false);assert.equal(await page.locator('#mice-app h1').count(),0);assert.equal(await page.getByRole('button',{name:'新增采购',exact:true}).count(),1);
  const rows=page.locator('#mice-app .mice-cost-table tr');assert.equal(await rows.filter({has:page.locator('[data-mice-action=cost-view][data-id="'+shared.id+'"]')}).count(),1);
  await page.locator('#mice-cost-project').selectOption(pid);await page.locator('#mice-cost-scope').selectOption('shared');await page.locator('#mice-cost-status').selectOption('已确认');await page.locator('#mice-cost-query').fill('验收跨团');await act('cost-search');assert.equal(await page.locator('#mice-app [data-mice-action=cost-view]').count(),1);
  await act('cost-view',shared.id);await title('费用详情');assert.equal(await page.locator('[data-mice-action=cost-allocation]').count(),1);assert.equal(await page.locator('[data-mice-action=payment-new]').count(),1);await close();assert.equal(await page.locator('#mice-cost-query').inputValue(),'验收跨团');await act('cost-reset');
 });
 await check('采购列表原位新增未排团采购，并从结算反查同一原采购',async()=>{
  await act('cost-new');await select('projectId','NO-GROUP');await fields('采购入口验收策划',8000);await submit('confirm');assert.equal(await page.locator('#mice-form').count(),0);
  const c=await page.evaluate(()=>MiceUI.store.data.costs.find(c=>c.name==='采购入口验收策划'));assert.equal(c.projectId,'NO-GROUP');assert.equal(c.activityId,'');assert.equal(c.scopeType,'common');assert.equal(await page.locator('#mice-app [data-mice-action=cost-view][data-id="'+c.id+'"]').count(),1);
  await ledger('&projectId=NO-GROUP&costId='+c.id);await title('费用详情');assert.equal(await page.locator('a.nav-item.active').innerText(),'团期结算');assert.equal((await get(c.id)).amount,8000);await close();
  await go('merchant/tour/fulfillment-cost.html?mice=1&projectId=NO-GROUP&costId='+c.id);await title('费用详情');assert.equal(await page.evaluate(id=>MiceUI.store.data.costs.filter(c=>c.id===id).length,c.id),1);await close();
  await go('merchant/tour/fulfillment-cost.html?mice=1&projectId='+pid+'&costId='+c.id);assert.match(await page.locator('#mice-app').innerText(),/未找到/);assert.equal(await page.locator('#mice-form').count(),0);
 });
 await check('恢复采购列表1440与1024布局，搜索和结果分区且无整页横向溢出',async()=>{
  for(const width of [1440,1024]){await page.setViewportSize({width,height:1000});await go('merchant/tour/fulfillment-cost.html?mice=1');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.equal(await page.locator('#mice-app > .mice-filters').count(),1);assert.equal(await page.locator('#mice-app > .mice-list-surface').count(),1);await page.screenshot({path:path.join(out,mode+'-procurement-'+width+'.png')});}
 });
 await context.close();
 }assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'PASS',checks,errors},null,2));console.log('PASS '+checks.length+' checks');}catch(e){fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'FAIL',checks,errors,error:e.stack},null,2));throw e;}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
