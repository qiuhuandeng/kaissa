/* 使用默认案例和实际按钮办理；不通过脚本改完成、认可或审批状态。 */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/evidence/mice-prototype/settlement-workflow-20261024'),checks=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const mode of ['file','http']){
  const ctx=await b.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(mode+': '+e.message));
  const pid='PRJ-20261024-001',ids=['PRJ20261024001','PRJ20261024002','PRJ20261024003'];
  const url=f=>mode==='file'?pathToFileURL(path.join(root,f.split('?')[0])).href+(f.includes('?')?'?'+f.split('?')[1]:''):'http://127.0.0.1:'+server.address().port+'/'+f;
  const go=async f=>{await p.goto(url(f));await p.waitForTimeout(200);};
  const listing=()=>go('merchant/tour/fulfillment-cost.html?type=project&projectId='+pid);
  const click=async s=>{await p.locator(s).click();await p.waitForTimeout(260);},tab=n=>click('[data-settlement-doc-tab="'+n+'"]'),open=id=>click('[data-open-settlement-basis="'+id+'"]'),close=()=>click('#settlementBasisDrawer .modal-close');
  const record=aid=>p.evaluate(aid=>MiceUI.store.data.settlements.find(r=>r.activities.includes(aid)),aid);
  const check=async(name,fn)=>{try{await fn();checks.push(mode+'：'+name);console.log('PASS',mode,name);}catch(e){await p.screenshot({path:path.join(out,mode+'-failure.png')});throw e;}};
  const approval=async(decision,opinion)=>{
   await tab('logs');await p.getByRole('link',{name:'查看审批',exact:true}).click();await p.waitForURL(/approval\/approvals.html/);
   await p.locator('[data-mice-action=approval-view]').filter({hasText:'审批'}).click();await p.locator('#mice-form [name=opinion]').fill(opinion);await click('#mice-form button[value="'+decision+'"]');
   assert.equal(await p.locator('#mice-form').count(),0);
   await p.locator('[data-mice-action=approval-view]').last().click();await p.getByRole('link',{name:'查看来源单据',exact:true}).click();await p.waitForURL(/fulfillment-cost.html/);await p.waitForTimeout(250);
  };
  await listing();
  await check('默认列表直接具备结算、继续结算和修改结算，无需改变示例状态',async()=>{
   for(const [i,label]of ['结算','继续结算','修改结算'].entries())assert.equal(await p.locator('[data-open-settlement-basis="'+ids[i]+'"]').innerText(),label);
   assert.equal(await p.locator('#settlementBasisDrawer').isVisible(),false);
   assert.deepEqual(await p.evaluate(pid=>{const d=MiceUI.store.data,pr=d.projects.find(r=>r.id===pid);return d.activities.filter(a=>a.projectId===pid).map(a=>MiceSettlement.issues(pr,[a.id]).length);},pid),[0,0,0]);
   await p.locator('#costProgress').selectOption('草稿');assert.equal(await p.locator('#scheduleCostRows tr:visible').count(),1);await p.locator('#costProgress').selectOption('全部进度');await p.screenshot({path:path.join(out,mode+'-list-1440.png')});
  });
  await check('同一团的详情只读，结算可办理，保留十页签及三种金额',async()=>{
   await click('[data-open-project-settlement-detail="'+ids[0]+'"]');assert.equal(await p.locator('#saveSettlementBasis').isVisible(),false);await tab('attachments');assert.equal(await p.locator('#projectSettlementBasis').getAttribute('readonly'),'');assert.equal(await p.locator('#projectSettlementFiles input').isVisible(),false);await close();
   await open(ids[0]);assert.equal(await p.locator('[data-settlement-doc-tab]').count(),10);assert.equal(await p.locator('#saveSettlementBasis').isVisible(),true);assert.match(await p.locator('#projectSettlementTaxSummary').innerText(),/含税金额.*预计扣税后.*核定扣税后/s);assert.match(await p.locator('#projectSettlementTaxSummary').innerText(),/106,000.00.*76,320.00.*29,680.00/s);
  });
  await check('本次承担按原分配核对，项目承担切换不重算原采购',async()=>{
   await tab('cost');assert.match(await p.locator('#projectSettlementScopeCosts').innerText(),/6,360.00.*2,120.00/s);await tab('overview');await p.locator('#projectSettlementIncludeCosts').check();assert.match(await p.locator('#projectSettlementTaxSummary').innerText(),/86,920.00/);await p.locator('#projectSettlementIncludeCosts').uncheck();assert.equal(await p.evaluate(()=>MiceUI.store.find('costs','FY20261024004').amount),6360);
  });
  await check('未保存的结算修改离开前确认，取消离开保留所填内容',async()=>{
   await tab('attachments');await p.locator('#projectSettlementPending').fill('待保存的尾款安排');await close();assert.equal(await p.locator('.mice-confirm').isVisible(),true);await click('.mice-confirm [data-no]');assert.equal(await p.locator('#settlementBasisDrawer').isVisible(),true);assert.equal(await p.locator('#projectSettlementPending').inputValue(),'待保存的尾款安排');
  });
  await check('结算依据与附件可保存，保留页签并从同一草稿继续',async()=>{
   await tab('attachments');await p.locator('#projectSettlementBasis').fill('已核杭州场交付、客户认可、采购分配及税额。');await p.locator('#projectSettlementPending').fill('客户尾款53,000元及供应商尾款37,100元按原单据办理。');
   await p.locator('#projectSettlementFiles input').setInputFiles({name:'杭州结算核对.txt',mimeType:'text/plain',buffer:Buffer.from('杭州场客户认可、供应商费用及分配依据。')});await p.getByText('杭州结算核对.txt',{exact:true}).waitFor();await click('#saveSettlementBasis');
   assert.equal(await p.locator('[data-settlement-doc-tab].active').getAttribute('data-settlement-doc-tab'),'attachments');const r=await record(ids[0]);assert.equal(r.status,'草稿');assert.equal(r.attachments.length,1);assert(r.history[0].at);await close();await open(ids[0]);assert.match(await p.locator('#settlementBasisSummary').innerText(),new RegExp(r.id));await tab('attachments');assert.match(await p.locator('#projectSettlementPending').inputValue(),/53,000/);assert.equal(await p.getByText('杭州结算核对.txt',{exact:true}).count(),1);
   for(const width of [1440,1024]){await p.setViewportSize({width,height:1000});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,mode+'-edit-'+width+'.png')});}await p.setViewportSize({width:1440,height:1000});
  });
  await check('提交生成原审批事项并保存金额，办理记录可查且不可重复提交',async()=>{
   const before=await record(ids[0]);await click('#submitSettlementApply');const r=await record(ids[0]);assert.equal(r.id,before.id);assert.equal(r.status,'审批中');assert.equal(r.submittedRecord.financial.amounts[0].netProfit,28000);assert.equal(await p.locator('#saveSettlementBasis').isVisible(),false);assert.equal(await p.locator('[data-settlement-doc-tab].active').getAttribute('data-settlement-doc-tab'),'logs');assert.match(await p.locator('[data-settlement-doc-panel=logs]').innerText(),/保存结算草稿.*提交结算/s);await click('#submitSettlementApply');await click('[data-open-project-settlement-detail="'+ids[0]+'"]');assert.equal(await p.locator('[data-open-settlement-basis="'+ids[0]+'"]').count(),0);assert.equal(await p.locator('#submitSettlementApply').innerText(),'关闭');assert.equal(await p.evaluate(id=>MiceUI.store.data.approvals.filter(a=>a.sourceId===id).length,r.id),1);
  });
  await check('通过原审批页面确认，返回结算显示已确认并只读保留附件',async()=>{
   await approval('approve','已核杭州场收入、成本、税额及附件。');const r=await record(ids[0]);assert.equal(r.status,'已确认');assert.equal(r.confirmedRecord.financial.amounts[0].netProfit,28000);await tab('attachments');assert.equal(await p.locator('#projectSettlementFiles input').isVisible(),false);assert.equal(await p.locator('#projectSettlementFiles [data-file-remove]').isVisible(),false);assert.equal(await p.locator('#projectSettlementFiles [data-file-preview]').isVisible(),true);await tab('logs');assert.match(await p.locator('[data-settlement-doc-panel=logs]').innerText(),/审批通过/);await close();
  });
  await check('草稿提交后通过原审批退回，修改原结算再提交并保留旧版',async()=>{
   await listing();await open(ids[1]);const original=await record(ids[1]);await click('#submitSettlementApply');await approval('return','请补苏州场尾款安排。');assert.equal((await record(ids[1])).status,'已退回');assert.equal(await p.locator('#submitSettlementApply').innerText(),'再次提交');await tab('attachments');await p.locator('#projectSettlementPending').fill('苏州场尾款由原订单和采购付款申请继续办理。');await click('#submitSettlementApply');const r=await record(ids[1]);assert.equal(r.id,original.id);assert.equal(r.status,'审批中');assert.equal(r.amountHistory.length,1);assert.equal(r.amountHistory[0].record.financial.amounts[0].grossIncome,148400);await close();
  });
  await check('预置退回案例直接重提，未知核定税额不会被补成零',async()=>{
   await listing();await open(ids[2]);assert.match(await p.locator('#settlementBasisSummary').innerText(),/退回原因/);assert.match(await p.locator('#projectSettlementTaxSummary').innerText(),/销项税额待核定.*可扣税额待核定/s);await click('#submitSettlementApply');const r=await record(ids[2]);assert.equal(r.status,'审批中');assert.equal(r.submittedRecord.financial.amounts[0].netProfit,null);assert.equal(r.submittedRecord.financial.amounts[0].estimatedNetProfit,33000);await close();
  });
  await check('刷新保留已办理结果；执行只读结算与独立采购入口仍在',async()=>{
   await listing();assert.equal(await p.locator('[data-open-settlement-basis="'+ids[0]+'"]').count(),0);assert.deepEqual(await p.locator('#scheduleCostRows tr').filter({has:p.locator('[data-open-project-settlement-detail="'+ids[0]+'"]')}).locator('.table-action button').allTextContents(),['详情']);await go('merchant/tour/schedules-detail.html?mice=1&id='+ids[0]);assert.equal(await p.locator('[role=tab]').count(),8);assert.equal(await p.locator('#submitSettlementApply,[data-kind=settlement]').count(),0);
   await go('merchant/tour/fulfillment-cost.html?mice=1&projectId='+pid);assert.equal(await p.getByRole('button',{name:'新增采购',exact:true}).count(),1);assert.equal(await p.locator('#mice-app [data-mice-action=cost-view]').count(),5);
  });
  await ctx.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));console.log('PASS '+checks.length+' checks');
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,error:e.stack},null,2));throw e;}finally{await b.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
