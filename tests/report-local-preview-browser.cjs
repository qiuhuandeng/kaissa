const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..');
const output = process.env.REPORT_QA_DIR || '/private/tmp/caesar-report-local-preview-qa';
const files = ['performance-reports', 'product-reports', 'channel-reports', 'settlement-reports',
  'order-report-details', 'return-report-details', 'budget-targets', 'supplier-reports', 'monthly-profit-reports', 'report-management'];
const selectors = ['[data-report-page="overview"]', '[data-report-page="products"]', '[data-channel-report]',
  '[data-settlement-report]', '[data-report-page="orders"]', '[data-report-page="returns"]',
  '[data-budget-targets]', '[data-supplier-report]', '[data-monthly-profit]', '[data-report-management]'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

async function main() {
  await fs.mkdir(output, { recursive: true });
  const results = [], errors = [], failures = [];
  const server = http.createServer(async (req, res) => {
    try {
      const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(repo + path.sep)) { res.writeHead(403).end(); return; }
      const body = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const url = (file, protocol) => protocol === 'file'
      ? pathToFileURL(path.join(repo, 'merchant/data', file + '.html')).href
      : origin + '/merchant/data/' + file + '.html';
    const newPage = async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.setDefaultTimeout(12000);
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => failures.push({ url: r.url(), error: r.failure() }));
      return page;
    };
    const ready = async page => {
      const file = path.basename(new URL(page.url()).pathname, '.html');
      const root = page.locator('main.finance-report-page' + selectors[files.indexOf(file)]);
      if(file==='monthly-profit-reports') { await root.locator('[data-fr-count]').waitFor(); await root.locator('[name=dataset]').selectOption('demo'); await root.locator('button[type=submit]').click(); }
      else await root.locator('[data-total]').waitFor();
      assert.equal(await root.locator('h1').count(), 1);
      assert.ok(await root.locator('tbody tr').count() > 0);
      assert.doesNotMatch(await root.innerText(), /加载失败|资料未加载/);
      return root;
    };
    const navigate = async (page, file) => {
      const link = page.locator('a[href$="data/' + file + '.html"]').first();
      if (!await link.isVisible()) {
        await page.locator('.nav-parent').filter({ has: link }).first().locator(':scope > .nav-item').click();
      }
      await link.click();
      await page.waitForURL('**/' + file + '.html');
      return ready(page);
    };

    for (const protocol of ['file', 'http']) {
      // A fresh browser context prevents a previously opened report from hiding missing dependencies.
      for (const file of files) {
        const page = await newPage();
        await page.goto(url(file, protocol));
        const root = await ready(page);
        const total=root.locator(file==='monthly-profit-reports'?'[data-fr-count]':'[data-total]');
        const before = await total.innerText();
        await root.locator('form button[type="submit"]').first().click();
        assert.equal(await total.innerText(), before);
        const pending = page.waitForEvent('download');
        await root.locator(file==='monthly-profit-reports'?'[data-fr-export]':'[data-export]').click();
        const download = await pending;
        const target = path.join(output, protocol + '-' + file + '.csv');
        await download.saveAs(target);
        assert.ok((await fs.stat(target)).size > 100);
        await page.screenshot({ path: path.join(output, protocol + '-' + file + '.png') });
        await page.reload();
        await ready(page);
        await page.close();
        results.push(protocol + ': ' + file + ' cold open, query, export and reload');
      }

      const page = await newPage();
      await page.goto(url('report-management', protocol));
      await ready(page);
      for (const file of files) await navigate(page, file);
      await navigate(page, 'budget-targets');
      await page.goBack();
      await page.waitForURL('**/report-management.html');
      await ready(page);
      await page.goForward();
      await page.waitForURL('**/budget-targets.html');
      await ready(page);
      await page.close();
      results.push(protocol + ': all ' + files.length + ' menu entries, repeated entry, back and forward');
    }

    // Delay shared dependencies to expose unordered script execution on HTTP menu navigation.
    for (const file of ['channel-reports', 'settlement-reports', 'budget-targets', 'report-management', 'performance-reports', 'supplier-reports']) {
      const page = await newPage();
      await page.route('**/shared/report-pages.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });
      await page.route('**/shared/overview-report-model.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 400));
        await route.continue();
      });
      await page.route('**/shared/supplier-report-model.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 400));
        await route.continue();
      });
      await page.goto(url('product-analysis', 'http'));
      assert.equal(await page.evaluate(() => Boolean(window.CaesarReports)), false);
      await navigate(page, file);
      await page.close();
      results.push('http: legacy entry to ' + file + ' with delayed dependencies');
    }

    for (const file of files) {
      const page = await newPage();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(url(file, 'file'));
      await ready(page);
      await page.getByRole('button', { name: '收起或展开侧栏' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, 'file-mobile-' + file + '.png') });
      await page.close();
      results.push('file: ' + file + ' at 390px');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    const report = { passed: results.length, origin, results, errors, failures, output };
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
