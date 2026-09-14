const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..'), output = '/private/tmp/caesar-channel-margin-qa';
async function main() {
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(repo + path.sep)) { res.writeHead(403).end(); return; }
    try { const body = await fs.readFile(file); res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404).end(); }
  });
  let browser; const results = [], errors = [];
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const protocol of ['file', 'http']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', req => errors.push(req.url() + ': ' + req.failure().errorText));
      const url = name => protocol === 'file' ? pathToFileURL(path.join(repo, 'merchant/data', name + '.html')).href : 'http://127.0.0.1:' + server.address().port + '/merchant/data/' + name + '.html';
      const root = page.locator('[data-channel-report]'), host = root.locator('[data-channel-margin]');
      const field = k => host.locator('form [name="' + k + '"]');
      const submit = () => host.locator('button[type="submit"]').click();
      const body = () => host.locator('[aria-label="渠道毛利订单核对"] tbody');
      const download = async () => {
        const pending = page.waitForEvent('download'); await root.locator('[data-export]').click();
        const d = await pending, file = path.join(output, protocol + '-' + d.suggestedFilename()); await d.saveAs(file); return fs.readFile(file, 'utf8');
      };
      await page.goto(url('channel-reports')); await root.locator('[data-total]').waitFor();
      await root.locator('[data-view="margin"]').click();
      assert.equal(await body().locator('tr').count(), 5); assert.equal(await field('dateBasis').inputValue(), 'confirmed');
      assert.match(await host.locator('[data-total]').innerText(), /5 单.*正式校验 0 单/);
      assert.match(await body().innerText(), /适用范围待确认/);
      assert.equal(await host.locator('[aria-label="渠道毛利订单核对"] th').count(), 10);
      await page.screenshot({ path: path.join(output, protocol + '-common-desktop.png') });
      results.push(protocol + ': cold local-safe fifth view and common gaps');

      await field('dataset').selectOption('demo'); await submit();
      assert.match(await host.locator('[data-total]').innerText(), /19 单/);
      const example = body().locator('tr').filter({ has: page.getByText('CM02', { exact: true }) });
      assert.match(await example.innerText(), /10,000.00.*9,000.00.*10.00%.*规则待确认/s);
      await host.locator('[name="marginSize"]').selectOption('5');
      await field('company').selectOption('B');
      await host.locator('[data-margin-sort="order"]').click();
      let csv = await download();
      assert.match(csv, /CM01/); assert.match(csv, /CM20/); assert.ok(!csv.includes('"销售公司","B"'));
      assert.match(csv, /销售内容及基础确认/); assert.match(csv, /升舱优惠与费用分配/); assert.match(csv, /还原影响及原记录调整/);
      assert.match(csv, /"BILL02".*"300.00","250.00","50.00"/);
      await host.locator('.report-columns > summary').click(); await host.locator('[data-margin-column="rawRate"]').check();
      csv = await download(); assert.match(csv, /9.9999%/);
      await submit(); assert.match(await host.locator('[data-total]').innerText(), /1 单/);
      results.push(protocol + ': independent cases, pending query isolation, full CSV and optional precision');

      await field('company').selectOption(''); await field('status').selectOption('资料待补齐'); await submit();
      assert.equal(await body().locator('tr').count(), 3);
      await field('status').selectOption(''); await field('dateBasis').selectOption('actual'); await submit();
      csv = await download(); assert.match(csv, /CM17/); assert.match(csv, /退款支付/); assert.match(csv, /不再次冲减/);
      await host.locator('details.report-more > summary').click();
      await field('order').fill('NONE'); await submit();
      assert.equal(await body().locator('tr').count(), 0); assert.match(await host.locator('[data-total]').innerText(), /0 单.*正式校验 0 单/);
      assert.doesNotMatch(await host.innerText(), /100%通过|全部达标/);
      await field('end').fill('2026-05-08'); await submit(); assert.equal(await host.locator('[data-margin-error]').isVisible(), true);
      results.push(protocol + ': missing data, date basis, empty and invalid query');

      await host.locator('[data-margin-reset]').click();
      await field('dataset').selectOption('demo'); await submit();
      await host.locator('[data-margin-evidence="evidence"] > summary').click();
      assert.equal(await host.locator('[data-margin-result] a, [data-action], dialog').count(), 0);
      await page.screenshot({ path: path.join(output, protocol + '-demo-desktop.png') });
      for (const k of ['details', 'evidence', 'impacts']) {
        const details = host.locator('[data-margin-evidence="' + k + '"]'); await details.evaluate(e => e.open = true);
        await details.scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(output, protocol + '-' + k + '.png') });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: '收起或展开侧栏' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const scroll = host.locator('[aria-label="渠道毛利订单核对"]');
      await scroll.scrollIntoViewIfNeeded();
      assert.equal(await scroll.evaluate(e => e.scrollWidth > e.clientWidth), true);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-left.png') });
      await scroll.evaluate(e => e.scrollLeft = e.scrollWidth);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-right.png') });
      assert.equal(await host.locator('.cm-short').evaluateAll(cells => cells.some(e => e.scrollWidth > e.clientWidth)), false);
      results.push(protocol + ': desktop/mobile evidence, contained scroll and unclipped short values');

      await page.setViewportSize({ width: 1440, height: 1000 });
      await root.locator('[data-view="channels"]').click();
      assert.match(await root.locator('[data-channel-performance] [data-total]').innerText(), /5.40/);
      await root.locator('[data-channel-performance] form [name="basis"]').selectOption('actual');
      await root.locator('[data-channel-performance] button[type="submit"]').click();
      assert.match(await root.locator('[data-channel-performance] [data-total]').innerText(), /5.60/);
      await root.locator('[data-view="margin"]').click(); assert.equal(await field('dateBasis').inputValue(), 'confirmed');
      assert.equal(await field('dataset').inputValue(), 'demo');
      await root.locator('[data-view="channels"]').click();
      assert.match(await root.locator('[data-channel-performance] [data-total]').innerText(), /5.60/);
      results.push(protocol + ': preserved performance state and independent margin state');
      await page.close();
    }
    const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.route('**/shared/channel-margin-model.js', async route => { await new Promise(resolve => setTimeout(resolve, 350)); await route.continue(); });
    await page.goto('http://127.0.0.1:' + server.address().port + '/merchant/data/product-analysis.html');
    const link = page.locator('a[href$="data/channel-reports.html"]').first();
    if (!await link.isVisible()) await page.locator('.nav-parent').filter({ has: link }).first().locator(':scope > .nav-item').click();
    await link.click();
    await page.locator('[data-channel-report] [data-view="margin"]').click();
    await page.locator('[data-channel-margin] [data-total]').waitFor();
    assert.match(await page.locator('[data-channel-margin] [data-total]').innerText(), /5 单/);
    results.push('HTTP menu with delayed dependency remains ordered');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed: results.length, results, errors, output }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, errors, output }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
