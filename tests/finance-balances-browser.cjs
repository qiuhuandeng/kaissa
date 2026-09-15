const { selectQueryView } = require('./finance-report-browser-support.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..'), output = '/private/tmp/caesar-balances-qa';
async function main() {
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(repo + path.sep)) return res.writeHead(403).end();
    try { res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); }
    catch { res.end(); }
  });
  let browser; const results = [], errors = [];
  try {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const protocol of ['file', 'http']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
      const url = (query = '?report=balances', name = 'finance-reports.html') => (protocol === 'file' ? pathToFileURL(path.join(repo, 'merchant/finance', name)).href : 'http://127.0.0.1:' + server.address().port + '/merchant/finance/' + name) + query;
      const host = page.locator('#finance-balances'), table = host.locator('[data-ba-main]');
      const field = n => host.locator('form [name="' + n + '"]');
      const submit = () => host.locator('button[type=submit]').click();
      const scenario = async c => { await field('dataset').selectOption('demo'); await field('case').selectOption(c); await submit(); };
      const view = v => selectQueryView(page, v);
      await page.goto(url()); await host.locator('[data-ba-notice]').waitFor();
      assert.match(await host.innerText(), /来源待接入/); assert.equal(await table.locator('tbody tr').count(), 0);
      assert.equal(await table.locator('th').count(), 12); assert.equal(await page.locator('.finance-report-content').isVisible(), false);
      await scenario('BA01'); assert.match(await table.innerText(), /6,000.00/);
      await field('asOf').fill('2026-10-05'); await submit(); assert.match(await table.innerText(), /已结清/);
      await field('asOf').fill('2026-09-30'); await submit(); assert.match(await table.innerText(), /6,000.00/);
      results.push(protocol + ': pending source, historical balances and future receipts');
      await view('ap'); await scenario('BA04'); assert.match(await table.innerText(), /11,000.00/);
      assert.match(await host.locator('[data-ba-totals]').innerText(), /3,000.00/);
      assert.match(await host.locator('[data-ba-totals]').innerText(), /6,000.00/);
      await view('aging'); await field('direction').selectOption('ar'); await field('ageBasis').selectOption('overdue'); await scenario('BA11');
      assert.equal(await host.locator('[data-ba-details] tbody tr').count(), 11);
      assert.match(await table.innerText(), /未到期/); assert.match(await table.innerText(), /当日到期/);
      await page.screenshot({ path: path.join(output, protocol + '-aging.png') });
      await scenario('BA05'); assert.match(await table.innerText(), /缺计龄日期/);
      results.push(protocol + ': AP cash and offsets, overdue buckets, source details and missing dates');
      await view('ar'); await scenario('BA06'); await field('currency').selectOption('USD'); await submit();
      assert.equal(await table.locator('tbody tr').count(), 1); assert.match(await table.innerText(), /1,000.00/);
      await field('currency').selectOption(''); await scenario('BA02'); assert.equal(await table.locator('tbody tr').count(), 1);
      await view('clearing'); await scenario('BA07'); assert.equal(await table.locator('tbody tr').count(), 6);
      assert.match(await table.innerText(), /5,000.00/); assert.match(await table.innerText(), /4,000.00/);
      await page.screenshot({ path: path.join(output, protocol + '-clearing.png') });
      results.push(protocol + ': separate currency and stage debt, paired internal clearing without external sales');
      await view('ar'); await scenario('BA12'); assert.equal(await table.locator('tbody tr').count(), 10);
      await host.locator('[data-ba-next]').click(); assert.match(await host.locator('[data-ba-count]').innerText(), /第 2/);
      await field('party').fill('NOT-QUERIED');
      const wait = page.waitForEvent('download'); await host.locator('[data-ba-evidence-export]').click();
      const d = await wait, file = path.join(output, protocol + '.csv'); await d.saveAs(file);
      const csv = await fs.readFile(file, 'utf8'); assert.doesNotMatch(csv, /NOT-QUERIED/); assert.match(csv, /'=客户,""测试""\n第二行/);
      assert.match(csv, /原确认、调整与核销依据/); assert.match(csv, /32500/);
      await host.locator('.cf-columns > summary').click(); await host.locator('[data-ba-column=cash]').check();
      assert.equal(await table.locator('th').count(), 13);
      await host.locator('[data-ba-sort=balance]').click(); assert.match(await table.locator('tbody tr').first().innerText(), /1,100.00/);
      await field('asOf').fill('2026-11-01'); await submit(); assert.equal(await host.locator('.cf-error').isVisible(), true);
      assert.match(await host.locator('[data-ba-count]').innerText(), /共 25/);
      await field('asOf').fill('2026-09-30'); await submit(); assert.equal(await table.locator('tbody tr').count(), 0);
      await field('party').fill(''); await scenario('BA01'); await host.locator('.cf-columns > summary').click();
      await page.screenshot({ path: path.join(output, protocol + '-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: '收起或展开侧栏' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await table.scrollIntoViewIfNeeded(); assert.equal(await table.evaluate(el => el.scrollWidth > el.clientWidth), true);
      await page.screenshot({ path: path.join(output, protocol + '-mobile.png') });
      await table.evaluate(el => el.scrollLeft = el.scrollWidth);
      assert.equal(await table.locator('td').evaluateAll(es => es.some(e => e.scrollWidth > e.clientWidth + 1)), false);
      assert.equal(await host.locator('a,dialog,[data-action]').count(), 0);
      results.push(protocol + ': complete export, applied filters, field choice, sorting, error and mobile layout');
      await page.goto(url('?report=ar-ap')); await host.locator('[data-ba-main]').waitFor();
      await require('./finance-report-browser-support.cjs').openReport(page, 'cashflow-reports'); await page.locator('[data-cf-main]').waitFor();
      await require('./finance-report-browser-support.cjs').openReport(page, 'balance-reports'); await host.locator('[data-ba-main]').waitFor();
      await page.goto(url('', 'finance-account-settings.html'));
      await page.evaluate(() => window.caesarNavigateTo('finance/finance-reports.html?report=balances'));
      await host.locator('[data-ba-main]').waitFor(); await scenario('BA01'); assert.equal(await table.locator('tbody tr').count(), 1);
      results.push(protocol + ': old alias, report theme and navigation initialization');
      await page.close();
    }
    assert.deepEqual(errors, []); await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ output, results, errors }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
