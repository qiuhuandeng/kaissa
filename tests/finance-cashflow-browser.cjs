const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..'), output = '/private/tmp/caesar-cashflow-qa';
async function main() {
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(repo + path.sep)) { res.writeHead(403).end(); return; }
    try { res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream' }); res.end(await fs.readFile(file)); }
    catch { res.end(); }
  });
  let browser; const results = [], errors = [];
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const protocol of ['file', 'http']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
      const url = (name = 'finance-reports.html', query = '') => (protocol === 'file' ? pathToFileURL(path.join(repo, 'merchant/finance', name)).href : 'http://127.0.0.1:' + server.address().port + '/merchant/finance/' + name) + query;
      const host = page.locator('#finance-cashflow'), main = host.locator('[data-cf-main]');
      const field = n => host.locator('form [name="' + n + '"]');
      const submit = () => host.locator('button[type=submit]').click();
      const scenario = async c => { await field('dataset').selectOption('demo'); await field('case').selectOption(c); await submit(); };
      const download = async (full = false) => { const pending = page.waitForEvent('download'); await host.locator(full ? '[data-cf-evidence-export]' : '[data-cf-export]').click(); const d = await pending, file = path.join(output, protocol + '-' + d.suggestedFilename()); await d.saveAs(file); return fs.readFile(file, 'utf8'); };
      await page.goto(url());
      await host.locator('[data-cf-notice]').waitFor();
      assert.match(await host.innerText(), /来源待接入/);
      assert.equal(await main.locator('th').count(), 12);
      assert.equal(await main.locator('tbody tr').count(), 0);
      assert.equal(await page.locator('.finance-report-content').isVisible(), false);
      await scenario('CF01');
      assert.equal(await main.locator('tbody tr').count(), 1); assert.match(await main.innerText(), /100,000.00/);
      await host.locator('[data-cf-mode=allocations]').click();
      assert.equal(await main.locator('tbody tr').count(), 3); assert.equal(await main.locator('th').count(), 12);
      results.push(protocol + ': pending formal source and separate document/order queries');

      await host.locator('[data-cf-type=payment]').click(); await scenario('CF10');
      await host.locator('.cf-more > summary').click(); await field('order').fill('KS2026091001'); await submit();
      await host.locator('[data-cf-mode=allocations]').click();
      assert.equal(await main.locator('tbody tr').count(), 1);
      assert.match(await main.innerText(), /7,000.00/); assert.match(await host.locator('[data-cf-totals]').innerText(), /12,000.00/);
      let csv = await download(true); assert.match(csv, /原款与转款依据/); assert.match(csv, /"7000"/); assert.match(csv, /"12000"/);
      assert.equal(await host.locator('[data-cf-print]').isVisible(), false);
      await host.locator('[data-cf-type=refund]').click(); await scenario('CF08');
      assert.match(await main.innerText(), /TK26090801/);
      assert.match(await host.locator('[data-cf-trace]').innerText(), /SK26090801/); assert.match(await host.locator('[data-cf-trace]').innerText(), /ZK26090802/);
      await host.locator('[data-cf-type=transfer]').click(); await scenario('CF14');
      assert.equal(await field('dateBasis').inputValue(), 'confirmedAt');
      assert.match(await main.innerText(), /-6,000.00/); assert.equal(await main.locator('tbody tr').count(), 2);
      results.push(protocol + ': four working views, selected order 7000 versus source 12000, full root chain and reversal');

      await host.locator('[data-cf-type=receipt]').click(); await scenario('CF21');
      assert.equal(await main.locator('tbody tr').count(), 10);
      await host.locator('[data-cf-next]').click(); assert.match(await host.locator('[data-cf-count]').innerText(), /第 2/);
      await field('keyword').fill('NOT-QUERIED');
      csv = await download(); assert.match(csv, /SK260921025/); assert.doesNotMatch(csv, /NOT-QUERIED/);
      assert.match(csv, /'=外部文本,""测试""\n第二行/);
      await host.locator('.cf-columns > summary').click(); await host.locator('[data-cf-column=account]').check();
      assert.equal(await main.locator('th').count(), 13);
      await host.locator('[data-cf-sort=cashIn]').click(); assert.match(await main.locator('tbody tr').first().innerText(), /1,100.00/);
      await page.evaluate(() => { window.print = () => { window.__printed = document.querySelector('[data-cf-print-area]').innerHTML; }; });
      await host.locator('[data-cf-print]').click();
      assert.equal(await host.locator('.cf-print-company').count(), 2);
      assert.equal(await host.locator('.cf-print-company > table:first-of-type tbody tr').count(), 25);
      assert.equal(await host.locator('.cf-print-company').first().locator('table').first().locator('th').count(), 12);
      assert.match(await page.evaluate(() => window.__printed), /SK260921025/);
      await page.evaluate(() => document.body.classList.add('cf-printing'));
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('.sidebar').isVisible(), false);
      await page.pdf({ path: path.join(output, protocol + '-receipts.pdf'), preferCSSPageSize: true });
      await page.screenshot({ path: path.join(output, protocol + '-print.png'), fullPage: true });
      await page.emulateMedia({ media: 'screen' }); await page.evaluate(() => document.body.classList.remove('cf-printing'));
      results.push(protocol + ': full 25-row export/12-column print, multi-company sections, formula escaping and unapplied-filter isolation');

      await field('start').fill('2026-11-01'); await submit();
      assert.equal(await host.locator('.cf-error').isVisible(), true); assert.match(await host.locator('[data-cf-count]').innerText(), /共 25/);
      await field('start').fill('2026-09-01'); await submit(); assert.equal(await main.locator('tbody tr').count(), 0);
      await field('keyword').fill(''); await scenario('CF01');
      await host.locator('.cf-more > summary').click(); await host.locator('.cf-columns > summary').click();
      await page.screenshot({ path: path.join(output, protocol + '-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: '收起或展开侧栏' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await main.scrollIntoViewIfNeeded(); assert.equal(await main.evaluate(e => e.scrollWidth > e.clientWidth), true);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-left.png') });
      await main.evaluate(e => e.scrollLeft = e.scrollWidth);
      assert.equal(await main.locator('td').evaluateAll(es => es.some(e => e.scrollWidth > e.clientWidth + 1)), false);
      await page.screenshot({ path: path.join(output, protocol + '-mobile-right.png') });
      results.push(protocol + ': invalid query retains result, empty query, desktop/mobile contained table and uncropped values');

      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const [report, type] of [['receipt', 'receipt'], ['payment', 'payment']]) {
        await page.goto(url('finance-reports.html', '?report=' + report));
        assert.equal(await host.locator('[data-cf-type=' + type + ']').getAttribute('aria-selected'), 'true');
      }
      await page.goto(url('finance-reports.html', '?report=profit'));
      assert.match(await host.innerText(), /历史原型/); assert.equal(await page.locator('#report-profit').isVisible(), true);
      await host.locator('[data-cf-history]').selectOption('cashflow'); await host.locator('[data-cf-main]').waitFor();
      await page.goto(url('finance-account-settings.html'));
      await page.evaluate(() => window.caesarNavigateTo('finance/finance-reports.html?report=cashflow'));
      await host.locator('[data-cf-main]').waitFor(); await scenario('CF01');
      assert.equal(await main.locator('tbody tr').count(), 1);
      await page.evaluate(() => window.caesarNavigateTo('finance/finance-account-settings.html'));
      await page.waitForURL('**/finance-account-settings.html');
      await page.evaluate(() => window.caesarNavigateTo('finance/finance-reports.html?report=cashflow'));
      await host.locator('[data-cf-main]').waitFor(); await scenario('CF01');
      assert.equal(await main.locator('tbody tr').count(), 1);
      assert.equal(await host.locator('a,[data-action],dialog').count(), 0);
      results.push(protocol + ': old receipt/payment aliases, historical profit, account settings navigation and repeat initialization');
      await page.close();
    }
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ output, results, errors }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
