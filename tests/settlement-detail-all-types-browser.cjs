/* 团期结算的查看入口与办理边界；通过真实按钮检查所有现有团型。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/evidence/settlement-detail-all-types-20261024');
const checks = [], errors = [];
const tabs = ['overview', 'income', 'discount', 'cost', 'orders', 'receipts', 'prepay', 'changes', 'attachments', 'logs'];
const tabNames = ['单据总览', '收入明细', '优惠减免', '成本明细', '订单明细', '收款预收', '预付付款', '变更记录', '附件依据', '结算记录'];
const server = http.createServer((req, res) => {
  try {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});

async function main() {
  fs.mkdirSync(out, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const mode of ['file', 'http']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      page.setDefaultTimeout(6000);
      page.on('pageerror', error => errors.push(mode + ': ' + error.message));
      const url = mode === 'file' ? pathToFileURL(path.join(root, 'merchant/tour/fulfillment-cost.html')).href
        : 'http://127.0.0.1:' + server.address().port + '/merchant/tour/fulfillment-cost.html';
      const click = async selector => { await page.locator(selector).click(); await page.waitForTimeout(260); };
      const tab = name => page.locator('[data-settlement-doc-tab="' + name + '"]').click();
      const close = () => click('#settlementBasisDrawer .modal-close');
      const open = id => click('[data-view-settlement="' + id + '"], [data-open-project-settlement-detail="' + id + '"]');
      const state = () => page.evaluate(() => JSON.stringify({ schedules: ProjectSettlementPage.schedules, mice: MiceUI.store.data }));
      const check = async (name, fn) => {
        await fn(); checks.push(mode + '：' + name); console.log('PASS', mode, name);
      };
      await page.goto(url); await page.waitForTimeout(400);
      await check('所有团型及每条记录都有独立详情入口', async () => {
        const rows = await page.evaluate(() => ProjectSettlementPage.schedules.map(s => ({ id: s.id, type: s.type })));
        assert.deepEqual([...new Set(rows.map(r => r.type))].sort(), ['普通团期', '邮轮团期', '专列团期', '研学团期', '项目团'].sort());
        for (const row of rows) assert.equal(await page.locator('[data-view-settlement="' + row.id + '"], [data-open-project-settlement-detail="' + row.id + '"]').count(), 1, row.id);
      });
      await check('26个项目团示例都能进入结算办理，没有重复查看按钮', async () => {
        const ids = await page.evaluate(() => ProjectSettlementPage.schedules.filter(s => s.miceActivityId).map(s => s.id));
        assert.equal(ids.length, 26);
        assert.doesNotMatch(await page.locator('#scheduleCostRows').innerText(), /查看结算/);
        for (const id of ids) {
          const action = page.locator('[data-open-settlement-basis="' + id + '"]');
          assert.match(await action.innerText(), /^(结算|继续结算|修改结算)$/);
          await action.click();
          await page.locator('#saveSettlementBasis').waitFor({ state: 'visible' });
          assert.equal(await page.locator('#saveSettlementBasis').isVisible(), true, id);
          assert.equal(await page.locator('#projectSettlementBasis').getAttribute('readonly'), null, id);
          assert.match(await page.locator('#submitSettlementApply').innerText(), /提交/);
          await close();
          await page.locator('#settlementBasisDrawer').waitFor({ state: 'hidden' });
        }
        for (const id of ['TR20260920001', 'ST-SG-20250812-001', 'CZ20261112002']) {
          const row = page.locator('#scheduleCostRows tr').filter({ has: page.locator('[data-view-settlement="' + id + '"]') });
          assert.deepEqual(await row.locator('.table-action button').allTextContents(), ['详情']);
        }
      });

      const cases = [
        ['JP20260801001', '普通未开始'], ['EU20260818001', '普通成本复核中'],
        ['EU20240715001', '普通待提交'], ['CR-MED-20250720-001', '邮轮依据待补'],
        ['TR-SILK-20250805-001', '专列成本复核中'], ['TR20260920001', '专列审批中'],
        ['ST-SG-20250812-001', '研学已结算'], ['CZ20261112001', '邮轮共同采购'],
        ['CZ20261112002', '邮轮已结算待补差'], ['PRJ20261024001', '项目团待结算']
      ];
      for (const [id, label] of cases) {
        await check(label + '：十页签只读、关闭不改资料', async () => {
          const before = await state();
          await open(id);
          assert.equal(page.url(), url);
          assert.equal(await page.locator('#settlementBasisTitle').innerText(), id.startsWith('PRJ') ? '项目团结算详情' : '团期结算详情');
          assert.match(await page.locator('#settlementBasisSummary').innerText(), new RegExp(id));
          assert.deepEqual(await page.locator('[data-settlement-doc-tab]').allTextContents(), tabNames);
          assert.equal(await page.locator('[data-settlement-doc-tab=overview]').getAttribute('class'), 'tab-item active');
          for (const name of tabs) {
            await tab(name);
            const panel = page.locator('[data-settlement-doc-panel="' + name + '"]');
            assert.equal(await panel.isVisible(), true);
            const editable = await panel.locator('input,select,textarea').evaluateAll(nodes => nodes.filter(n => n.getClientRects().length && !n.disabled && !n.readOnly).length);
            assert.equal(editable, 0, label + '/' + name);
            const buttons = await panel.locator('button:visible').allTextContents();
            assert(!buttons.some(text => /上传|保存|提交|维护/.test(text)), buttons.join(' / '));
            if (buttons.some(text => /二次结算/.test(text))) {
              assert.equal(name, 'logs');
              assert(['ST-SG-20250812-001', 'CZ20261112002'].includes(id));
            }
          }
          assert.equal(await page.locator('#saveSettlementBasis').isVisible(), false);
          assert.equal(await page.locator('#submitSettlementApply').innerText(), '关闭');
          assert.equal(await state(), before, label + '查看不得改变数据或创建二次结算');
          await click('#submitSettlementApply');
          await page.locator('#settlementBasisDrawer').waitFor({ state: 'hidden' });
          assert.equal(await page.locator('#settlementBasisDrawer').isVisible(), false);
          assert.equal(await state(), before);
        });
      }

      await check('项目与普通详情交替查看，专属内容不串团', async () => {
        await open('PRJ20261024001');
        assert.match(await page.locator('#projectSettlementTaxSummary').innerText(), /含税金额.*预计扣税后.*核定扣税后/s);
        await close(); await open('CZ20261112001'); await tab('cost');
        assert.match(await page.locator('#cruiseCostComparison').innerText(), /共同采购与成本差异/);
        assert.equal(await page.locator('.project-settlement-content').count(), 0);
        await close(); await open('TR-SILK-20250805-001'); await tab('cost');
        assert.equal(await page.locator('#cruiseCostComparison').isVisible(), false);
        assert.match(await page.locator('#settlementCostRows').innerText(), /包列/);
        await close();
      });
      await check('关闭详情后原结算保存及维护成本可继续办理', async () => {
        await click('[data-open-settlement-basis="EU20260818001"]');
        assert.equal(await page.locator('#saveSettlementBasis').isVisible(), true);
        await tab('logs'); assert.equal(await page.locator('#settlementRemark').getAttribute('readonly'), null);
        await tab('attachments'); assert((await page.locator('#settlementAttachmentRows').innerText()).includes('上传'));
        await click('#saveSettlementBasis');
        assert.equal(await page.evaluate(() => ProjectSettlementPage.schedules.find(s => s.id === 'EU20260818001').settlement.basisStatus), '已保存');
        await click('#actionResultModal .modal-close'); await close();
        await click('[data-open-cost="EU20260818001"]');
        assert.equal(await page.locator('#scheduleCostDrawer').isVisible(), true);
        assert.equal(await page.locator('#saveScheduleCost').isVisible(), true);
        await click('#scheduleCostDrawer .modal-close');
      });
      await check('已结算行仅详情，结算记录进入二次结算后才能保存提交差额', async () => {
        await open('ST-SG-20250812-001');
        assert.equal(await page.locator('#startSecondSettlementOverview').isVisible(), false);
        await tab('logs'); await click('#startSecondSettlement');
        assert.equal(await page.locator('#saveSettlementBasis').isVisible(), true);
        assert.match(await page.locator('#secondSettlementScopeRows').innerText(), /1,800.*3,200/s);
        await click('#saveSettlementBasis'); await click('#actionResultModal .modal-close'); await close();
        const before = await state(); await open('ST-SG-20250812-001'); await tab('logs');
        assert.equal(await page.locator('#startSecondSettlement').innerText(), '继续二次结算');
        await close(); assert.equal(await state(), before);
        await open('ST-SG-20250812-001'); await tab('logs'); await click('#startSecondSettlement');
        await click('#submitSettlementApply');
        const second = await page.evaluate(() => ProjectSettlementPage.schedules.find(s => s.id === 'ST-SG-20250812-001').settlement.secondSettlement);
        assert.equal(second.status, '审批中'); assert.equal(second.incomeAdjust, 1800); assert.equal(second.costAdjust, 3200);
        await click('#actionResultModal .modal-close'); await close();
      });
      await check('各状态筛选和1440／1024布局正常，详情操作列可见', async () => {
        for (const width of [1440, 1024]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.locator('#costKeyword').fill('欧洲'); await click('#searchCosts');
          assert.equal(await page.locator('[data-view-settlement="EU20260818001"]').isVisible(), true);
          await page.screenshot({ path: path.join(out, mode + '-list-' + width + '.png') });
          await open('EU20260818001');
          for (const name of tabs) {
            await tab(name);
            const layout = await page.evaluate(() => {
              const body = document.querySelector('#settlementBasisDrawer .modal-body');
              return { width: innerWidth, page: document.documentElement.scrollWidth, client: body.clientWidth, scroll: body.scrollWidth };
            });
            assert(layout.page <= layout.width + 1 && layout.scroll <= layout.client + 1, JSON.stringify(layout));
          }
          await tab('overview'); await page.screenshot({ path: path.join(out, mode + '-detail-' + width + '.png') });
          await close(); assert.equal(await page.locator('#costKeyword').inputValue(), '欧洲');
          await click('#resetCosts');
        }
        await click('[data-settlement-main-tab="已结算"]');
        assert.equal(await page.locator('[data-view-settlement="ST-SG-20250812-001"]').isVisible(), true);
        assert.equal(await page.locator('[data-view-settlement="EU20260818001"]').isVisible(), false);
      });
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, errors }));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => {
  fs.writeFileSync(path.join(out, 'browser-failure.json'), JSON.stringify({ checks, errors, error: error.stack }, null, 2));
  console.error(error); server.close(); process.exitCode = 1;
});
