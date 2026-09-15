const { selectQueryView } = require('./finance-report-browser-support.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const origin = process.env.REPORT_BASE_URL || 'http://127.0.0.1:8002';
  const output = process.env.REPORT_QA_DIR || '/private/tmp/caesar-overview-report-qa';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message));
    const root = page.locator('[data-report-page="overview"]');
    const field = key => root.locator(`[name="${key}"]`);
    const table = key => root.locator(`[data-table="${key}"]`);
    const submit = () => root.locator('form button[type="submit"]').click();
    const reset = () => root.locator('[data-reset]').click();
    const total = () => root.locator('[data-total]').innerText();
    const more = async () => { if (await root.locator('.report-more').first().getAttribute('open') === null) await root.locator('.report-more > summary').click(); };
    const download = async () => {
      const pending = page.waitForEvent('download'); await root.locator('[data-export]').click();
      const file = await pending, target = path.join(output, file.suggestedFilename());
      await file.saveAs(target); return fs.readFile(target, 'utf8');
    };
    await page.goto(origin + '/merchant/data/performance-reports.html');
    await root.locator('[data-total]').waitFor();
    assert.match(await total(), /5.40/);
    assert.match(await root.locator('[data-comparison-period]').innerText(), /2026-04-24 至 2026-04-30/);
    assert.equal(await table('tasks').locator('tbody tr').count(), 3);
    assert.match(await table('tasks').innerText(), /累计进度完成率/);
    assert.match(await table('main').innerText(), /未提供完整资料/);
    await page.screenshot({ path: path.join(output, 'desktop-overview.png') });
    await table('tasks').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'desktop-tasks.png') });
    await field('budget').selectOption('sample'); await submit();
    assert.match(await table('tasks').innerText(), /77.14%/);
    assert.match(await table('tasks').innerText(), /2026-05-31/);
    assert.match(await table('tasks').innerText(), /未提供同进度任务/);
    let csv = await download();
    for (const name of ['比较起止日', '任务与完成率', '期间趋势', '本期来源明细', '发生时组织版本']) assert.ok(csv.includes(name));
    results.push('本期基线、三个任务期间、集团月算例严格非批准、完整导出包含来源和趋势');

    await more(); await field('salesDepartment').selectOption('A呼叫中心（演示）');
    await root.locator('[data-sort="amount"]').click();
    csv = await download(); assert.match(csv, /"全查询范围合计".*"5.40"/); assert.match(csv, /77.14%/);
    await submit(); assert.match(await total(), /2.00/); assert.doesNotMatch(await table('tasks').innerText(), /77.14%/);
    assert.match(await table('trend').innerText(), /2.00/);
    await field('company').selectOption('B'); assert.equal(await field('salesDepartment').inputValue(), '');
    await reset(); await field('responsibility').selectOption('product'); await field('grouping').selectOption('division');
    await submit(); assert.match(await total(), /5.40/); assert.match(await table('main').innerText(), /B公司.*B事业部/s);
    await more(); await field('company').selectOption('A'); await field('productCompany').selectOption('B'); await submit();
    assert.match(await total(), /1.00/);
    await field('responsibility').selectOption('sales');
    csv = await download(); assert.match(csv, /"责任分组","产品事业部"/);
    await reset(); assert.equal(await field('grouping').inputValue(), 'company');
    results.push('共同归属和趋势一致、产品销售独立、无匹配不借任务、待查询不污染导出、责任切换重置');

    await field('start').fill('2026-05-07'); await submit();
    assert.match(await total(), /1.00/);
    const a = table('main').locator('tbody tr').filter({ hasText: 'A公司（演示）' });
    assert.match(await a.innerText(), /0.00/); assert.match(await a.innerText(), /3.50/); assert.match(await a.innerText(), /4.00/);
    await field('end').fill('2026-04-20'); await field('period').selectOption('month');
    assert.equal(await field('start').inputValue(), '2026-04-01'); assert.equal(await field('end').inputValue(), '2026-04-20');
    await submit(); assert.match(await total(), /0.00/);
    await field('start').fill('2024-02-29'); await field('end').fill('2024-02-29'); await field('comparison').selectOption('year'); await submit();
    assert.match(await root.locator('[data-comparison-period]').innerText(), /2023-02-28 至 2023-02-28/);
    assert.match(await table('main').locator('thead').innerText(), /同比增长率/);
    await field('end').fill('2026-05-08'); await submit(); assert.match(await root.locator('[data-error]').innerText(), /截止日/);
    assert.match(await root.locator('[data-comparison-period]').innerText(), /2023-02-28/);
    results.push('仅月年有业绩的组织仍保留、快捷期间遵循结束日、闰日同比及无效日期保留结果');

    await reset(); await root.locator('[name=view]').selectOption('actual'); await submit(); assert.match(await total(), /5.60/);
    await field('budget').selectOption('sample'); await submit(); assert.match(await table('tasks').innerText(), /80.00%/);
    await root.locator('[name=view]').selectOption('changes'); await submit(); assert.match(await total(), /5.30/);
    assert.match(await table('tasks').innerText(), /不适用/); assert.doesNotMatch(await table('tasks').innerText(), /80.00%/);
    await root.locator('.report-columns > summary').click();
    for (const key of ['cumulativeTarget', 'cumulativeCompletion', 'unknownAmount', 'taskVersion']) await root.locator(`[data-column="${key}"]`).check();
    csv = await download(); assert.match(csv, /"累计进度完成率"/); assert.match(csv, /"变化生效日"/);
    assert.equal(await table('sources').locator('tbody tr').count(), 9);
    assert.equal(await root.locator('tbody a, tbody button, [role="dialog"]').count(), 0);
    results.push('回团与变化独立、任务不套变化、可选字段、全查询来源、无业务下钻');

    await reset(); await field('grouping').selectOption('budgetRegion'); await submit();
    await root.locator('.report-columns > summary').click(); await root.locator('[data-column="unknownAmount"]').check();
    assert.match(await table('main').locator('tbody').innerText(), /待补充/);
    await field('unit').selectOption('yuan'); await submit(); csv = await download(); assert.match(csv, /"54,000\.00"/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '收起或展开侧栏' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await table('main').scrollIntoViewIfNeeded();
    await table('main').locator('..').evaluate(e => { e.scrollLeft = e.scrollWidth; });
    await page.screenshot({ path: path.join(output, 'mobile-table.png') });
    await table('tasks').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'mobile-tasks.png') });
    const canvas = root.locator('canvas'); await canvas.scrollIntoViewIfNeeded();
    const pixels = await canvas.evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let count = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) count++; return count; });
    assert.ok(pixels > 100);
    await page.screenshot({ path: path.join(output, 'mobile-trend.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    results.push('未知归属保留金额、元万元导出一致、窄屏内部横滚、趋势画布非空');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/merchant/data/budget-targets.html'); await page.locator('[data-total]').waitFor();
    await page.locator('a[href$="data/performance-reports.html"]').first().click(); await root.locator('[data-total]').waitFor();
    assert.match(await total(), /54,000.00/); assert.equal(await field('unit').inputValue(), 'yuan'); assert.equal(await field('budget').inputValue(), 'none');
    assert.deepEqual(errors, []); results.push('预算管理切回总览按序加载脚本、不读取草稿、无浏览器异常');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
