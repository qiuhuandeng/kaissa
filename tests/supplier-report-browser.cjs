const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
async function main() {
  const output = '/private/tmp/caesar-supplier-report-qa';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [], errors = [], failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => failures.push(r.url()));
    const root = page.locator('[data-supplier-report]');
    const field = key => root.locator('form [name="' + key + '"]');
    const submit = () => root.locator('form button[type="submit"]').click();
    const total = () => root.locator('[data-total]').innerText();
    const more = async () => { if (!await root.locator('.report-more').evaluate(e => e.open)) await root.locator('.report-more > summary').click(); };
    const select = async (key, value) => { if (!await field(key).isVisible()) await more(); await field(key).selectOption(value); };
    const view = async key => { await root.locator('[data-view="' + key + '"]').click(); await submit(); };
    const reset = () => root.locator('[data-reset]').click();
    const download = async () => { const pending = page.waitForEvent('download'); await root.locator('[data-export]').click(); const d = await pending; const target = path.join(output, d.suggestedFilename()); await d.saveAs(target); return fs.readFile(target, 'utf8'); };
    const url = process.env.REPORT_BASE_URL ? process.env.REPORT_BASE_URL + '/merchant/data/supplier-reports.html' : pathToFileURL(path.resolve(__dirname, '../merchant/data/supplier-reports.html')).href;
    await page.goto(url); await root.locator('[data-total]').waitFor();
    assert.match(await total(), /13 条采购.*12 家供应商.*53.00/);
    assert.match(await root.locator('[data-metrics]').innerText(), /51.70/); assert.match(await root.locator('[data-metrics]').innerText(), /1.30/);
    assert.match(await root.locator('[data-metrics]').innerText(), /间夜/);
    await page.screenshot({ path: path.join(output, 'desktop-summary.png') });
    await select('company', 'B采购公司（演示）');
    await root.locator('[data-sort="amount"]').click();
    await root.locator('[name="size"]').selectOption('5');
    let csv = await download(); assert.match(csv, /53.00/); assert.match(csv, /"采购公司","全部"/);
    assert.equal((csv.match(/^"CG-2026-/gm) || []).length, 13);
    await submit(); assert.doesNotMatch(await total(), /53.00/); await reset();
    results.push('本地独立打开、前十与其他完整、数量分单位、未查询条件不污染分页排序导出');

    await select('dataset', 'gaps'); await submit();
    assert.match(await total(), /1 条待确认/); assert.match(await root.locator('[data-metrics]').innerText(), /暂不排名/);
    await select('quality', 'amount'); await submit(); assert.match(await total(), /采购额 待确认/);
    await reset(); await select('relation', '内部'); await submit(); assert.match(await total(), /8.00/);
    await reset(); await select('currency', 'EUR'); await submit(); assert.match(await total(), /0.50/);
    await reset(); await select('grouping', 'department'); await submit();
    assert.equal(await root.locator('[aria-label="供应商分析结果"] tbody tr').count(), 2);
    results.push('缺数不冒充完整排名、内部单列、欧元不混人民币、同名部门分公司');

    await view('purchases'); await reset(); await select('basis', 'bill'); await submit();
    assert.match(await total(), /40.40/);
    await root.locator('.report-columns > summary').click(); await root.locator('[data-column="billNo"]').check();
    assert.match(await root.locator('[aria-label="供应商分析结果"]').innerText(), /BN-DEMO-/);
    await page.screenshot({ path: path.join(output, 'desktop-purchases.png') });
    csv = await download(); assert.match(csv, /账单确认/); assert.match(csv, /40.40/);
    await field('end').fill('2026-05-08'); await submit(); assert.match(await root.locator('[data-error]').innerText(), /截止/); assert.match(await total(), /40.40/);
    await reset(); await more(); await field('keyword').fill('不存在'); await submit(); assert.match(await root.locator('[data-result]').innerText(), /当前条件无记录/);
    results.push('采购与账单日期金额独立、选列与完整依据、无效日期保留结果及空态');

    await view('rebates'); await reset(); assert.match(await total(), /3 笔返点.*1.00.*0.20/);
    assert.match(await root.locator('[data-metrics]').innerText(), /1.60/);
    await select('basis', 'confirmed'); await submit(); assert.match(await total(), /1.40/);
    await root.locator('.spr-source > summary').click();
    assert.match(await root.locator('[aria-label="返点确认依据"]').innerText(), /2026年4月/);
    assert.match(await root.locator('[aria-label="返点实现记录"]').innerText(), /AP-FD-01/);
    csv = await download(); assert.match(csv, /CF-FD-03/); assert.match(csv, /RC-FD-01/); assert.doesNotMatch(csv, /RC-FD-FUTURE/);
    assert.match(csv, /实现返点金额/); assert.match(await root.locator('[aria-label="返点实现记录"]').innerText(), /实现返点金额/);
    assert.equal(await field('department').count(), 0); assert.equal(await field('category').count(), 0);
    await page.screenshot({ path: path.join(output, 'desktop-rebates.png') });
    results.push('预计与确认分开、上月协议本月确认、截止后收回排除、无不适用采购筛选');

    await view('allocations'); await reset(); assert.match(await total(), /0.90.*-0.60.*1 条待确认/);
    await root.locator('.report-columns > summary').click(); await root.locator('[data-column="originalPeriod"]').check();
    assert.match(await root.locator('[aria-label="供应商分析结果"]').innerText(), /2026-04/);
    assert.equal(await field('basis').count(), 0);
    await page.screenshot({ path: path.join(output, 'desktop-allocations.png') });
    csv = await download(); assert.match(csv, /ADJ-COST-01/); assert.match(csv, /待确认/);
    assert.match(csv, /分配返点金额/); assert.match(await root.locator('[data-result]').innerText(), /分配返点金额/);
    assert.equal(await root.locator('[data-result] a, dialog, [data-action]').count(), 0);
    results.push('分配与实现不混算、成本确认缺数保留、原期间与依据导出、无财务操作和业务下钻');

    await page.setViewportSize({ width: 390, height: 844 });
    for (const key of ['summary', 'purchases', 'rebates', 'allocations']) {
      await view(key); await reset();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, 'mobile-' + key + '.png') });
      const icons = await root.locator('img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0)); assert.equal(icons, true);
    }
    results.push('390像素四视图、表格内部滚动、图标正常');
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors, failures }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
