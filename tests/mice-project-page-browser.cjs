const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/evidence/mice-prototype/project-page-20261024');
fs.mkdirSync(out, { recursive: true });
const results = [], errors = [];
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const protocol of ['file', 'http']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const p = await context.newPage(); p.setDefaultTimeout(7000);
      p.on('pageerror', e => errors.push({ protocol, message: e.message }));
      const go = async file => {
        const [base, query] = file.split('?');
        await p.goto((protocol === 'file' ? pathToFileURL(path.join(root, base)).href : `http://127.0.0.1:${server.address().port}/${base}`) + (query ? '?' + query : ''));
        await p.waitForTimeout(120);
      };
      const act = (name, id) => p.locator(`[data-mice-action="${name}"]${id != null ? `[data-id="${id}"]` : ''}`).filter({ visible: true }).first().click();
      const fill = (name, value) => p.locator(`.mice-drawer-overlay [name="${name}"]`).fill(String(value));
      const select = (name, value) => p.locator(`.mice-drawer-overlay [name="${name}"]`).selectOption(value);
      const submit = async value => { await p.locator(`.mice-drawer-overlay .modal-footer button[value="${value}"]`).click(); await p.waitForTimeout(90); };
      const close = async () => { if (await p.locator('.mice-close').count()) await p.locator('.mice-close').click(); if (await p.locator('[data-yes]').count()) await p.locator('[data-yes]').click(); };
      const check = async (name, fn) => { try { await fn(); results.push({ protocol, name, pass: true }); console.log('PASS', protocol, name); } catch (e) { results.push({ protocol, name, pass: false, error: e.message }); await p.screenshot({ path: path.join(out, protocol+'-failure.png') }); throw e; } };
      let pid, aid, oid, quoteAid, packageIds, batchIds;
      const list = () => go('merchant/tour/product-custom-list.html');
      const detail = (tab='activities') => go(`merchant/tour/product-custom-detail.html?id=${pid}&tab=${tab}`);
      const projectAction = async action => { await act('project-more-view', pid); await p.locator(`.mice-project-menu [data-mice-action="${action}"]`).click(); };
      const newGroup = async (name, deal=false, pricing='fixed') => {
        await act('activity-new'); await fill('name',name);if(!deal)await p.locator('[name=saveAsDraft]').check();
        if(deal) { await select('dealState','confirmed'); await select('dealPricing',pricing); }
        const footer = p.locator('.mice-drawer-overlay .modal-footer .btn-primary'); await footer.click(); await p.waitForTimeout(100);
        return p.evaluate(({pid,name})=>MiceUI.store.data.activities.find(a=>a.projectId===pid&&a.name===name)?.id,{pid,name});
      };
      const choose = async ids => { for(const id of ids) await p.locator(`[data-activity-select="${id}"]`).check(); };
      const batch = async action => { await act('project-group-batch'); await p.locator(`.mice-project-menu [data-mice-action="${action}"]`).click(); };
      await list();
      await check('列表无内容标题，筛选与状态Tab保留，项目动作集中更多',async()=>{
        assert.equal(await p.locator('#mice-app h1').count(),0);
        assert.equal(await p.locator('.project-list-tabs button').count(),7);
        await act('project-more-view','PRJ-20261008-003');
        const menu=await p.locator('.mice-project-menu').innerText();
        for(const label of ['分工额度','项目成员','合同资料','客户结算确认','项目附件','结算期限','结项检查'])assert(menu.includes(label));
        assert(!menu.includes('分配费用额度')); await p.keyboard.press('Escape');
      });
      await check('默认示例有可批量操作草稿和进行中团，完成团不被重置',async()=>{
        pid='PRJ-20261008-003';await detail();assert.equal(await p.locator('.project-activity-table tbody tr').first().locator('td').nth(2).innerText(),'草稿');
        await choose(['DEMO-PREP-HC-001','DEMO-PREP-HC-002']);await act('project-group-batch');
        for(const name of ['work-batch-edit','deal-batch','project-package-order','work-batch-quote'])assert(!(await p.locator(`.mice-project-menu [data-mice-action="${name}"]`).isDisabled()));
        await p.keyboard.press('Escape');await detail();await choose(['DEMO-EXEC-HC-001','DEMO-EXEC-HC-002']);await act('project-group-batch');assert(!(await p.locator('.mice-project-menu [data-mice-action=activity-handover]').isDisabled()));assert(await p.locator('.mice-project-menu [data-mice-action=deal-batch]').isDisabled());await p.keyboard.press('Escape');await list();
      });
      await check('新建立项留在列表，核对启用后才继续建团',async()=>{
        await act('project-new');await fill('name','重构验收年度会议项目');await submit('submit');
        pid=await p.evaluate(()=>MiceUI.store.data.projects.find(p=>p.name==='重构验收年度会议项目').id);
        assert(p.url().includes('product-custom-list'));await act('project-edit',pid);await submit('activate');
        assert.equal(await p.evaluate(id=>MiceUI.store.find('projects',id).status,pid),'进行中');
      });
      await check('统一分工额度维护，超分配不保存，保存不生成订单',async()=>{
        await projectAction('project-assignments');await fill('total',50000);await submit('save');
        assert.match(await p.locator('[data-error=total]').innerText(),/不得超过/);
        await fill('total',500000);await submit('save');
        const state=await p.evaluate(id=>{const p=MiceUI.store.find('projects',id);return {budget:p.delegations[0].costBudget,total:p.originalBudget,orders:MiceUI.store.data.orders.filter(o=>o.projectId===id).length};},pid);
        assert.deepEqual(state,{budget:100000,total:500000,orders:0});
      });
      await check('列表维护项目成员、OA合同、附件、结算期限及结项检查均可打开',async()=>{
        await projectAction('project-members');await act('flow-member-new');await fill('note','验收资源协作');await submit('save');
        assert(await p.evaluate(id=>MiceUI.store.find('projects',id).members.some(m=>m.note==='验收资源协作'),pid));
        await projectAction('project-contracts');await act('flow-oa-link');await submit('link');
        assert.equal(await p.evaluate(id=>MiceUI.store.find('projects',id).frameworks.length,pid),1);
        await projectAction('project-files');assert.equal(await p.locator('#mice-dialog-title').innerText(),'项目资料附件');await close();
        await projectAction('project-deadline');await fill('days',30);await fill('basis','客户约定完成后30天核对');await submit('save');
        await projectAction('project-closeout');assert.equal(await p.locator('#mice-dialog-title').innerText(),'项目结项检查');await close();
      });
      await check('业务四页签不照搬参考页，项目资料只读查看',async()=>{
        await detail('materials');assert.deepEqual(await p.locator('#mice-app [role=tab]').allTextContents(),['项目团','客户订单','费用与结算','项目资料']);
        for(const action of ['flow-budget','work-delegation-new','framework-new','project-files','project-closeout','flow-member-new'])assert.equal(await p.locator(`#mice-app [data-mice-action="${action}"]`).count(),0);
        assert.equal(await p.getByRole('link',{name:'项目采购',exact:true}).filter({visible:true}).count(),0);
        await act('project-framework-view',await p.evaluate(id=>MiceUI.store.find('projects',id).frameworks[0].id,pid));
        assert.equal(await p.locator('.mice-drawer-overlay button[type=submit]').count(),0);await close();
      });
      await check('子团无分工和额度操作，未选中不启用批量菜单，先筹备不建单',async()=>{
        await go(`merchant/tour/product-custom-detail.html?id=${pid}`);assert.equal(await p.locator('#mice-app [role=tab][aria-selected=true]').innerText(),'项目团');assert((await p.locator('.project-activity-table').boundingBox()).y<600);assert(await p.locator('[data-mice-action=project-group-batch]').isDisabled());
        aid=await newGroup('杭州主会场');assert(aid);
        assert.equal(await p.evaluate(id=>MiceUI.store.data.orders.filter(o=>o.projectId===id).length,pid),0);
      });
      await check('原草稿建单后直接进入执行，金额与收款计划不改变',async()=>{
        await act('deal-new',aid);await submit('create');
        oid=await p.evaluate(id=>MiceUI.store.data.orders.find(o=>o.activities.includes(id)).id,aid);
        const o=await p.evaluate(id=>MiceUI.store.find('orders',id),oid);assert.equal(o.amount,30000);assert.deepEqual(o.nodes.map(n=>n.amount),[9000,21000]);
        assert.equal(await p.evaluate(id=>MiceUI.store.find('activities',id).status,aid),'进行中');assert.equal(await p.locator('[data-mice-action=deal-form-group]').count(),0);assert.equal(await p.locator('.mice-drawer-overlay a').filter({hasText:'进入团控'}).count(),1);await close();
      });
      await check('新建子团预算占用同一人员额度，外币不混算人民币预算',async()=>{
        const usage=await p.evaluate(id=>MiceProjectFlow.budgetRows(MiceUI.store.find('projects',id))[0],pid);assert.equal(usage.occupied,20000);assert.equal(usage.remaining,80000);
        await p.evaluate(id=>{const d=MiceUI.store.find('projects',id).delegations[0];d.currency='EUR';},pid);
        assert.equal(await p.evaluate(id=>MiceProjectFlow.budgetRows(MiceUI.store.find('projects',id))[0].remaining,pid),null);
        await p.evaluate(id=>{MiceUI.store.find('projects',id).delegations[0].currency='CNY';MiceUI.store.save();},pid);
      });
      await check('批量修改仅维护草稿资料，逐团建单每团独立金额',async()=>{
        batchIds=[await newGroup('杭州分会场'),await newGroup('苏州分会场')];await choose(batchIds);await batch('work-batch-edit');
        await fill('city-'+batchIds[0],'宁波');await submit('check');await submit('save-valid');
        assert.equal(await p.evaluate(id=>MiceUI.store.find('activities',id).city,batchIds[0]),'宁波');
        await batch('deal-batch');await fill('batchAmount-'+batchIds[0],20000);await fill('batchAmount-'+batchIds[1],25000);await submit('create');await close();
        assert.deepEqual(await p.evaluate(ids=>ids.map(id=>MiceUI.store.data.orders.find(o=>o.activities.includes(id)).amount),batchIds),[20000,25000]);
      });
      await check('报价草稿不建单，可从本团报价资料按此建单',async()=>{
        quoteAid=await newGroup('报价备选场');await choose([quoteAid]);await batch('work-batch-quote');
        await fill('defaultAmount',18000);await fill('rule','会议场地及服务');await act('work-fill-quotes');await submit('check');await submit('save-valid');
        assert.equal(await p.evaluate(id=>MiceUI.store.data.orders.filter(o=>o.activities.includes(id)).length,quoteAid),0);
        await act('project-group-more-view',quoteAid);await p.locator('.mice-project-menu [data-mice-action=project-group-quotes-view]').click();await act('deal-from-quote');await submit('create');await close();
        assert.equal(await p.evaluate(id=>MiceUI.store.data.orders.find(o=>o.activities.includes(id)).amount,quoteAid),18000);
        await p.locator(`[data-activity-select="${quoteAid}"]`).uncheck();
      });
      await check('整包建单带入所选子团，只有一张80000元订单',async()=>{
        packageIds=[await newGroup('整包甲团'),await newGroup('整包乙团')];await choose(packageIds);await batch('project-package-order');
        assert.equal(await p.locator('input[name^=dealGroup]:checked').count(),2);await fill('dealAmount',80000);await submit('create');await close();
        const os=await p.evaluate(ids=>MiceUI.store.data.orders.filter(o=>o.activities.some(a=>ids.includes(a))),packageIds);assert.equal(os.length,1);assert.equal(os[0].amount,80000);assert.equal(os[0].activities.length,2);
      });
      await check('同单最终定价入口仍在原订单，客户订单不重复办理款票',async()=>{
        const id=await newGroup('按实际人数场',true,'actual');const original=await p.evaluate(id=>MiceUI.store.data.orders.find(o=>o.activities.includes(id)),id);assert.equal(original.amount,null);await close();
        await go(`merchant/sales/orders-detail.html?mice=1&orderNo=${original.id}&projectId=${pid}`);await act('deal-final',original.id);await fill('actualQuantity',64);await submit('final');await close();
        const after=await p.evaluate(id=>MiceUI.store.find('orders',id),original.id);assert.equal(after.amount,32000);assert.equal(after.received,0);
        await detail('orders');assert.equal(await p.locator('[data-mice-action=flow-claim]').count(),0);assert.equal(await p.locator('[data-mice-action=flow-invoice]').count(),0);assert.equal(await p.locator('.project-order-table tbody tr').count(),6);
      });
      await check('客户结算确认从列表办理，仅保存认可不改价，原结算可继续',async()=>{
        await go(`merchant/tour/schedules-detail.html?mice=1&id=${aid}&projectId=${pid}`);assert.equal(await p.locator('#mice-app [role=tab]').count(),8);await act('activity-complete');await submit('confirm');
        await list();await projectAction('project-acceptance');assert.equal(await p.locator('#mice-dialog-title').innerText(),'客户结算确认');await p.locator(`[data-customer-order="${oid}"]`).check();await fill('basis','客户确认本场交付完成，原约定30000元无变更');await submit('confirm');
        assert.equal(await p.evaluate(id=>MiceUI.store.find('activities',id).acceptance.status,aid),'已认可');assert.equal(await p.evaluate(id=>MiceUI.store.find('orders',id).amount,oid),30000);
        await detail('orders');await act('customer-settlement-view');assert.equal(await p.locator('.mice-drawer-overlay button[type=submit]').count(),0);await close();
        await go(`merchant/tour/fulfillment-cost.html?type=project&projectId=${pid}&activityId=${aid}&detail=1`);assert.equal(await p.locator('[data-settlement-doc-tab]').count(),10);
      });
      await check('旧六页签链接归位，不再进入重复办理区',async()=>{
        for(const old of ['overview','agreements','receipts','costs','business']){await detail(old);assert(p.url().includes('tab='+({overview:'materials',costs:'settlement'}[old]||'orders')));assert.equal(await p.locator('#mice-app [role=tab]').count(),4);}
      });
      await check('列表收款认领承接原页面，分配范围仅为本项目',async()=>{
        await list();await projectAction('project-collection');await p.waitForURL('**/payment-claim.html?**');assert.equal(new URL(p.url()).searchParams.get('projectId'),pid);await act('finance-claim');
        const ids=await p.locator('.mice-drawer-overlay input[name^="alloc-"]').evaluateAll(nodes=>nodes.map(n=>n.name.slice(6)));
        assert(ids.length>0);assert(await p.evaluate(({ids,pid})=>ids.every(id=>MiceUI.store.find('orders',id).projectId===pid),{ids,pid}));await close();
      });
      await check('终态项目不展示分工、合同及客户确认编辑，子团保留查看',async()=>{
        await p.evaluate(id=>{MiceUI.store.find('projects',id).status='已结项';MiceUI.store.save();},pid);await list();await act('project-more-view',pid);
        const text=await p.locator('.mice-project-menu').innerText();assert(!/分工额度|客户结算确认|结项检查/.test(text));await p.keyboard.press('Escape');
        await detail();assert((await p.locator('.project-activity-table a').allTextContents()).includes('详情'));assert.equal(await p.locator('[data-mice-action=activity-new]').count(),0);assert.equal(await p.locator('[data-mice-action=project-group-batch]').count(),0);await go(`merchant/tour/product-custom-list.html?projectId=${pid}&work=acceptance`);assert.equal(await p.locator('.mice-drawer-overlay').count(),0);assert(!(await p.locator('[data-mice-action=project-new]').isDisabled()));
      });
      await check('1440和1024布局、筛选返回及独立采购菜单',async()=>{
        pid='PRJ-20261008-003';
        for(const width of [1440,1024]){await p.setViewportSize({width,height:1000});for(const tab of ['activities','orders','settlement','materials']){await detail(tab);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await p.locator('.mice-name-cell').first().evaluate(n=>n.getBoundingClientRect().width>=160));if(tab==='activities')assert((await p.locator('.project-activity-table').boundingBox()).y<600);await p.screenshot({path:path.join(out,`${protocol}-${tab}-${width}.png`)});}await list();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,`${protocol}-list-${width}.png`)});await projectAction('project-assignments');await p.waitForTimeout(350);await p.screenshot({path:path.join(out,`${protocol}-assignments-${width}.png`)});await close();}
        await p.locator('[name=keyword]').fill('华辰医药');await p.locator('#mice-project-filter button[type=submit],#mice-project-filter button:not([type])').first().click();const returnUrl=p.url();await act('project-detail',pid);await p.locator('.page-back-link').click();assert.equal(p.url(),returnUrl);
        await go('merchant/tour/fulfillment-cost.html?mice=1&projectId='+pid);assert(await p.locator('[data-mice-action=cost-new]').count()>0);
      });
      await context.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({results,errors,passed:results.filter(r=>r.pass).length},null,2));
    await browser.close();await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
