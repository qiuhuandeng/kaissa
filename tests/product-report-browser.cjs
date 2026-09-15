const { selectQueryView } = require('./finance-report-browser-support.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const origin = process.env.REPORT_BASE_URL || 'http://127.0.0.1:8002';
  const output = '/private/tmp/caesar-product-report-qa';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message));
    const root = page.locator('[data-report-page="products"]');
    const field = key => root.locator(`[name="${key}"]`);
    const table = key => root.locator(`[data-table="${key}"]`);
    const submit = () => root.locator('button[type="submit"]').click();
    const reset = async () => { await page.locator('[data-report-tab=organizations]').click(); await root.locator('[data-reset]').click(); };
    const total = () => root.locator('[data-total]').innerText();
    const more = async () => { if (await root.locator('details.report-more').getAttribute('open') === null) await root.locator('details.report-more > summary').click(); };
    const tab = async key => { await selectQueryView(page, `${key}`); await submit(); };
    const csv = async () => {
      const pending = page.waitForEvent('download'); await root.locator('[data-export]').click();
      const download = await pending, file = path.join(output, download.suggestedFilename());
      await download.saveAs(file); return fs.readFile(file, 'utf8');
    };
    await page.goto(origin + '/merchant/data/product-reports.html'); await root.locator('[data-total]').waitFor();
    assert.match(await total(), /5.40/);
    assert.match(await table('main').innerText(), /产品负责人乙.*待补充/s);
    assert.equal(await table('periods').locator('tbody tr').count(), 5);
    assert.match(await table('periods').innerText(), /2026-04-24 至 2026-04-30/);
    await page.screenshot({ path: path.join(output, 'desktop-product.png') });
    await table('periods').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(output, 'desktop-periods.png') });
    let file = await csv();
    for (const text of ['比较期间与任务依据', '累计进度完成率', '本次查询来源明细', '产品负责人乙', '发生时组织版本']) assert.ok(file.includes(text));
    results.push('归属基线、缺失负责人并列、比较及三种任务期间、完整来源导出');

    await more(); await field('owner').selectOption('产品负责人乙（演示）');
    await root.locator('[data-sort="amount"]').click(); assert.match(await total(), /5.40/);
    file = await csv(); assert.match(file, /"全查询合计","5 个订单.*5.40/);
    await submit(); assert.match(await total(), /1.00/);
    await field('productCompany').selectOption('A'); assert.equal(await field('owner').inputValue(), ''); await submit(); assert.match(await total(), /2.50/);
    await reset(); await more(); await field('company').selectOption('A'); await field('productCompany').selectOption('B'); await submit(); assert.match(await total(), /1.00/);
    await reset(); await more(); await field('ownerState').selectOption('missing'); await submit(); assert.match(await total(), /2.40/);
    await field('view').selectOption('actual'); await submit(); assert.match(await total(), /2.60/);
    results.push('共同筛选、待查询不污染导出、公司切换清理负责人、销售产品独立、负责人缺失');

    await reset(); await field('start').fill('2026-05-07'); await submit();
    await root.locator('.report-columns > summary').click(); await root.locator('[data-column="monthly"]').check();
    const a = table('main').locator('tbody tr').filter({ hasText: 'A产品经营组' });
    assert.match(await a.innerText(), /0.00/); assert.match(await a.innerText(), /2.50/); assert.match(await a.innerText(), /3.00/);
    await field('end').fill('2026-04-20'); await field('period').selectOption('month'); assert.equal(await field('start').inputValue(), '2026-04-01');
    await field('start').fill('2024-02-29'); await field('end').fill('2024-02-29'); await submit();
    assert.match(await table('periods').innerText(), /2023-02-28 至 2023-02-28/);
    await field('end').fill('2026-05-08'); await submit(); assert.match(await root.locator('[data-error]').innerText(), /截止/);
    assert.match(await table('periods').innerText(), /2023-02-28/);
    results.push('零本期组织保留月年业绩、按结束日快捷期间、闰日、错误范围保留原结果');

    await reset(); await tab('structure'); await field('structureBy').selectOption('managementZone'); await submit();
    assert.match(await total(), /5.40/); assert.match(await table('main').innerText(), /海岛经营区/);
    await field('structureBy').selectOption('management'); await submit(); assert.match(await table('main').innerText(), /待确认/);
    await tab('channels'); await field('structureBy').selectOption('type'); await field('channel').selectOption('呼叫中心'); await submit();
    assert.match(await total(), /2.90/); assert.match(await table('main').innerText(), /74.36%/);
    file = await csv(); assert.match(file, /同范围全部渠道来源/); assert.match(file, /O01/);
    await more(); await field('salesDepartment').selectOption('A呼叫中心（演示）'); await submit(); assert.match(await total(), /2.00/);
    assert.match(await table('main').innerText(), /100.00%/);
    results.push('两类分区和经营分类独立、渠道两种分母、限定部门与分母来源导出');

    await reset(); await tab('crossYear'); assert.match(await total(), /7.40/); assert.match(await total(), /5.60.*1.80/);
    file = await csv(); assert.doesNotMatch(file, /已查询范围开始日/); assert.match(file, /未完成/);
    await more(); await field('owner').selectOption('产品负责人乙（演示）'); await submit(); assert.match(await total(), /1.00/);
    await reset(); await tab('crossYear'); await field('crossBasis').selectOption('actual'); await submit(); assert.match(await total(), /5.60/);
    assert.equal(await table('sources').locator('tbody tr').count(), 6);
    await field('targetYear').selectOption('2027'); await submit(); assert.match(await total(), /0.00/);
    assert.equal(await root.locator('tbody a, tbody button, [role="dialog"]').count(), 0);
    results.push('跨年固定截止、共同负责人、实际年份排除未完成、空态与无业务下钻');

    await reset(); await field('unit').selectOption('yuan'); await submit(); file = await csv(); assert.match(file, /54,000.00/);
    await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: '收起或展开侧栏' }).click();
    for (const view of ['organizations', 'structure', 'channels', 'crossYear']) {
      await tab(view); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await table('main').scrollIntoViewIfNeeded(); await table('main').locator('..').evaluate(e => { e.scrollLeft = e.scrollWidth; });
      await page.screenshot({ path: path.join(output, `mobile-${view}.png`) });
      const canvas = root.locator('canvas'); await canvas.scrollIntoViewIfNeeded();
      const pixels = await canvas.evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return d.filter((v, i) => i % 4 === 3 && v).length; });
      assert.ok(pixels > 100);
    }
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(origin + '/merchant/data/budget-targets.html');
    await page.locator('[data-total]').waitFor(); await page.locator('a[href$="data/product-reports.html"]').first().click(); await root.locator('[data-total]').waitFor();
    assert.equal(await page.locator('[data-report-tab=crossYear]').getAttribute('aria-selected'), 'true'); assert.match(await total(), /74,000.00/); assert.deepEqual(errors, []);
    results.push('元万元导出、窄屏四视图内部滚动、画布非空、预算返回不串页');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
