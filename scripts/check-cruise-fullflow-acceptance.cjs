/* Continuous UI acceptance: objects are created by the pages, never injected mid-flow. */
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = path.join(root, process.env.CRUISE_ACCEPTANCE_OUT || 'docs/evidence/cruise-fullflow-acceptance-20261024');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = http.createServer((req, res) => {
    try { const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const base = 'http://127.0.0.1:' + server.address().port + '/merchant/', checks = [], errors = [], cases = [];
  p.setDefaultTimeout(10000); p.on('pageerror', e => errors.push(e.stack)); p.on('dialog', d => d.accept());
  const go = async url => { await p.goto(base + url); await p.waitForTimeout(200); };
  const ok = text => { checks.push(text); console.log('PASS ' + text); };
  const cp = a => p.locator('[data-cp="' + a + '"]').last().click();
  const ci = a => p.locator('[data-ci="' + a + '"]').last().click();
  const rm = (a, id) => p.locator('[data-rm="' + a + '"]' + (id ? '[data-id="' + id + '"]' : '')).last().click();
  const field = k => p.locator('[data-field="' + k + '"]');
  const invField = k => p.locator('[data-f="' + k + '"]');
  const orderField = k => p.locator('[data-co-field="' + k + '"]');
  const shot = async name => { await p.waitForTimeout(350); await p.screenshot({ path: path.join(out, name + '.png') }); };
  async function approve(no) {
    await go('approval/approvals.html?view=todo&approvalNo=' + no);
    await p.locator('#approvalSubmitBtn').waitFor({ state: 'visible' });
    await p.locator('#approvalOpinion').fill('主流程验收：原单据、舱型数量及办理依据已核对（演示）');
    await p.locator('#approvalSubmitBtn').click();
  }
  async function procurement(c) {
    await go('cruise/procurement-orders.html?create=1&contractId=' + c.contract);
    await field('voyage.date').fill(c.date); await field('voyage.back').fill(c.back);
    await field('lines.0.quantity').fill(String(c.quantity));
    if (c.order) await field('salesOrder').fill(c.order);
    await cp('submit');
    const po = await p.evaluate(c => CaesarCruisePurchase.read().orders.find(o => o.voyage.date === c.date && o.contractId === c.contract), c);
    assert.ok(po?.approvalNo); await approve(po.approvalNo);
    let receipt = await p.evaluate(id => CaesarCruisePurchase.read().receipts.find(r => r.sourceId === id), po.id);
    await go('cruise/procurement-receipts.html');
    await p.locator('[data-row="' + receipt.id + '"] [data-cp=receive]').click(); await cp('submit-receipt');
    receipt = await p.evaluate(id => CaesarCruisePurchase.read().receipts.find(r => r.id === id), receipt.id);
    await approve(receipt.approvalNo);
    await go('cruise/procurement-receipts.html?id=' + receipt.id);
    receipt = await p.evaluate(id => CaesarCruisePurchase.read().receipts.find(r => r.id === id), receipt.id);
    assert.equal(receipt.status, '已入库'); assert.equal(receipt.voyageNo, c.voyage);
    Object.assign(c, { po: po.id, receipt: receipt.id });
  }
  async function booking(c, mode) {
    await go('cruise/voyages.html?id=' + c.voyage);
    await p.locator('[data-detail-tab="关联产品"]').click();
    await p.getByRole('link', { name: '销售预订', exact: true }).first().click();
    await p.locator('#orderProcessMode').selectOption(mode);
    await p.locator('#createOrder').click(); await p.locator('#createdTitle').waitFor({ state: 'visible' });
    c.order = await p.locator('#createdOrderNo').innerText();
    const o = await p.evaluate(no => JSON.parse(localStorage.getItem('caesarOrderFinanceEvents')).orders[no], c.order);
    assert.equal(o.cruiseBookingDetails.supply.voyage, c.voyage);
    Object.assign(c, { amount: Number(o.salesSnapshot.customerPayable), deposit: Number(o.cruiseBookingDetails.deposit), schedule: o.sourceNo, people: Number(o.salesSnapshot.peopleCount) });
    await p.locator('[data-next-action="' + (c.nextAction || '查看详情') + '"]').click();
    await p.locator('#orderStatusText').waitFor();
    assert.match(p.url(), new RegExp(c.order));
    c.orderUrl = 'sales/orders-detail.html?type=cruise&orderNo=' + c.order;
    if(c.nextAction === '收款') { await p.locator('#receiptDrawer.show').waitFor(); assert.match(await p.locator('#receiptDrawerSummary').innerText(), new RegExp(c.order)); }
    if(c.nextAction === '补充资料') assert.equal(await p.locator('#tab-travelers').isVisible(), true);
  }
  async function confirmDrawer() {
    await p.locator('[data-action-menu-toggle]').first().click();
    await p.locator('[data-open-detail-action="转确认"]').click();
    await p.locator('#detailActionDrawer.show').waitFor();
  }
  async function claim(c, node) {
    await go(c.orderUrl); await p.locator('[data-tab=receivable]').click();
    await p.locator('#orderPrimaryAction').click(); await p.locator('#receiptDrawer.show').waitFor();
    assert.equal(await p.locator('[data-co-node]').inputValue(), node);
    await p.locator('#receiptDrawer [data-result="提交收款"]').click();
    await p.locator('#receiptDrawer').waitFor({ state: 'hidden' });
    const receipt = await p.evaluate(no => CruiseOrderMainflow.flow(CruiseOrderMainflow.get(no)).receipts.at(-1), c.order);
    assert.equal(receipt.status, '待复核');
    await p.locator('#receiptRows a').last().click(); await p.locator('#reviewDrawer.show').waitFor();
    assert.match(await p.locator('#reviewAllocationRows').innerText(), new RegExp(c.order));
    await p.locator('[data-confirm-review]').click(); await p.locator('#reviewDrawer').waitFor({ state: 'hidden' });
    await go(c.orderUrl);
  }
  async function orderFlow(c) {
    await go(c.orderUrl); await confirmDrawer();
    await orderField('supply').selectOption('已确认'); await orderField('reference').fill(c.receipt + ' / 船方本单确认（演示）');
    await orderField('confirmationMode').selectOption('按本单订金'); await orderField('signingMode').selectOption('先签后收');
    await p.locator('#coSaveConditions').click(); await p.locator('#detailActionDrawerSubmit').click();
    assert.match(await p.locator('#coError').innerText(), /已认款尚未达到/);
    await p.locator('#detailActionDrawer .modal-close').click();
    await claim(c, '订金');
    assert.equal(await p.evaluate(no => CruiseOrderMainflow.financial(CruiseOrderMainflow.get(no)).received, c.order), c.deposit);
    await confirmDrawer(); await p.locator('#detailActionDrawerSubmit').click(); await p.locator('#detailActionDrawer').waitFor({ state: 'hidden' });
    assert.equal(await p.locator('#orderStatusText').innerText(), '已确认');
    const supply = await p.evaluate(no => CaesarCruiseInventory.read().positions.filter(x => x.order === no), c.order);
    assert.equal(supply.length, 1); assert.equal(supply[0].stock, c.voyage + '|BA'); assert.equal(supply[0].quantity, 1); assert.equal(supply[0].status, '订单占用');
    await shot(c.key + '-confirmed');
    await go('tour/schedule-orders-detail.html?type=cruise&orderNo=' + c.order);
    assert.equal(await p.locator('#orderStatusText').innerText(), '已确认');
    await p.locator('[data-tab=contract]').click(); await p.getByRole('link', { name: '准备合同', exact: true }).click();
    await p.waitForTimeout(400);
    const source = await p.evaluate(no => {
      const order = window.ContractPrepareSession?.order || ContractWorkflowSession.orders.find(o => o.id === no);
      return { id: order.id, amount: order.amount, people: order.people.length, source: window.ContractPrepareSession?.source };
    }, c.order);
    assert.equal(source.id, c.order); assert.equal(source.amount, c.amount); assert.equal(source.people, c.people);
    c.contractSource = { sourceOrder: source.id, amount: source.amount, people: source.people, itineraryRows: source.source?.itinerary?.length ?? null };
    await shot(c.key + '-contract-source');
    await claim(c, '尾款');
    assert.equal(await p.evaluate(no => CruiseOrderMainflow.financial(CruiseOrderMainflow.get(no)).received, c.order), c.amount);
    ok(c.key + '：实际新单→订金认款→确认→原合同准备→尾款认款，金额、人数和舱位不变');
  }
  async function fulfillment(c) {
    const manifest = 'cruise/passenger-manifests.html?voyage=' + c.voyage + '&orderNo=' + c.order;
    await go(manifest); await rm('receive-orders'); await rm('receive-order', c.order);
    assert.equal(await p.locator('[data-rm=receive-order][data-id="' + c.order + '"]').count(), 0); await rm('close');
    const group = await p.evaluate(no => CaesarCruiseRooms.read().groups.find(g => g.order === no), c.order);
    assert.equal(group.schedule, c.schedule); assert.equal(group.members.length, c.people);
    await go('cruise/room-assignments.html?voyage=' + c.voyage);
    await rm('import'); await rm('import-next'); await rm('import-next'); await rm('close');
    await go('cruise/room-assignments.html?voyage=' + c.voyage + '&orderNo=' + c.order);
    await rm('assign', group.id); await field('room').selectOption('9234'); await rm('save-room');
    for (const [i, id] of group.members.entries()) {
      await go(manifest + '&person=' + id);
      for (const [k, value] of Object.entries({ name: i ? '周芳' : '周明', surname: 'ZHOU', given: i ? 'FANG' : 'MING', birth: '1990-01-01', passport: 'EACCEPT' + i, expiry: '2032-01-01' })) await field(k).fill(value);
      await field('visa').selectOption('已齐'); await field('photo').selectOption('已齐'); await rm('save-person');
    }
    assert.equal(await p.evaluate(ids=>ids.reduce((n,id)=>n+CaesarCruiseRooms.missing(CaesarCruiseRooms.read().people.find(p=>p.id===id),'2027-02-11').length,0),group.members),0);
    await rm('export'); const download = p.waitForEvent('download'); await rm('download-manifest'); await (await download).saveAs(path.join(out, c.key + '-manifest.xlsx'));
    await rm('submission'); await field('reference').fill(c.key + '-船方回传（演示）'); await field('shipStatus').selectOption('船方已接收'); await rm('save-submission');
    await go('tour/schedules-detail.html?type=cruise&voyage=' + c.voyage + '&scheduleNo=' + c.schedule + '&tab=roster');
    assert.equal(await p.locator('#rosterRows tr').count(), c.people); assert.match(await p.locator('#rosterRows').innerText(), /9234/);
    await go('tour/schedules-detail.html?type=cruise&voyage=' + c.voyage + '&scheduleNo=' + c.schedule + '&tab=files');
    assert.match((await p.locator('[data-cf-preparation]').allTextContents()).join(' '), /船方已接收/);
    await p.locator('[data-cf-execution]').first().click();
    for (const [i, id] of group.members.entries()) {
      await p.locator('[data-cf-travel="' + id + '"]').click();
      await p.locator('[data-cf-field=ticket]').fill(c.key + '-TICKET-' + i);
      await p.locator('[data-cf-field=checkin]').selectOption('已办理'); await p.locator('[data-cf-field=boarding]').selectOption('已登船');
      await p.locator('[data-cf-field=note]').fill('主流程演示登记，非真实船方接口结果'); await p.locator('#cfTravelSave').click();
    }
    await p.locator('[data-cf-close]').first().click(); await shot(c.key + '-departure');
    const count = await p.evaluate(no => CaesarCruiseInventory.read().positions.filter(x => x.order === no).reduce((n, x) => n + x.quantity, 0), c.order);
    assert.equal(count, 1);
    c.fulfillment = { group: group.id, passengers: group.members, room: '9234', boarding: '按演示依据已登记' };
    ok(c.key + '：本单接收→分房→名单下载及提交→原团期船票、登船，履约不重复扣舱');
  }
  async function cancellation(c) {
    await go(c.orderUrl + '&tab=aftersales'); await p.locator('#aftersalesActionButton').click();
    await orderField('afterKind').selectOption('退订退款'); await p.locator('#aftersalesRefundAmount').fill(String(c.amount - 3200));
    await p.locator('#aftersalesDrawerFields textarea').fill('客人出行前整舱退订申请（演示）');
    for(const width of [1440,1024]){await p.setViewportSize({width,height:1000});await p.locator('#aftersalesDrawer .modal-body').evaluate(e=>e.scrollTop=0);assert.equal(await p.locator('#aftersalesDrawer .modal-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);assert.equal(await p.locator('[data-refund-discount-recalc] .description-value').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().width>120)),true);await shot('cancellation-request-'+width);}
    await p.setViewportSize({width:1440,height:1000}); await p.locator('#aftersalesDrawer [data-result="提交售后"]').click();
    await p.locator('#aftersalesDrawer').waitFor({state:'hidden'});
    const record = await p.evaluate(no => Object.values(CruiseAftersales.read().cases).find(c => c.source.orderNo === no), c.order);
    assert.equal(record.paid, c.amount); assert.equal(record.approval, '待确认'); assert.equal(record.funds.length, 0);
    c.aftersale = record.id;
    await p.locator('[data-co-aftersale-link]').click(); await p.locator('#afterSalesDrawer.show').waitFor();
    const f = k => p.locator('#afterSalesDetailSections [name="' + k + '"]');
    assert.equal(await f('paid').inputValue(), String(c.amount)); assert.equal(await f('rooms').inputValue(), '1');
    await p.locator('[data-ca-action=finish]').click(); assert.match(await p.locator('#cruiseAfterResult').innerText(), /审批/);
    for (const [k,v] of Object.entries({approval:'已通过',supplier:'已同意',resource:'归还原库存',manifest:'已更正',services:'已处理',contract:'已办理'})) await f(k).selectOption(v);
    for (const [k,v] of Object.entries({approvalRef:'售后审批回传（演示）',supplierRef:'船方退舱确认（演示）',supplierLoss:'3200',customerDeduction:'3200',resourceRef:'原舱处理回传（演示，未自动执行释放）',manifestRef:'未报船方，确认不列入出团名单',servicesRef:'服务未使用，取消依据（演示）',contractRef:'未签约，无有效合同待解除（演示）'})) await f(k).fill(v);
    await p.locator('[data-ca-action=refund]').click(); await p.getByRole('link',{name:'查看退款',exact:true}).click();
    await p.locator('#refundDetailDrawer.show').waitFor(); assert.match(await p.locator('#refundDetailDrawer').innerText(), new RegExp(c.order));
    await p.locator('#detailPrimaryAction').click(); await p.locator('#confirmRefundExecute').click(); await p.waitForTimeout(250);
    assert.equal(await p.evaluate(id => CruiseAftersales.get(id).funds[0].status, c.aftersale), '待回单');
    const row = p.locator('tr[data-cruise-case="' + c.aftersale + '"]'); await row.locator('[data-primary-action]').click(); await p.locator('#confirmRefundExecute').click(); await p.waitForTimeout(250);
    await row.locator('[data-open-detail]').click(); await p.getByRole('link',{name:'返回售后 '+c.aftersale}).click(); await p.locator('[data-ca-action=finish]').click();
    assert.match(await p.locator('#cruiseAfterResult').innerText(), /已办结/); await shot('cancellation-result');
    await go('tour/schedule-orders-detail.html?type=cruise&orderNo=' + c.order + '&tab=aftersales');
    assert.match(await p.locator('[data-co-aftersale]').innerText(), /已办结/);
    assert.equal(await p.evaluate(no => CruiseOrderMainflow.financial(CruiseOrderMainflow.get(no)).received, c.order), c.amount);
    ok('新订单原抽屉退订申请→原售后核对→原财务退款与回单→两处订单查看结果，未改原实收');
  }
  async function costBoundary(c){
    const key='orders|'+c.po+'|'+c.date, purchase='cruise/procurement-orders.html?id='+c.po+'&closeout='+encodeURIComponent(key);
    await go(purchase);
    const group=await p.evaluate(k=>CruiseCloseout.candidates(CruiseCloseout.context(k))[0],key);
    assert.equal(group.id,c.schedule);assert.deepEqual(group.orders,[c.order]);
    await p.locator('#ccGroup').selectOption(c.schedule);await p.locator('[data-cce=attach]').click();
    assert.match(await p.locator('#ccError').innerText(),/公司.*不一致/);
    await p.locator('[data-cc-field=company]').fill(group.company);await p.locator('[data-cce=attach]').click();
    const amount=await p.evaluate(k=>CruiseCloseout.total(CruiseCloseout.get(k)),key);
    await p.locator('[data-cc-share="0"]').fill(String(amount));await p.locator('[data-cce=save]').click();
    await p.getByRole('link',{name:'进入团期结算',exact:true}).click();
    await p.locator('#scheduleCostDrawer.show').waitFor();
    assert.match(await p.locator('#costDrawerSummary').innerText(),new RegExp(c.schedule));
    assert.equal(await p.locator('#cruiseCostAmount').inputValue(),String(amount));
    await p.locator('#submitScheduleCost').click();assert.match(await p.locator('#actionResultModal').innerText(),/尚未核齐/);
    await go(purchase);await p.locator('[data-cce=confirm]').click();
    assert.equal(await p.locator('[data-cc-field=ticket]').isDisabled(),true);
    await p.getByRole('link',{name:'进入团期结算',exact:true}).click();await p.locator('#scheduleCostDrawer.show').waitFor();
    await p.locator('#submitScheduleCost').click();assert.match(await p.locator('#actionResultModal').innerText(),/本团成本已确认/);
    const costUrl='tour/fulfillment-cost.html?scheduleNo='+encodeURIComponent(c.schedule)+'&cruiseSource='+encodeURIComponent(key);
    await go(costUrl);
    c.cost=await p.evaluate(({key,id})=>{const r=CruiseCloseout.get(key),g=CruiseCostSettlement.getSchedules().find(s=>s.id===id),report=CruiseCloseout.report().find(v=>v.sources.some(s=>s.c.key===key));return {source:key,status:r.status,amount:CruiseCloseout.total(r),shares:r.shares,cost:g.actual,costConfirmed:r.groupResults[id].costConfirmed,settlement:g.settlement.status,profit:report.profit,income:report.income};},{key,id:c.schedule});
    assert.equal(c.cost.cost,amount);assert.equal(c.cost.costConfirmed,true);assert.equal(c.cost.settlement,'待提交');assert.equal(c.cost.income,null);assert.equal(c.cost.profit,null);
    for(const width of [1440,1024]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot(c.key+'-cost-linked-'+width);}
    await go(purchase);assert.equal(await p.locator('[data-cc-share="0"]').isDisabled(),true);await shot(c.key+'-allocation-confirmed');
    await p.setViewportSize({width:1440,height:1000});
    ok(c.key+'新采购'+amount+'元→实际销售团期→原成本确认，原值可复查；公司不符／费用未核不能确认，不虚构收入毛利');
  }

  try {
    const common = { key: '公共切舱', contract: 'HT-YL-001', date: '2026-12-24', back: '2026-12-31', quantity: 5, voyage: 'HC-IDEAL-20261224' };
    cases.push(common); await procurement(common);
    await go('cruise/voyages.html?id=' + common.voyage); await p.locator('[data-detail-tab="关联产品"]').click(); await ci('attach-products'); await p.locator('[data-product=BJ]').check(); await ci('save-products');
    await go('cruise/voyages.html?id=' + encodeURIComponent(common.voyage + '|BA')); await invField('price.first').fill('30000'); await ci('submit-price-detail');
    const request = await p.evaluate(() => CaesarCruiseInventory.read().priceRequests[0]); await approve(request.approvalNo);
    await booking(common, 'hold'); await orderFlow(common); await fulfillment(common); await costBoundary(common);
    const agency = { key: '散位代理', date: '2027-02-04', back: '2027-02-11', quantity: 1, voyage: 'HC-IDEAL-20270204', nextAction: '收款' };
    cases.push(agency);
    await go('cruise/procurement-contracts.html'); await cp('create'); await field('title').fill('理想号按单代理协议（连续验收）'); await field('type').selectOption('散位代理'); await cp('next'); await cp('next'); await cp('submit');
    const agencyContract=await p.evaluate(()=>CaesarCruisePurchase.read().contracts.find(c=>c.title==='理想号按单代理协议（连续验收）')); agency.contract=agencyContract.id; await approve(agencyContract.approvalNo);
    await go('cruise/procurement-contracts.html'); await p.locator('[data-row="'+agency.contract+'"] [data-cp=sign]').click(); await cp('confirm-sign');
    await go('cruise/voyages.html'); await ci('new-voyage'); await invField('date').fill(agency.date); await invField('contractId').selectOption(agency.contract); await ci('save-voyage');
    await booking(agency, 'pending'); await procurement(agency);
    await go(agency.orderUrl);
    assert.equal(await p.evaluate(v => { const s = CaesarCruiseInventory.read(); return CaesarCruiseInventory.count(s, s.stocks.find(x => x.id === v + '|BA')).available; }, agency.voyage), 0);
    await orderFlow(agency); await fulfillment(agency); await costBoundary(agency);
    const cancel = {key:'退订分支',voyage:common.voyage,receipt:common.receipt,nextAction:'补充资料'}; cases.push(cancel);
    await booking(cancel, 'hold'); await orderFlow(cancel); await cancellation(cancel);
    for(const type of ['group','train','free'])for(const area of ['sales/orders-detail','tour/schedule-orders-detail']){
      await go(area+'.html?type='+type);await p.locator('[data-tab=aftersales]').click();await p.locator('#aftersalesActionButton').click();assert.equal(await p.locator('[data-co-field=afterKind]').count(),0);
      for(const width of [1440,1024]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(400);assert.equal(await p.locator('#aftersalesDrawer .modal-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);assert.equal(await p.locator('[data-refund-discount-recalc] .description-value').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().width>120)),true);}
      ok(type+' '+area+' 原售后字段保留，两种宽度摘要与优惠重算可读');
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'continuous.json'), JSON.stringify({ checks, cases, errors, boundaries: ['全部金额为原型示例', '合同准备来源已核对，不代表签约已完成', '本次新单不自动归集到历史成本结算样例'] }, null, 2));
    fs.rmSync(path.join(out, 'failure.json'), { force: true }); fs.rmSync(path.join(out, 'failure.png'), { force: true });
  } catch (error) { fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ error: error.stack, url: p.url(), checks, cases, errors }, null, 2)); await shot('failure'); throw error; }
  finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
