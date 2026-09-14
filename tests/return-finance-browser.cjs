const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..'), output = '/private/tmp/caesar-return-finance-qa';
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
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const protocol of ['file', 'http']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
      const url = name => protocol === 'file' ? pathToFileURL(path.join(repo, 'merchant/data', name + '.html')).href : 'http://127.0.0.1:' + server.address().port + '/merchant/data/' + name + '.html';
      const root = page.locator('.finance-report-page'), host = root.locator('[data-return-finance]');
      const field = k => host.locator('form [name="' + k + '"]');
      const submit = () => host.locator('button[type="submit"]').click();
      const table = host.locator('[aria-label="财务确认主表"]');
      const download = async () => {
        const pending = page.waitForEvent('download'); await root.locator('[data-export]').click();
        const d = await pending, file = path.join(output, protocol + '-' + d.suggestedFilename()); await d.saveAs(file); return fs.readFile(file, 'utf8');
      };
      await page.goto(url('return-report-details'));
      await root.locator('[data-view="financial"]').click();
      assert.equal(await table.locator('th').count(), 12);
      assert.equal(await table.locator('tbody tr').count(), 6);
      assert.match(await host.locator('[data-rf-total]').innerText(), /56,000.00/);
      assert.match(await table.innerText(), /未提供/);
      assert.equal(await root.locator('form:visible').count(), 1);
      await page.screenshot({ path: path.join(output, protocol + '-common.png') });
      results.push(protocol + ': common records retained with missing accounting amounts');

      await field('dataset').selectOption('demo'); await submit();
      await field('scenario').selectOption('adjustment'); await submit();
      await host.locator('.report-columns > summary').click();
      await host.locator('[data-rf-column="difference"]').check();
      assert.match(await table.innerText(), /9,500.00.*7,200.00.*2,300.00/s);
      await field('scenario').selectOption('net');
      await host.locator('[data-rf-sort="order"]').click();
      let csv = await download();
      assert.match(csv, /2,300.00/); assert.doesNotMatch(csv, /"业务场景","net"/);
      assert.match(csv, /原确认与调整依据/); assert.match(csv, /金额分配依据/);
      await submit(); assert.match(await table.innerText(), /1,700.00/);
      await host.locator('[data-rf-mode="flows"]').click();
      assert.equal(await field('dataset').inputValue(), 'common');
      assert.equal(await table.locator('tbody tr').count(), 0);
      await field('dataset').selectOption('demo'); await submit();
      await field('scenario').selectOption('allocation'); await submit();
      assert.equal(await table.locator('tbody tr').count(), 3);
      assert.match(await host.locator('[data-rf-amounts]').innerText(), /12,000.00.*3,000.00/s);
      await page.screenshot({ path: path.join(output, protocol + '-flows.png') });
      await host.locator('[data-rf-mode="completion"]').click();
      assert.equal(await field('scenario').inputValue(), 'net'); assert.match(await table.innerText(), /1,700.00/);
      results.push(protocol + ': separate modes, unapplied filters, optional columns and full evidence export');

      await host.locator('[data-rf-mode="flows"]').click();
      await field('scenario').selectOption('cross'); await field('periodEnd').fill('2026-05'); await submit();
      assert.equal(await table.locator('tbody tr').count(), 3);
      await field('periodStart').fill('2026-06'); await submit();
      assert.equal(await host.locator('[data-rf-error]').isVisible(), true);
      assert.equal(await table.locator('tbody tr').count(), 3);
      await host.locator('[data-rf-reset]').click(); await field('dataset').selectOption('demo'); await submit();
      await host.locator('[data-rf-size]').selectOption('5');
      csv = await download(); assert.match(csv, /零成本/);
      await host.locator('[data-rf-page="1"]').click();
      await host.locator('details.report-more > summary').click();
      await field('order').fill('NO-SUCH-ORDER'); await submit();
      assert.equal(await table.locator('tbody tr').count(), 0);
      await host.locator('[data-rf-reset]').click(); await field('dataset').selectOption('demo'); await submit();
      assert.equal(await host.locator('a,dialog,[data-action]').count(), 0);
      results.push(protocol + ': financial period independence, invalid query retains result, empty query and full pagination export');

      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: '收起或展开侧栏' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await table.scrollIntoViewIfNeeded();
      assert.equal(await table.evaluate(e => e.scrollWidth > e.clientWidth), true);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-left.png') });
      await table.evaluate(e => e.scrollLeft = e.scrollWidth);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-right.png') });
      assert.equal(await host.locator('.rf-short').evaluateAll(es => es.some(e => e.scrollWidth > e.clientWidth + 1)), false);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await root.locator('[data-view="actual"]').click();
      assert.match(await root.locator('[data-total]').innerText(), /5.60/);
      for (const [key, expected] of [['future', /1.80/], ['adjustments', /未提供完成后调整记录/]]) {
        await root.locator('[data-view="' + key + '"]').click();
        await root.locator(':scope > form button[type="submit"]').click();
        assert.match(await root.locator('[data-total]').innerText(), expected);
      }
      await root.locator(':scope > form [data-reset]').click();
      assert.equal(await root.locator('[data-view="actual"]').getAttribute('aria-selected'), 'true');
      assert.match(await root.locator('[data-total]').innerText(), /5.60/);
      results.push(protocol + ': contained mobile tables, complete numeric values and unchanged other three main tabs');
      await page.close();
    }
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/shared/return-finance-model.js', async route => { await new Promise(resolve => setTimeout(resolve, 350)); await route.continue(); });
    await page.goto('http://127.0.0.1:' + server.address().port + '/merchant/data/product-analysis.html');
    const link = page.locator('a[href$="data/return-report-details.html"]').first();
    if (!await link.isVisible()) await page.locator('.nav-parent').filter({ has: link }).first().locator(':scope > .nav-item').click();
    await link.click(); await page.locator('[data-view="financial"]').click();
    assert.match(await page.locator('[data-rf-total]').innerText(), /56,000.00/);
    results.push('HTTP navigation from legacy page preserves delayed script order');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ output, results, errors }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
