const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'docs/evidence/mice-prototype/mainline-20261024'), checks = [], errors = [];
const entries = ['merchant/dashboard.html', 'merchant/sales/contracts.html', 'merchant/sales/orders.html', 'merchant/sales/orders-after-sales.html', 'merchant/tour/supplier-reconciliation.html', 'merchant/tour/product-custom-list.html', 'merchant/data/order-report-details.html', 'merchant/data/settlement-reports.html', 'merchant/data/return-report-details.html', 'merchant/data/product-reports.html'];
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const file of entries) {
      const c = await b.newContext(), p = await c.newPage(); p.on('pageerror', e => errors.push(file + ': ' + e.message)); await p.goto(pathToFileURL(path.join(root, file)).href); await p.waitForTimeout(250);
      assert.deepEqual(await p.evaluate(() => [MicePrototypeSeed.projects.length, MicePrototypeSeed.activities.length, !!window.MiceTaxModel]), [13, 26, true]); checks.push('独立入口数据一致：' + file); await c.close();
    }
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } }), p = await c.newPage(); p.setDefaultTimeout(6000); p.on('pageerror', e => errors.push(e.message));
    const go = async q => { await p.goto(pathToFileURL(path.join(root, 'merchant/tour/product-custom-detail.html')).href + q); await p.waitForTimeout(250); };
    const click = async s => { await p.locator(s).click(); await p.waitForTimeout(260); };
    const action = a => click('[data-mice-action=' + a + ']');
    await go('?id=PRJ-20261008-003&tab=overview'); assert.match(await p.locator('#mice-project-body').innerText(), /会议专票团/);
    await action('flow-budget'); await p.locator('[name=total]').fill('1'); await click('#mice-form button[value=save]'); assert.match(await p.locator('[data-error=total]').innerText(), /不得超过/);
    // Restore a valid total through the same form; this only changes the isolated browser fixture.
    await p.locator('[name=total]').fill('600000'); await p.locator('[name=limit-0]').fill('100000'); await p.locator('[name=limit-1]').fill('100000'); await click('#mice-form button[value=save]'); checks.push('大项目预算分配超额提示及保存后重算');
    await click('[role=tab][data-id=activities]'); await action('activity-batch'); await click('[data-entry-mode=import]');
    assert.match(await p.locator('[name=csv]').inputValue(), /项目团名称/); await click('[data-entry-action=import]'); await click('#mice-form button[value=check]');
    assert.match(await p.locator('#mice-entry-check').innerText(), /全部通过/); await click('#mice-form button[value=save-valid]');
    const created = await p.evaluate(() => MiceUI.store.data.activities.filter(a => a.projectId === 'PRJ-20261008-003' && a.name.includes(' · 导入')));
    assert.equal(created.length, 2); assert(created.every(a => a.status === '草稿' && a.businessMode === '会议专票团')); checks.push('年框批量导入默认资料可核对并保存子团，继承会议模式');
    await go('?id=PRJ-20261008-002&tab=activities'); await action('activity-new'); assert.equal(await p.locator('[name=businessMode]').inputValue(), '旅游单团'); assert.equal(await p.locator('[name=service]').inputValue(), '旅游'); await click('.mice-close:visible'); checks.push('旅游父项目新增子团继承旅游模式及服务');
    const issuedProject=await p.evaluate(()=>MiceUI.store.data.invoices.find(r=>r.status==='已开具'&&r.demoPdf)?.projectId);assert(issuedProject,'至少一笔预置发票结果');await go('?id='+issuedProject+'&tab=receipts');
    const delivered = await p.locator('[data-mice-action=flow-invoice-delivery]').count();
    if (!delivered) throw new Error('预置资料缺少已开具发票的交付入口');
    await p.locator('[data-mice-action=flow-invoice-delivery]').first().click(); assert.match(await p.locator('#mice-form').innerText(), /不会实际发送邮件/);
    const preview=p.waitForEvent('popup');await p.locator('#mice-form [data-mice-action=einvoice-download]').click();const pdf=await preview;await pdf.waitForLoadState().catch(()=>{});assert(pdf.url().includes('mice-invoice-result-sample.pdf'));assert(fs.readFileSync(path.join(root,'shared/assets/mice-invoice-result-sample.pdf')).subarray(0,4).toString()==='%PDF');await pdf.close();
    await click('#mice-form button[value=save]'); checks.push('已开具发票PDF在本地文件环境可预览，交付仅登记演示结果');
    await p.goto(pathToFileURL(path.join(root, 'merchant/dashboard.html')).href); await p.waitForTimeout(300);
    const targets = await p.evaluate(() => MiceInsights.reminders('2027-01-01').filter(r => r.detail.includes('业务结算未确认')).map(r => r.url));
    assert(targets.length > 0 && targets.every(u => u.includes('fulfillment-cost.html') && u.includes('type=project'))); checks.push('逾期结算提醒进入团期结算');
    await c.close(); assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'entries-and-exceptions.json'), JSON.stringify({ checks, errors }, null, 2)); console.log(JSON.stringify({ passed: checks.length, errors }));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
