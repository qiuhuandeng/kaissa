const { run, assert, openReport } = require('./finance-report-browser-support.cjs');
const reports = [
  ['performance-reports', '经营总览', '[data-report-page="overview"]'],
  ['product-reports', '产品经营分析', '[data-report-page="products"]'],
  ['channel-reports', '渠道经营分析', '[data-channel-report]'],
  ['settlement-reports', '业务毛利与结算分析', '[data-settlement-report]'],
  ['supplier-reports', '供应商采购与返点', '[data-supplier-report]'],
  ['monthly-profit-reports', '月度经营损益', '[data-monthly-profit]'],
  ['order-report-details', '订单明细', '[data-report-page="orders"]'],
  ['return-report-details', '回团与履约明细', '[data-report-page="returns"]'],
  ['cashflow-reports', '收退转付明细', '[data-cf-main]'],
  ['balance-reports', '订单收付与往来账龄', '[data-ba-main]'],
  ['prepayment-reports', '预款与保证金', '#finance-prepayments'],
  ['fund-reports', '资金收支与安排', '#finance-funds'],
  ['invoice-reports', '发票与收付款核对', '#finance-invoice-report'],
  ['accounting-reports', '结算与核算核对', '[data-accounting-confirmations]'],
  ['budget-targets', '经营任务与预算', '[data-budget-targets]'],
  ['report-management', '口径与数据核对', '[data-report-management]']
];
run('report-navigation', async ({ page, url, shot, download, passed }) => {
  await page.goto(url('merchant/data/performance-reports.html'));
  for (const [file, title, ready] of reports) {
    await openReport(page, file);
    await page.locator(ready).waitFor();
    assert.match(await page.title(), new RegExp(title));
    assert.match(await page.locator('.nav-secondary-panel a.active').innerText(), new RegExp(title));
    assert.doesNotMatch(await page.locator('.content').innerText(), /加载失败|资料未加载/);
    assert.equal(await page.locator('[data-cf-history]').count(), 0);
    if (file === 'prepayment-reports' || file === 'fund-reports' || file === 'invoice-reports') {
      await page.reload();
      const report = page.locator(ready);
      await report.locator('[name=dataset]').selectOption('demo');
      await report.locator('button[type=submit]').click();
      assert.equal(await report.locator('.cf-error:visible').count(), 0);
      assert(await report.locator('[data-fr-main] tbody tr').count() > 0);
    }
    passed('菜单直达 ' + title);
  }
  assert.equal(await page.locator('.nav-secondary-panel a[data-route-href]').count(), 16);
  assert.equal(await page.locator('[data-report-section=scenarios]').count(), 0);
  await openReport(page, 'balance-reports'); await page.locator('[data-ba-main]').waitFor();
  await openReport(page, 'invoice-reports'); await page.locator('#finance-invoice-report').waitFor();
  let tabs = await page.evaluate(() => JSON.parse(localStorage.getItem('caesar-merchant-tabs')));
  assert(tabs.some(t => t.href === 'data/balance-reports.html' && t.title === '订单收付与往来账龄'));
  assert(tabs.some(t => t.href === 'data/invoice-reports.html' && t.title === '发票与收付款核对'));
  await page.goBack(); await page.locator('[data-ba-main]').waitFor();
  await page.goForward(); await page.locator('#finance-invoice-report').waitFor();
  await page.reload(); await page.locator('#finance-invoice-report').waitFor();
  await shot('menus-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await shot('menus-mobile');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({ width: 1440, height: 1000 });
  passed('独立页签、浏览器返回前进和刷新');
  const aliases = { cashflow: 'cashflow', receipt: 'cashflow', payment: 'cashflow', balances: 'balance', 'ar-ap': 'balance', prepayments: 'prepayment', prepay: 'prepayment', funds: 'fund', fund: 'fund', invoices: 'invoice', accounting: 'accounting', profit: 'monthly-profit' };
  for (const [old, file] of Object.entries(aliases)) {
    await page.goto(url('merchant/finance/finance-reports.html?report=' + old + '&company=A&start=2026-09-01'));
    await page.waitForURL('**/data/' + file + '-reports.html?**');
    assert.equal(new URL(page.url()).searchParams.get('company'), 'A');
    assert.equal(new URL(page.url()).searchParams.get('start'), '2026-09-01');
    if (['receipt', 'payment'].includes(old)) assert.equal(await page.locator('[data-cf-type="' + old + '"]').getAttribute('aria-selected'), 'true');
  }
  await page.goto(url('merchant/finance/finance-reports.html?report=fund&view=pool'));
  await page.waitForURL('**/finance/finance-fund-pool.html?**');
  assert.equal(await page.locator('.nav-secondary-panel a[href*="finance-reports.html"]').count(), 0);
  passed('十二种历史主题与参数承接，资金池仍归财务办理');
  await page.goto(url('merchant/data/return-report-details.html?mode=flows'));
  await page.locator('[data-accounting-confirmations]').waitFor();
  assert.match(page.url(), /accounting-reports/);
  assert.match(await page.locator('[aria-label="财务确认主表"] th').first().innerText(), /确认记录号/);
  assert.equal(await page.locator('[data-rf-mode=completion]').count(), 0);
  await page.goto(url('merchant/data/report-management.html?section=scenarios'));
  await page.locator('[data-report-scenarios] [data-fr-main]').waitFor();
  assert.match(page.url(), /report-scenarios/);
  passed('旧确认发生及验收场景入口承接');
  await page.goto(url('merchant/data/product-reports.html?section=resources'));
  const resources = page.locator('[data-resource-cost]');
  await resources.locator('[name=dataset]').selectOption('demo');
  await resources.locator('[name=product]').fill('地中海邮轮');
  await resources.locator('button[type=submit]').click();
  assert.equal(await resources.locator('[data-fr-main] tbody tr').count(), 1);
  assert.equal(await resources.locator('[data-fr-view=costs]').count(), 0);
  assert.equal(await resources.locator('[data-fr-sections] section').count(), 0);
  const csv = await download(resources.locator('[data-fr-export]'));
  assert.match(csv, /CABIN-01/); assert.doesNotMatch(csv, /AIR-01|RAIL-01|完整分配依据/);
  await shot('product-risk');
  passed('产品资源按明确归属筛选，完整台账不重复');
  await page.evaluate(() => localStorage.setItem('caesar-merchant-tabs', JSON.stringify([
    { href: 'finance/finance-reports.html?report=balances', title: '财务报表' },
    { href: 'finance/finance-reports.html?report=invoices', title: '财务报表' },
    { href: 'data/balance-reports.html', title: '旧账龄标题' },
    { href: 'resource/resource-masterdata.html?type=hotel', title: '酒店库' }
  ])));
  await page.reload();
  tabs = await page.evaluate(() => JSON.parse(localStorage.getItem('caesar-merchant-tabs')));
  assert.equal(tabs.filter(t => t.href === 'data/balance-reports.html').length, 1);
  assert(tabs.some(t => t.href === 'data/invoice-reports.html'));
  assert(tabs.some(t => t.href === 'resource/resource-masterdata.html?type=hotel'));
  passed('旧页签迁移去重，非报表页签参数不受影响');
}).catch(error => { console.error(error); process.exitCode = 1; });
