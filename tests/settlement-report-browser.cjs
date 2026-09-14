const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
async function main() {
  const origin = process.env.REPORT_BASE_URL || 'http://127.0.0.1:8002';
  const output = '/private/tmp/caesar-settlement-report-qa';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message));
    const root = page.locator('[data-settlement-report]');
    const field = n => root.locator(`form [name="${n}"]`);
    const select = (n, v) => field(n).selectOption(v);
    const submit = () => root.locator('button[type="submit"]').click();
    const view = async v => { await root.locator(`[data-view="${v}"]`).click(); await submit(); };
    const body = () => root.locator('[aria-label="结算分析结果"] tbody');
    const total = () => root.locator('[data-total]').innerText();
    const more = async () => { await root.locator('.report-more').evaluate(e => e.open = true); };
    const download = async () => { const pending = page.waitForEvent('download'); await root.locator('[data-export]').click(); const d = await pending; const target = path.join(output, d.suggestedFilename()); await d.saveAs(target); return fs.readFile(target, 'utf8'); };
    await page.goto(origin + '/merchant/data/settlement-reports.html');
    await root.locator('[data-total]').waitFor();
    assert.match(await total(), /6 个.*毛利待确认 6.*5.60/);
    assert.match(await body().innerText(), /收入未确认完整/);
    await page.screenshot({ path: path.join(output, 'desktop-common.png') });
    await select('dataset', 'scenarios'); await submit();
    assert.match(await root.locator('[data-metrics]').innerText(), /24.17%/);
    assert.match(await body().innerText(), /-0.10/);
    await page.screenshot({ path: path.join(output, 'desktop-profit.png') });
    results.push('共同明细56000且缺确认；独立算例正负毛利及零收入，标识分开');

    await select('unit', 'yuan'); await submit();
    await more(); await select('company', 'B公司（演示）');
    await root.locator('[data-sort="profit"]').click();
    let csv = await download();
    assert.match(csv, /29,000.00/); assert.match(csv, /"产品经营公司","全部"/);
    await submit(); assert.match(await total(), /15,000.00/);
    await root.locator('[data-reset]').click(); await select('dataset', 'scenarios'); await submit();
    await more(); await select('quality', 'negative'); await submit();
    assert.equal(await body().locator('tr').count(), 1);
    assert.match(await body().innerText(), /DEMO-T02/);
    results.push('未查询筛选不污染排序导出，单位与组织筛选、负毛利筛选');

    await root.locator('[data-reset]').click(); await select('dataset', 'scenarios');
    await field('start').fill('2026-04-01'); await submit();
    await root.locator('[name="size"]').selectOption('5');
    assert.equal(await body().locator('tr').count(), 5);
    csv = await download(); assert.match(csv, /DEMO-T06/); assert.match(csv, /完整确认依据/);
    await root.locator('[data-page="1"]').click(); assert.equal(await body().locator('tr').count(), 1);
    await root.locator('.report-columns > summary').click(); await root.locator('[data-column="originalCost"]').check();
    await root.locator('[data-column="financeProfit"]').check();
    assert.match(await body().innerText(), /待确认/);
    results.push('分页5行仍导出全量，原结算与财务缺资料可选列');

    await field('start').fill('2026-05-01'); await view('adjustments');
    assert.equal(await field('basis').isVisible(), false);
    assert.match(await body().innerText(), /DEMO-ADJ01/); assert.match(await body().innerText(), /2026-04/);
    assert.match(await body().innerText(), /-0.20/);
    csv = await download(); assert.match(csv, /待确认/); assert.match(csv, /后补成本/);
    assert.match(csv, /"本期已生效毛利影响","-0.20"/);
    assert.match(await root.locator('[data-metrics]').innerText(), /本期已生效毛利影响/);
    await page.screenshot({ path: path.join(output, 'desktop-adjustments.png') });
    await view('groups'); assert.match(await body().innerText(), /24.17%/);
    await view('gaps'); assert.equal(await body().locator('tr').count(), 3);
    results.push('四视图与跨月调整、待确认不计毛利，组毛利仅齐全范围');

    await field('end').fill('2026-05-08'); await submit();
    assert.match(await root.locator('[data-error]').innerText(), /截止/);
    assert.equal(await body().locator('tr').count(), 3);
    await root.locator('[data-reset]').click(); await more(); await field('keyword').fill('不存在的团号'); await submit();
    assert.match(await body().innerText(), /当前条件无记录/);
    assert.equal(await root.locator('[data-result] a, dialog').count(), 0);
    assert.equal(await root.locator('img').evaluateAll(xs => xs.every(x => x.complete && x.naturalWidth > 0)), true);
    results.push('错误日期保留结果、空态、无业务下钻、图标均加载');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '收起或展开侧栏' }).click();
    await root.locator('[data-reset]').click(); await select('dataset', 'scenarios'); await submit();
    for (const v of ['tours', 'groups', 'gaps', 'adjustments']) {
      await view(v); await root.locator('[data-result]').scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const region = root.locator('[aria-label="结算分析结果"]');
      assert.equal(await region.evaluate(e => e.scrollWidth > e.clientWidth), true);
      await page.screenshot({ path: path.join(output, 'mobile-' + v + '.png') });
    }
    results.push('390px四视图只在表格内横滚，无页面撑破');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/merchant/data/product-reports.html');
    await page.locator('[data-total]').waitFor();
    await page.locator('a[href$="data/settlement-reports.html"]').first().click();
    await root.locator('[data-total]').waitFor(); assert.match(await total(), /5.60/);
    assert.deepEqual(errors, []);
    results.push('数据导航进入新报表，切页加载正常，脚本错误0');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
