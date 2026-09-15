const { selectQueryView } = require('./finance-report-browser-support.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
async function main() {
  const origin = process.env.REPORT_BASE_URL || 'http://127.0.0.1:8002';
  const output = process.env.REPORT_QA_DIR || '/private/tmp/caesar-channel-report-qa';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message));
    const root = page.locator('[data-channel-report]');
    const field = name => root.locator(`form [name="${name}"]`);
    const select = (name, value) => field(name).selectOption(value);
    const submit = () => root.locator('button[type="submit"]').click();
    const total = () => root.locator('[data-total]').innerText();
    const view = async name => { await selectQueryView(page, `${name}`); await submit(); };
    const more = async () => { if (!await root.locator('details.report-more').evaluate(e => e.open)) await root.locator('details.report-more > summary').click(); };
    const download = async () => { const pending = page.waitForEvent('download'); await root.locator('[data-export]').click(); const f = await pending, target = path.join(output, f.suggestedFilename()); await f.saveAs(target); return fs.readFile(target, 'utf8'); };
    const mainBody = () => root.locator('[aria-label="渠道业绩汇总"] tbody');
    await page.goto(origin + '/merchant/data/channel-reports.html');
    await root.locator('[data-total]').waitFor();
    assert.match(await total(), /6 条业务.*5 单.*5.40/);
    assert.equal(await mainBody().locator('tr').count(), 3);
    await page.screenshot({ path: path.join(output, 'desktop-channels.png') });
    await more(); await select('company', 'A'); await select('productCompany', 'B'); await submit();
    assert.match(await total(), /1.00/);
    await root.locator('[data-reset]').click();
    await select('level', 'region'); await submit();
    assert.match(await mainBody().innerText(), /待补充/);
    results.push('渠道、销售产品责任及未知预算区域，不重复集团内部供应');

    await select('unit', 'yuan'); await select('level', 'department'); await submit();
    await more(); await select('company', 'B');
    await root.locator('[data-sort="amount"]').click();
    await root.locator('[name="size"]').selectOption('5');
    let csv = await download();
    assert.match(csv, /54,000.00/); assert.ok(!csv.includes('"销售公司","B公司（演示）"'));
    assert.equal((csv.match(/^"O\d+"/gm) || []).length, 6);
    await submit(); assert.match(await total(), /19,000.00/);
    await root.locator('[data-reset]').click();
    await select('columns', 'comparison'); await submit();
    assert.match(await mainBody().innerText(), /未提供完整资料/);
    assert.match(await mainBody().innerText(), /未提供批准任务/);
    await root.locator('.report-columns > summary').click();
    await root.locator('[data-column="grossProfit"]').check();
    assert.match(await mainBody().innerText(), /规则及资料待确认/);
    results.push('未查询筛选不污染排序和导出，来源全量导出；同期任务毛利不补造');

    await view('stores'); assert.match(await total(), /1.50/);
    await more(); await select('store', '朝阳门店'); await submit();
    await view('calls'); assert.match(await total(), /2.90/);
    assert.equal(await field('store').count(), 0);
    await select('callLevel', 'person'); await submit();
    assert.equal(await mainBody().locator('tr').count(), 2);
    assert.match(await mainBody().innerText(), /DEMO-S02/); assert.match(await mainBody().innerText(), /DEMO-S03/);
    await page.screenshot({ path: path.join(output, 'desktop-consultants.png') });
    await more(); await select('salesGroup', 'A电销一组'); await select('salesId', 'DEMO-S02');
    await select('company', 'B'); assert.equal(await field('salesGroup').inputValue(), ''); assert.equal(await field('salesId').inputValue(), '');
    await submit(); assert.match(await total(), /0.90/);
    await root.locator('[data-reset]').click(); await select('basis', 'actual'); await submit();
    assert.match(await total(), /2.00/);
    results.push('门店与电销切换清理不适用筛选，同名顾问分员工编号，订单与实际回团独立');

    await view('structure'); await root.locator('[data-reset]').click();
    await more(); await select('channel', '呼叫中心'); await submit();
    assert.match(await mainBody().innerText(), /74.36%/); assert.match(await mainBody().innerText(), /100.00%/);
    await page.screenshot({ path: path.join(output, 'desktop-structure.png') });
    await more(); await select('company', 'A'); await select('productCompany', 'A'); await submit();
    csv = await download(); assert.match(csv, /"跟团游","2.00","100.00%","2.00","100.00%"/);
    await select('structure', 'destination'); await submit();
    assert.match(await mainBody().innerText(), /海南/);
    await root.locator('[data-reset]').click(); await select('basis', 'actual'); await submit(); assert.match(await total(), /5.60/);
    await root.locator('.cr-source > summary').click();
    assert.match(await root.locator('.cr-source tbody').innerText(), /O06/);
    assert.match(await root.locator('.cr-source tbody').innerText(), /FUL-ITEM-10-1/);
    results.push('产品结构两种分母可核对，实际回团明细含跨年和阶段分配');

    await view('channels'); await root.locator('[data-reset]').click();
    await select('period', 'year'); await submit(); assert.match(await total(), /5.90/);
    await select('period', 'custom'); await field('end').fill('2026-05-08'); await submit();
    assert.match(await root.locator('[data-error]').innerText(), /截止/); assert.match(await total(), /5.90/);
    await root.locator('[data-reset]').click(); await more();
    await select('quality', 'amount'); await submit();
    assert.match(await root.locator('[data-result]').innerText(), /当前条件无业务记录/);
    await root.locator('[data-reset]').click();
    assert.equal(await root.locator('[data-result] a, [data-result] [data-action], dialog').count(), 0);
    results.push('年累计、错误日期保留上次结果、空态和无业务下钻');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '收起或展开侧栏' }).click();
    for (const key of ['channels', 'stores', 'calls', 'structure']) {
      await view(key);
      await root.locator('[data-result]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, 'mobile-' + key + '.png') });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await root.locator('[aria-label="渠道业绩汇总"]').evaluate(e => e.scrollWidth >= e.clientWidth), true);
    }
    results.push('390px窄屏四视图表格内滚动，外壳不横向溢出');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/merchant/data/product-reports.html');
    await page.locator('[data-total]').waitFor();
    await page.locator('a[href$="data/channel-reports.html"]').first().click();
    await root.locator('[data-total]').waitFor();
    assert.ok((await total()).length > 0);
    await page.goto(origin + '/merchant/data/report-management.html');
    await page.locator('[data-report-management] [data-total]').waitFor();
    await page.locator('a[href$="data/channel-reports.html"]').first().click();
    await root.locator('[data-total]').waitFor();
    assert.deepEqual(errors, []);
    results.push('产品报表及报表管理到新渠道入口可加载，脚本错误0');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
