/* 实点业务按钮：立项、父子团、直接登记采购、款票申请及子团结算。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'docs/evidence/mice-prototype/direct-order-20261024/mainline');
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [], server = http.createServer((req, res) => {
  try { const f = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); res.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html'); res.end(fs.readFileSync(f)); } catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const protocol of ['file', 'http']) {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage(); p.setDefaultTimeout(7000);
      p.on('pageerror', e => errors.push(protocol + ': ' + e.message));
      const url = f => protocol === 'file' ? pathToFileURL(path.join(root, f.split('?')[0])).href + (f.includes('?') ? '?' + f.split('?')[1] : '') : 'http://127.0.0.1:' + server.address().port + '/' + f;
      const go = async f => { await p.goto(url(f)); await p.waitForTimeout(230); };
      const click = async selector => { await p.locator(selector).click(); await p.waitForTimeout(280); };
      const action = (a, id = '') => click('[data-mice-action="' + a + '"]' + (id ? '[data-id="' + id + '"]' : ''));
      const tab = name => click('[role="tab"][data-id="' + name + '"]');
      const fill = (k, v) => p.locator('#mice-form [name="' + k + '"]').fill(String(v));
      const select = (k, v) => p.locator('#mice-form [name="' + k + '"]').selectOption(String(v));
      const submit = async value => { await click('#mice-form button[value="' + value + '"]'); const es = await p.locator('#mice-form .mice-error').allTextContents(); if (es.some(Boolean)) throw new Error(es.filter(Boolean).join('；')); };
      const close = () => click('.mice-close:visible');
      const check = async (name, fn) => { try { await fn(); checks.push(protocol + '：' + name); console.log('PASS', protocol, name); } catch (e) { await p.screenshot({ path: path.join(out, protocol + '-failure.png'), fullPage: true }); fs.writeFileSync(path.join(out, 'failure.txt'), name + '\n' + e.stack + '\n' + await p.locator('body').innerText()); throw e; } };
      let pid, aid, oid, costId;
      await check('独立首次进入项目列表，13项目26团及脚本无错误', async () => { await go('merchant/tour/product-custom-list.html'); assert.deepEqual(await p.evaluate(() => [MiceUI.store.data.projects.length, MiceUI.store.data.activities.length]), [13, 26]); });
      await check('默认立项资料、预算和项目组可直接提交，启用不自动建团或订单', async () => {
        await action('project-new'); await fill('name', '主线验收年度会议项目'); await submit('submit'); await p.waitForURL(/product-custom-detail/);
        pid = new URL(p.url()).searchParams.get('id'); await action('project-info'); await submit('activate');
        assert.deepEqual(await p.evaluate(pid => { const d = MiceUI.store.data, p = d.projects.find(x => x.id === pid); return [p.status, p.originalBudget, p.members.length, d.activities.filter(a => a.projectId === pid).length, d.orders.filter(o => o.projectId === pid).length]; }, pid), ['进行中', 500000, 2, 0, 0]);
      });
      await check('销售分配人员支出额度，父预算余额正确且不生成收入', async () => {
        await action('flow-budget'); await fill('total', 600000); await fill('limit-0', 100000); await fill('limit-1', 500000); await submit('save');
        assert.deepEqual(await p.evaluate(pid => { const p = MiceUI.store.find('projects', pid); return [p.originalBudget, p.delegations[0].costBudget, p.delegations[1].costBudget, p.delegations[0].businessAmount]; }, pid), [600000, 100000, 500000, null]);
      });
      await check('OA未盖章版本不关联，已签版本无重复审批、无重复关联或订单', async () => {
        await tab('agreements'); await action('flow-oa-link'); await select('oaId', 'OA-DEMO-0-2'); await click('#mice-form button[value=link]'); assert.match(await p.locator('[data-error=oaId]').innerText(), /已盖章/); await select('oaId', 'OA-DEMO-0-1'); await submit('link');
        await action('flow-oa-link'); await submit('link');
        assert.deepEqual(await p.evaluate(pid => { const d = MiceUI.store.data, p = d.projects.find(x => x.id === pid); return [p.frameworks.length, p.frameworks[0].status, d.approvals.filter(a => a.projectId === pid).length, d.orders.filter(o => o.projectId === pid).length]; }, pid), [1, '已签归档', 0, 0]);
      });
      await check('项目组编辑、结束参与和导出保留负责事项', async () => {
        await tab('materials'); await action('flow-member-new'); await select('role', '酒店专员'); await fill('note', '酒店与房量安排'); await submit('save');
        await action('flow-member-edit', '2'); await fill('note', '酒店、房量与入住名单'); await submit('save'); await action('flow-member-end', '2'); await submit('save');
        const download = p.waitForEvent('download'); await action('flow-member-export'); const file = await download; await file.saveAs(path.join(out, protocol + '-members.csv'));
        assert.match(fs.readFileSync(path.join(out, protocol + '-members.csv'), 'utf8'), /酒店、房量与入住名单/);
      });
      await check('子团继承会议模式及人员预算，直接登记成交生成唯一订单', async () => {
        await tab('activities'); await action('activity-new'); await fill('name', '上海客户会议'); assert.equal(await p.locator('[name=businessMode]').inputValue(), '会议专票团');
        await select('dealState','confirmed'); await fill('dealName','上海会议服务'); await fill('dealAmount',106000); await fill('dealScope','会议场地、设备及服务');
        await fill('dealConfirmBy','陈经理'); await fill('dealConfirmDate','2026-10-24'); await fill('dealBasis','客户确认函（演示）');
        await p.locator('.mice-deal-extra > summary').click(); await select('salesTaxMethod','standard'); await select('salesTaxRate','6'); await fill('salesTaxBasis','本项服务按已确认口径测算（演示）');
        for(const el of await p.locator('[name^=dealNodeDue]').all())await el.fill('2026-10-24'); await submit('draft');
        aid = await p.evaluate(pid => MiceUI.store.data.activities.find(a => a.projectId === pid).id, pid);
        oid = await p.evaluate(pid => MiceUI.store.data.orders.find(o => o.projectId === pid).id, pid); assert(oid);
        assert.equal(await p.evaluate(pid=>MiceUI.store.data.commitments.filter(c=>c.projectId===pid).length,pid),0);
        assert.equal(await p.evaluate(pid => MiceProjectFlow.budgetRows(MiceUI.store.find('projects', pid))[0].remaining, pid), 80000);
        await action('deal-form-group',aid); await submit('form'); assert.equal(await p.evaluate(id => MiceUI.store.find('activities', id).status, aid), '进行中');
      });
      await check('直接新增采购并保存待确认，确认时核对票面差异，含税总价保持', async () => {
        await go('merchant/tour/fulfillment-cost.html?mice=1&projectId=' + pid);
        assert.equal(await p.locator('[data-mice-action^=inquiry-]').count(), 0);
        assert.equal(await p.locator('script[src*="mice-project-procurement"]').count(), 0);
        assert.equal(await p.evaluate(pid => MiceUI.store.data.costs.filter(c => c.projectId === pid).length, pid), 0);
        await action('cost-new'); await select('scopeType', 'direct'); await select('activityId', aid);
        assert.equal(await p.locator('[name=amount]').inputValue(), '10600'); await fill('basis', '供应商服务确认单（演示），含税金额10600元'); await submit('draft');
        let draft = await p.evaluate(pid => MiceUI.store.data.costs.find(c => c.projectId === pid), pid); costId = draft.id;
        assert.equal(draft.status, '待确认'); assert.equal(draft.activityId, aid); assert.equal(draft.inquiryId, undefined);
        await action('cost-edit', costId); await select('deductionMode', 'full'); await fill('deductionBasis', '预计可扣，最终由财务核对（演示）');
        await select('ocrSample', 'different'); await click('[data-tax-recognize]'); assert.match(await p.locator('[data-tax-recognition]').innerText(), /未上传票据/); await click('[data-tax-adopt]'); assert.equal(await p.locator('[name=expectedTaxRate]').inputValue(), '9'); await submit('confirm');
        const c = await p.evaluate(pid => MiceUI.store.data.costs.find(c => c.projectId === pid), pid); costId = c.id; assert.equal(c.amount, 10600); assert.equal(c.status, '已确认'); assert.equal(c.approvedTax ?? null, null); assert.equal(c.taxOcr.demo, true);
        assert.equal(await p.evaluate(pid => MiceUI.store.data.costs.filter(c => c.projectId === pid).length, pid), 1);
      });
      await check('开票和认领复用原抽屉，提交申请不增加已收或已开票', async () => {
        await go('merchant/tour/product-custom-detail.html?id=' + pid + '&tab=receipts'); const before = await p.evaluate(id => { const o = MiceUI.store.find('orders', id); return [o.received || 0, o.invoiced || 0]; }, oid);
        await action('flow-invoice', oid); assert.equal(await p.locator('[name=invoiceKind]').inputValue(), '增值税专用发票'); await submit('submit'); await action('flow-claim', oid); await submit('submit');
        assert.deepEqual(await p.evaluate(id => { const o = MiceUI.store.find('orders', id); return [o.received || 0, o.invoiced || 0]; }, oid), before);
        assert.equal(await p.evaluate(id => MiceUI.store.data.invoices.find(r => r.allocations.some(a => a.orderId === id)).status, oid), '待财务办理');
        assert.equal(await p.evaluate(id => MiceUI.store.data.claims.find(r => r.allocations.some(a => a.orderId === id)).status, oid), '待财务认款');
      });
      // The existing completion / customer recognition / settlement actions are deliberately used unchanged.
      await check('执行详情与结算详情分开，父项目按原单只计一次', async () => {
        await go('merchant/tour/schedules-detail.html?mice=1&id=' + aid + '&projectId=' + pid); assert.equal(await p.locator('#mice-app [role=tab]').count(), 8);
        await action('activity-complete'); await submit('confirm');
        await go('merchant/tour/product-custom-detail.html?id=' + pid + '&tab=agreements'); await action('customer-settlement-new'); await p.locator('[data-customer-order="' + oid + '"]').check(); await fill('confirmBy','陈经理'); await fill('confirmDate','2026-10-24'); await fill('basis','本场服务完成并确认结算金额（演示）'); await submit('confirm');
        await go('merchant/tour/fulfillment-cost.html?type=project&projectId=' + pid); await click('[data-open-settlement-basis="' + aid + '"]'); assert.equal(await p.locator('[data-settlement-doc-tab]').count(),10);
        await click('[data-settlement-doc-tab=attachments]'); await p.locator('#projectSettlementBasis').fill('本场服务与供应商费用已核对，税额按核定结果续核'); await click('#saveSettlementBasis');
        await click('#submitSettlementApply'); assert.equal(await p.evaluate(aid=>MiceUI.store.data.settlements.find(r=>r.activities.includes(aid)).status,aid),'审批中');
        await go('merchant/tour/product-custom-detail.html?id=' + pid + '&tab=overview');
        const totals = await p.evaluate(pid => MiceTaxSummary.values(pid), pid); assert.equal(totals.grossIncome, 106000); assert.equal(totals.grossCost, 10600); assert.equal(totals.grossProfit, 95400); assert.equal(totals.netProfit, null);
      });
      await check('1440和1024项目总览、款票、费用及预算抽屉无外层溢出', async () => {
        for (const width of [1440, 1024]) {
          await p.setViewportSize({ width, height: 1000 });
          for (const name of ['overview', 'activities', 'agreements', 'receipts', 'costs', 'materials']) { await tab(name); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
          await tab('overview'); await p.screenshot({ path: path.join(out, protocol + '-' + width + '-overview.png') });
          await action('flow-budget'); assert(await p.locator('#mice-form .modal-body').evaluate(n => n.scrollWidth <= n.clientWidth + 1)); await p.screenshot({ path: path.join(out, protocol + '-' + width + '-budget.png') }); await close();
        }
      });
      await ctx.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ checks, errors }, null, 2));
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; server.close(); });
