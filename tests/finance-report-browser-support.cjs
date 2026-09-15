const assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
async function run(name, check) {
  const repo = path.resolve(__dirname, '..'), output = '/private/tmp/caesar-' + name + '-qa'; await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(repo + path.sep)) return res.writeHead(403).end();
    try { res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); } catch { res.end(); }
  });
  let browser; const results = [], errors = [];
  try {
    await new Promise((r, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', r); });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const protocol of ['file', 'http']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => errors.push(r.url() + ':' + r.failure().errorText));
      const url = file => protocol === 'file' ? pathToFileURL(path.join(repo, file.split('?')[0])).href + (file.includes('?') ? '?' + file.split('?')[1] : '') : 'http://127.0.0.1:' + server.address().port + '/' + file;
      const shot = async label => page.screenshot({ path: path.join(output, protocol + '-' + label + '.png') });
      const download = async button => { const p = page.waitForEvent('download'); await button.click(); const d = await p, file = path.join(output, protocol + '-' + d.suggestedFilename()); await d.saveAs(file); return fs.readFile(file, 'utf8'); };
      await check({ page, protocol, url, shot, download, passed: s => results.push(protocol + ': ' + s) });
      await page.close();
    }
    assert.deepEqual(errors, []); await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2)); console.log(JSON.stringify({ output, results, errors }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
}
async function openReport(page, file) {
  if (await page.locator('.nav-collapsed').count()) await page.getByRole('button', { name: '收起或展开侧栏' }).click();
  const link = page.locator('.nav-secondary-panel a[href$="data/' + file + '.html"]');
  if (!await link.isVisible()) await page.locator('.nav-parent').filter({ has: page.locator('a[href$="data/' + file + '.html"]') }).first().locator(':scope > .nav-item').click();
  await link.click();
}
module.exports = { run, assert, openReport };
